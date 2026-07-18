export async function captureHospitalState(tab) {
  return tab.playwright.evaluate(() => {
    const query = (selector) => document.querySelector(selector);
    const boxOf = (element) => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, right: rect.right, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const overlapArea = (left, right) => !left || !right ? 0
      : Math.max(0, Math.min(left.right, right.right) - Math.max(left.x, right.x))
        * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.y, right.y));
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none"
        && style.visibility !== "hidden" && Number(style.opacity || 1) > 0.01;
    };
    const isRendered = (element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    };

    // Background tabs can throttle the 420ms entrance tween. Count the single
    // rendered proposition by layout; animation timing is evaluated separately.
    const cards = Array.from(document.querySelectorAll(".cutaway-callout-card")).filter(isRendered);
    const card = cards[0] ?? null;
    const scene = query(".cutaway-scene");
    const dashboard = query(".cutaway-flow-dashboard");
    const caption = query(".twin-stage-caption");
    const controls = query(".twin-command-deck");
    const cardBox = boxOf(card);
    const sceneBox = boxOf(scene);
    const dashboardBox = boxOf(dashboard);
    const captionBox = boxOf(caption);
    const controlsBox = boxOf(controls);
    const stageMode = document.body.classList.contains("hospital-stage-mode");
    const mobile = getComputedStyle(query(".cutaway-mobile-callouts")).display !== "none";
    const primaryText = [
      card?.querySelector("strong"),
      card?.querySelector(".cutaway-callout-detail"),
      query(".twin-stage-caption strong"),
      query(".twin-stage-caption p"),
    ].filter(Boolean);
    const primaryFonts = primaryText.map((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const controlButtons = Array.from(document.querySelectorAll(".twin-command-actions button")).filter(isVisible);
    const controlHeights = controlButtons.map((element) => element.getBoundingClientRect().height);
    const textTargets = [
      ...primaryText,
      query(".cutaway-flow-dashboard-header strong"),
      ...Array.from(document.querySelectorAll(".cutaway-flow-metrics dd")),
    ].filter(Boolean);
    const clippedText = textTargets.filter((element) => (
      element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1
    )).length;
    const foregroundAnimationElements = Array.from(document.querySelectorAll(
      ".cutaway-constraint-zone,.cutaway-callout-card,.cutaway-callout-kicker i,.cutaway-lever-beacon,.cutaway-lever-beacon i",
    ));
    const infiniteDefined = foregroundAnimationElements.filter((element) => {
      const style = getComputedStyle(element);
      return style.animationName !== "none"
        && style.animationIterationCount.split(",").some((value) => value.trim() === "infinite");
    }).length;
    const infiniteRunning = foregroundAnimationElements.filter((element) => {
      const style = getComputedStyle(element);
      return style.animationName !== "none"
        && style.animationPlayState.split(",").some((value) => value.trim() === "running")
        && style.animationIterationCount.split(",").some((value) => value.trim() === "infinite");
    }).length;
    const root = query(".twin-shell");
    const cutaway = query(".hospital-cutaway");

    return {
      stateId: root?.dataset.storyStateId,
      beat: root?.dataset.storyBeat,
      pressure: root?.dataset.storyPressure,
      evidenceAligned: root?.dataset.storyEvidenceAligned,
      calloutTitle: card?.querySelector("strong")?.textContent?.trim() ?? null,
      captionTitle: query(".twin-stage-caption strong")?.textContent?.trim() ?? null,
      focusStage: cutaway?.dataset.focus,
      focusKind: cutaway?.dataset.focusKind,
      materializing: cutaway?.dataset.materializingLever,
      visibleCallouts: cards.length,
      mobile,
      stage: stageMode,
      horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      protectedOverlapPx2: Math.round(cards.reduce((total, element) => {
        const box = boxOf(element);
        return total + overlapArea(box, dashboardBox) + overlapArea(box, captionBox) + overlapArea(box, controlsBox);
      }, 0)),
      sceneDashboardOverlapPx2: Math.round(overlapArea(sceneBox, dashboardBox)),
      dashboardCaptionOverlapPx2: Math.round(overlapArea(dashboardBox, captionBox)),
      cardClipped: !mobile && Boolean(cardBox && sceneBox && (
        cardBox.x < sceneBox.x - 1 || cardBox.right > sceneBox.right + 1
        || cardBox.y < sceneBox.y - 1 || cardBox.bottom > sceneBox.bottom + 1
      )),
      clippedText,
      primaryFontMinPx: primaryFonts.length ? Math.min(...primaryFonts) : null,
      minControlHeightPx: controlHeights.length ? Math.min(...controlHeights) : null,
      captionBottom: captionBox?.bottom ?? null,
      viewportHeight: innerHeight,
      captionWithinViewport: !stageMode || Boolean(captionBox && captionBox.bottom <= innerHeight + 0.5),
      infiniteForegroundAnimationsDefined: infiniteDefined,
      infiniteForegroundAnimationsRunning: infiniteRunning,
      cameraPanX: getComputedStyle(scene).getPropertyValue("--camera-pan-x").trim(),
      cameraPanY: getComputedStyle(scene).getPropertyValue("--camera-pan-y").trim(),
    };
  });
}

