import store from "./store";
import {
    convertCurrencyEnhancement,
    newSurveyNotificationsEnhancement,
    highlightRatesEnhancement,
    surveyLinksEnhancement,
    updateGbpRate,
} from "./features";
import { log } from "./utils";
import { vmSettingsDefaults } from "./store";

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
            enableCurrencyConversion: true,
            enableHighlightRates: true,
            enableSurveyLinks: true,
            enableNewSurveyNotifications: true,
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

        // Convert to USD before highlighting rates
        if (enableCurrencyConversion) {
            // Fetch the latest GBP to USD rate before conversion
            await updateGbpRate();
            await convertCurrencyEnhancement.apply();
        }

        await Promise.all([
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

            const values = await store.get(
                Object.keys(
                    vmSettingsDefaults,
                ) as (keyof typeof vmSettingsDefaults)[],
            );

            const settings = { ...vmSettingsDefaults, ...values };

            for (const setting of Object.keys(
                settings,
            ) as (keyof typeof settings)[]) {
                const settingName = setting
                    .replace("enable", "")
                    .split(/(?=[A-Z])/)
                    .join(" ");

                const id = GM.registerMenuCommand(
                    `${settings[setting] ? "Disable" : "Enable"} ${settingName}`,
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
