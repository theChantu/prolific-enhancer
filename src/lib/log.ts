import store from "../store/store";
import { onExtensionMessage } from "@/messages/onExtensionMessage";

let debugEnabled = false;

async function initDebug() {
    const { enableDebug } = await store.get(["enableDebug"]);
    debugEnabled = enableDebug;
}

const log: typeof console.log = (...args) => {
    if (debugEnabled) console.log("[Survey Enhancer]", ...args);
};

onExtensionMessage("store-changed", (changed) => {
    if ("enableDebug" in changed && changed.enableDebug !== undefined) {
        debugEnabled = changed.enableDebug;
    }
});

initDebug();

export default log;
