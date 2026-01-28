import store from "./store/store";
import { uiEnhancement } from "./features";
import { log, runEnhancements } from "./utils";
import { defaultVMSettings } from "./store/defaults";

(async function () {
    "use strict";

    log("Loaded.");

    GM.addStyle(`
        .pe-custom-btn {
            padding: 8px 24px;
            border-radius: 4px;
            font-size: 0.9em;
            background-color: #0a3c95;
            color: white;
            cursor: pointer;
            text-decoration: none;
        }
        .pe-custom-btn:hover {
            background-color: #0d4ebf;
            color: white !important;
        }
        .pe-btn-container {
            padding: 0 16px 8px 16px;
        }
        .pe-rate-highlight {
            padding: 3px 4px;
            border-radius: 4px;
            color: black;
        }
        .pe-settings-item {
            display: flex;
        }
        #pe-ui-container {
            position: fixed;
            bottom: auto;
            right: auto;
            min-width: 260px;
            background: rgba(30, 30, 30, 0.9);
            color: white;
            border-radius: 4px;
            padding: 3px 4px;
            z-index: 10000;
            cursor: grab;
            user-select: none;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }
        #pe-ui-container:active #pe-ui-title {
            cursor: grabbing;
        }
        #pe-settings-container {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            gap: 10px;
            min-height: 120px;
        }
        #pe-ui-title {
            font-weight: bold;
            text-align: center;
            font-size: 0.8em;
            letter-spacing: 0.3px;
            background: #0a3c95;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            cursor: grab;
            user-select: none;
        }
    `);

    function debounce<F extends (...args: any[]) => any>(
        fn: F,
        delay = 300,
    ): (...args: Parameters<F>) => void {
        let timeoutId: ReturnType<typeof setTimeout>;
        let runId = 0;

        return (...args) => {
            runId++;
            const currentRun = runId;

            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (currentRun !== runId) return;
                Promise.resolve(fn(...args)).catch(console.error);
            }, delay);
        };
    }

    // Apply the enhancements initially
    await runEnhancements();
    const debounced = debounce(async () => {
        await runEnhancements();
    }, 300);

    // Observe the DOM for changes and re-run the enhancements if necessary
    const observer = new MutationObserver(async (mutations) => {
        const hasChanges = mutations.some(
            (m) => m.addedNodes.length > 0 || m.removedNodes.length > 0,
        );
        if (!hasChanges) return;

        debounced();
    });

    const config = { childList: true, subtree: true };
    observer.observe(document.body, config);

    function createMenuCommandRefresher() {
        const commandIds: ReturnType<typeof GM.registerMenuCommand>[] = [];

        return async function refreshMenuCommands() {
            for (const id of commandIds) {
                GM.unregisterMenuCommand(id);
            }
            commandIds.length = 0;

            const {
                ui: { hidden },
            } = await store.get(["ui"]);

            const id = GM.registerMenuCommand(
                `${hidden ? "Show" : "Hide"} Settings UI`,
                async () => {
                    await store.set({
                        ui: { hidden: !hidden },
                    });
                },
            );
            commandIds.push(id);
        };
    }
    const refreshMenuCommands = createMenuCommandRefresher();
    // Initial menu command setup
    await refreshMenuCommands();
    const unsubscribe = store.subscribe(async (changed) => {
        await refreshMenuCommands();
        debounced();

        uiEnhancement.update(changed);
    });
})();