export async function runHospitalViewport(tab, viewportCapability, specification) {
  if (specification.url && await tab.url() !== specification.url) {
    await tab.goto(specification.url);
    await tab.playwright.waitForTimeout(800);
  }
  await viewportCapability.set({ width: specification.width, height: specification.height });
  const currentStageMode = await tab.playwright.evaluate(
    () => document.body.classList.contains("hospital-stage-mode"),
  );
  if (currentStageMode !== specification.stage) await tab.playwright.getByTestId("story-stage-mode").click();

  const currentStateId = await tab.playwright.evaluate(
    () => document.querySelector(".twin-shell")?.getAttribute("data-story-state-id"),
  );
  if (currentStateId !== "opening:surface") {
    const resetVisible = await tab.playwright.evaluate(() => {
      const button = document.querySelector('[data-testid="story-reset"]');
      if (!button) return false;
      const rect = button.getBoundingClientRect();
      const style = getComputedStyle(button);
      return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
    });
    if (!resetVisible && specification.stage) {
      await tab.playwright.getByTestId("story-stage-mode").click();
      await tab.playwright.getByTestId("story-reset").click();
      await tab.playwright.getByTestId("story-stage-mode").click();
    } else {
      await tab.playwright.getByTestId("story-reset").click();
    }
  }

  await tab.playwright.evaluate(() => scrollTo(0, 0));
  await tab.playwright.waitForTimeout(650);
  const states = [];
  for (let index = 0; index < 19; index += 1) {
    states.push(await captureHospitalState(tab));
    if (index < 18) {
      await tab.playwright.getByTestId("story-next").click();
      await tab.playwright.waitForTimeout(650);
    }
  }
  return { ...specification, states };
}

export function summarizeHospitalViewport(result) {
  const failures = result.states.filter((state) => (
    state.visibleCallouts !== 1
    || state.horizontalOverflow > 0
    || state.protectedOverlapPx2 > 0
    || state.sceneDashboardOverlapPx2 > 0
    || state.dashboardCaptionOverlapPx2 > 0
    || state.cardClipped
    || state.clippedText > 0
    || !state.captionWithinViewport
    || (result.stage && state.captionBottom > result.height - (result.safeMarginPx ?? 0))
    || state.evidenceAligned !== "true"
    || state.primaryFontMinPx < result.minimumBodyTextPx
    || state.minControlHeightPx < 44
    || state.infiniteForegroundAnimationsDefined > 1
    || (result.reducedMotion && state.infiniteForegroundAnimationsDefined !== 0)
  ));
  return {
    id: result.id,
    statesReviewed: result.states.length,
    pass: failures.length === 0,
    failedStateIds: failures.map((state) => state.stateId),
    minimumPrimaryFontPx: Math.min(...result.states.map((state) => state.primaryFontMinPx)),
    minimumControlHeightPx: Math.min(...result.states.map((state) => state.minControlHeightPx)),
    maximumForegroundInfiniteAnimations: Math.max(...result.states.map((state) => state.infiniteForegroundAnimationsDefined)),
    maximumCaptionBottomPx: Math.max(...result.states.map((state) => state.captionBottom)),
  };
}
