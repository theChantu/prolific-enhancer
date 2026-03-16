import { runContentScript } from "@/content/runContentScript";

export default defineContentScript({
    matches: ["*://*/*"],
    async main(ctx) {
        await runContentScript(ctx);
    },
});
