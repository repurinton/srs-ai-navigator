import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const worker = `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== "GET") return response;

    const url = new URL(request.url);
    const lastSegment = url.pathname.split("/").pop() ?? "";
    if (lastSegment.includes(".")) return response;

    return env.ASSETS.fetch(new Request(new URL("/index.html", url), request));
  },
};
`;

await rm("dist/client", { recursive: true, force: true });
await mkdir("dist/client", { recursive: true });
await cp("dist/index.html", "dist/client/index.html");
await cp("dist/assets", "dist/client/assets", { recursive: true });
for (const entry of await readdir("public", { withFileTypes: true })) {
  await cp(join("public", entry.name), join("dist/client", entry.name), {
    recursive: entry.isDirectory(),
  });
}

await mkdir("dist/server", { recursive: true });
await writeFile("dist/server/index.js", worker);

await mkdir("dist/.openai", { recursive: true });
await writeFile("dist/.openai/hosting.json", await readFile(".openai/hosting.json"));
