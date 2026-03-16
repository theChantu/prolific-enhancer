import "./style.css";
import log from "@/lib/log";
import { getRandomTimeoutMs, scheduleTimeout } from "../lib/utils";
import runEnhancements from "../lib/runEnhancements";
import getSiteAdapter from "../lib/getSiteAdapter";

import type { ContentScriptContext } from "#imports";
import { onExtensionMessage } from "@/messages/onExtensionMessage";
import { SettingsUpdate } from "@/store/createStore";

async function runContentScript(ctx: ContentScriptContext) {
    log("Loaded.");

    function debounce<F extends (...args: any[]) => any>(
        fn: F,
        delay = 300,
    ): (...args: Parameters<F>) => void {
        let timeoutId: ReturnType<typeof setTimeout>;

        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                Promise.resolve(fn(...args)).catch(console.error);
            }, delay);
        };
    }

    let observer: MutationObserver;
    const observerConfig = { childList: true, subtree: true };

    async function safelyRunEnhancements() {
        observer.disconnect();
        try {
            await runEnhancements();
        } finally {
            observer.observe(document.body, observerConfig);
        }
    }

    const debounced = debounce(async (changed?: SettingsUpdate) => {
        observer.disconnect();
        try {
            await runEnhancements(changed);
        } finally {
            observer.observe(document.body, observerConfig);
        }
    }, 300);

    // Observe the DOM for changes and re-run the enhancements if necessary
    observer = new MutationObserver((mutations) => {
        const hasChanges = mutations.some(
            (m) => m.addedNodes.length > 0 || m.removedNodes.length > 0,
        );
        if (!hasChanges) return;

        debounced();
    });

    // Apply the enhancements initially
    await safelyRunEnhancements();

    const ms = getRandomTimeoutMs();
    const pageReloadTimeout = scheduleTimeout(() => {
        if (!document.hidden) {
            pageReloadTimeout.reset();
            return;
        }

        log("Refreshing page...");
        location.reload();
    }, ms);

    const adapter = getSiteAdapter();
    // Automatically refresh page after timeout if applicable
    if (adapter.settings.enableAutoReload) {
        log("Page refresh scheduled.");
        pageReloadTimeout.start();
    }

    onExtensionMessage("store-changed", (payload) => {
        // Ignore if only surveys changed
        const keys = Object.keys(payload);
        if (keys.length === 1 && keys[0] === "surveys") return;

        debounced(payload);
    });
}

export { runContentScript };
