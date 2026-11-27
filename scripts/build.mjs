import { build } from "esbuild";
import { mkdir, copyFile, writeFile } from "node:fs/promises";
await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "esm",
  outfile: "dist/app.js",
  minify: true,
  target: ["es2022"],
  legalComments: "eof",
});
await copyFile("index.html", "dist/index.html");
await writeFile("dist/.nojekyll", "");
console.log("Built static application in dist/ (private artwork excluded).");
