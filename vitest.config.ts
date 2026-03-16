import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "src"),
            "#imports": path.resolve(__dirname, "src/__mocks__/imports.ts"),
        },
    },
    test: {
        include: ["src/**/*.test.ts"],
    },
});
