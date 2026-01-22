import store from "./store";
import {
    convertGbpToUsd,
    notifyNewSurveys,
    highlightHourlyRates,
    insertSurveyLinks,
    updateGbpRate,
} from "./features";
import { log } from "./utils";

(async function () {
    "use strict";

    log("Loaded.");

    // Run on extension setup
    const { initialized } = await store.get({ initialized: false });
    if (!initialized) {
        // Set default values
        await store.set({
            surveys: {},
            gbpToUsd: { rate: 1.35, timestamp: 0 },
            initialized: true,
        });
    }

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

    async function runEnhancements() {
        // Fetch the GBP to USD rate before conversion
        await updateGbpRate();
        // Convert to USD before highlighting rates
        await convertGbpToUsd();
        highlightHourlyRates();
        insertSurveyLinks();
        await notifyNewSurveys();
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
})();
