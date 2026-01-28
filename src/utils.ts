import store from "./store/store";
import {
    convertCurrencyEnhancement,
    highlightRatesEnhancement,
    newSurveyNotificationsEnhancement,
    surveyLinksEnhancement,
    uiEnhancement,
    updateRates,
} from "./features";

let debugEnabled = false;

async function initDebug() {
    const { enableDebug } = await store.get(["enableDebug"]);
    debugEnabled = enableDebug;
}

const log: typeof console.log = (...args) => {
    if (debugEnabled) console.log("[Prolific Enhancer]", ...args);
};

store.subscribe((changed) => {
    if ("enableDebug" in changed) {
        debugEnabled = changed.enableDebug!;
    }
});

type GetResourceUrlParam = Parameters<typeof GM.getResourceUrl>[0];
type ResourceMap<T extends readonly GetResourceUrlParam[]> = {
    [K in T[number]]?: Awaited<ReturnType<typeof GM.getResourceUrl>>;
};

const fetchResources = <const T extends readonly GetResourceUrlParam[]>(
    ...args: T
) => {
    let promise: Promise<ResourceMap<T>> | null = null;

    return () => {
        if (!promise) {
            promise = (async () => {
                const entries = await Promise.all(
                    args.map(async (name) => {
                        const resource = await GM.getResourceUrl(name);
                        return [name as T[number], resource] as const;
                    }),
                );

                const resources = {} as ResourceMap<T>;

                for (const [name, resource] of entries) {
                    if (resource) resources[name] = resource;
                }

                return resources;
            })();
        }
        return promise;
    };
};

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

async function runEnhancements() {
    log("Running enhancements...");
    const {
        enableCurrencyConversion,
        enableHighlightRates,
        enableSurveyLinks,
        enableNewSurveyNotifications,
        ui: { hidden },
    } = await store.get([
        "enableCurrencyConversion",
        "enableHighlightRates",
        "enableSurveyLinks",
        "enableNewSurveyNotifications",
        "ui",
    ]);

    await Promise.all([
        !enableCurrencyConversion && convertCurrencyEnhancement.revert(),
        !enableHighlightRates && highlightRatesEnhancement.revert(),
        !enableSurveyLinks && surveyLinksEnhancement.revert(),
        !enableNewSurveyNotifications &&
            newSurveyNotificationsEnhancement.revert(),
        hidden && uiEnhancement.revert(),
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
        !hidden && uiEnhancement.apply(),
    ]);
}

const getSharedResources = fetchResources("prolific_logo");
initDebug();
export { log, fetchResources, getSharedResources, clamp, runEnhancements };
