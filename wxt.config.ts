import { defineConfig } from "wxt";
import { adapterHosts } from "./src/adapters/hosts";

const hostPermissions = adapterHosts.map((host) => `https://${host}/*`);

// See https://wxt.dev/api/config.html
export default defineConfig({
    srcDir: "src",
    modulesDir: "wxt-modules",
    modules: ["@wxt-dev/module-svelte"],
    manifest: {
        host_permissions: hostPermissions,
        permissions: ["storage", "notifications", "tabs"],
    },
});
