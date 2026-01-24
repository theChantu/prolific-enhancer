import * as esbuild from "esbuild";
import fs from "fs";

const banner = fs.readFileSync("src/userscript.meta.js", "utf8");
const watch = process.argv.includes("--watch");

const ctx = await esbuild.context({
    entryPoints: ["src/main.ts"],
    format: "iife",
    bundle: true,
    logLevel: "info",
    outfile: "dist/prolific-enhancer.user.js",
    target: ["ESNext"],
    banner: { js: banner },
    sourcemap: watch ? "inline" : false,
    platform: "browser",
});

if (watch) {
    console.log("Watching for changes...");
    await ctx.watch();
} else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("Build complete.");
}
