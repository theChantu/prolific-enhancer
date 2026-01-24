import store from "./store/store";
import {
    convertCurrencyEnhancement,
    newSurveyNotificationsEnhancement,
    highlightRatesEnhancement,
    surveyLinksEnhancement,
    updateRates,
} from "./features";
import { log } from "./utils";
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
        const {
            enableCurrencyConversion = true,
            enableHighlightRates = true,
            enableSurveyLinks = true,
            enableNewSurveyNotifications = true,
        } = await store.get([
            "enableCurrencyConversion",
            "enableHighlightRates",
            "enableSurveyLinks",
            "enableNewSurveyNotifications",
        ]);

        await Promise.all([
            !enableCurrencyConversion && convertCurrencyEnhancement.revert(),
            !enableHighlightRates && highlightRatesEnhancement.revert(),
            !enableSurveyLinks && surveyLinksEnhancement.revert(),
            !enableNewSurveyNotifications &&
                newSurveyNotificationsEnhancement.revert(),
        ]);

        // Convert to selected currency before highlighting rates
        if (enableCurrencyConversion) {
            // Fetch the latest currency rates before conversion
            await updateRates();
        }

        await Promise.all([
            enableCurrencyConversion && convertCurrencyEnhancement.apply(),
            enableHighlightRates && highlightRatesEnhancement.apply(),
            enableSurveyLinks && surveyLinksEnhancement.apply(),
            enableNewSurveyNotifications &&
                newSurveyNotificationsEnhancement.apply(),
        ]);
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

            const settings = await store.get(
                Object.keys(
                    defaultVMSettings,
                ) as (keyof typeof defaultVMSettings)[],
            );

            const { selectedCurrency } = settings;
            // Currency command
            const id = GM.registerMenuCommand(
                `Currency: ${selectedCurrency}`,
                async () => {
                    await store.set({
                        selectedCurrency:
                            selectedCurrency === "USD" ? "GBP" : "USD",
                    });
                    await runEnhancements();
                },
            );
            commandIds.push(id);

            const toggleSettings = Object.keys(settings).filter((key) =>
                key.startsWith("enable"),
            ) as (keyof typeof defaultVMSettings)[];
            for (const setting of toggleSettings) {
                const formattedSettingName = setting
                    .replace("enable", "")
                    .split(/(?=[A-Z])/)
                    .join(" ");

                // Toggle commands
                const id = GM.registerMenuCommand(
                    `${settings[setting] ? "Disable" : "Enable"} ${formattedSettingName}`,
                    async () => {
                        await store.set({
                            [setting]: !settings[setting],
                        });
                        await runEnhancements();
                    },
                );
                commandIds.push(id);
            }
        };
    }
    const refreshMenuCommands = createMenuCommandRefresher();
    // Initial menu command setup
    await refreshMenuCommands();
    const unsubscribe = store.subscribe(async (changed) => {
        await refreshMenuCommands();
    });
})();
