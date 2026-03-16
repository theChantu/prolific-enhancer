import store from "../store/store";
import log from "./log";
import {
    convertCurrencyEnhancement,
    highlightRatesEnhancement,
    newSurveyNotificationsEnhancement,
    surveyLinksEnhancement,
} from "../features";
import getSiteAdapter from "./getSiteAdapter";

import type { ModuleName } from "../adapters/modules/BaseModule";
import type Enhancement from "../features/BaseEnhancement";
import type { Settings, SettingsUpdate } from "@/store/createStore";

type EnhancementConfig = {
    enableKey: keyof Settings & `enable${string}`;
    triggers?: (keyof Settings)[];
    module: ModuleName;
    enhancement: Enhancement;
    priority?: boolean;
};

const ENHANCEMENTS: EnhancementConfig[] = [
    {
        enableKey: "enableCurrencyConversion",
        triggers: ["selectedCurrency"],
        module: "CurrencyConversion",
        enhancement: convertCurrencyEnhancement,
        priority: true,
    },
    {
        enableKey: "enableHighlightRates",
        module: "HighlightRates",
        enhancement: highlightRatesEnhancement,
    },
    {
        enableKey: "enableSurveyLinks",
        module: "SurveyLinks",
        enhancement: surveyLinksEnhancement,
    },
    {
        enableKey: "enableNewSurveyNotifications",
        module: "NewSurveyNotifications",
        enhancement: newSurveyNotificationsEnhancement,
    },
];

const SORTED = [...ENHANCEMENTS].sort((a, b) => +!!b.priority - +!!a.priority);
const ENABLE_KEYS = ENHANCEMENTS.map((e) => e.enableKey);

const adapter = getSiteAdapter();

async function runEnhancements(changed?: SettingsUpdate) {
    log("Running enhancements...");

    if (changed) {
        for (const config of SORTED) {
            if (!adapter.hasModule(config.module)) continue;

            const keyChanged = config.enableKey in changed;
            const keyEnabled = changed[config.enableKey];
            if (keyEnabled === undefined) {
                const settings = await store.get(adapter.siteName, [
                    config.enableKey,
                ]);
                if (!settings[config.enableKey]) continue;
            }

            const triggerChanged = config.triggers?.some((k) => k in changed);

            if (!keyChanged && !triggerChanged) continue;

            if (keyChanged && !keyEnabled) {
                await config.enhancement.revert();
            } else {
                await config.enhancement.run();
            }
        }
        return;
    }

    // Initial run
    const settings = await store.get(adapter.siteName, [...ENABLE_KEYS]);

    for (const config of SORTED) {
        if (!adapter.hasModule(config.module) || !settings[config.enableKey])
            continue;

        await config.enhancement.run();
    }
}

export default runEnhancements;
