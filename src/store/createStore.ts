import { defaultSiteSettings } from "./defaultSiteSettings";
import { defaultGlobalSettings } from "./defaultGlobalSettings";
import { storage } from "#imports";

import type { SiteSettings, GlobalSettings } from "../lib/types";

export type Settings = SiteSettings & GlobalSettings;
export type SettingsUpdate = Partial<Settings>;
export type GlobalSettingsUpdate = Partial<GlobalSettings>;
export type SiteSettingsUpdate = Partial<SiteSettings>;

type SiteName = string;

type ResolvedGlobalSettings<K extends readonly (keyof GlobalSettings)[]> = Pick<
    {
        [P in keyof GlobalSettings]: DeepNonNullable<GlobalSettings[P]>;
    },
    K[number]
>;

export type ResolvedSettings<K extends readonly (keyof Settings)[]> = Pick<
    {
        [P in keyof Settings]: DeepNonNullable<Settings[P]>;
    },
    K[number]
>;

export type GlobalListener = (changed: GlobalSettingsUpdate) => void;
export type SiteListener = (
    siteName: SiteName,
    changed: SiteSettingsUpdate,
) => void;

type DeepNonNullable<T> = T extends (...args: any[]) => any
    ? T
    : T extends object
      ? { [K in keyof T]-?: DeepNonNullable<T[K]> }
      : NonNullable<T>;

function deepMerge(target: any, source: any): any {
    if (source === undefined) return target;

    if (
        typeof target === "object" &&
        target !== null &&
        typeof source === "object" &&
        source !== null
    ) {
        const merged = { ...target };
        for (const key of Object.keys(source)) {
            merged[key] = deepMerge(target[key], source[key]);
        }
        return merged;
    }

    return source;
}

const localKey = (key: string) => `local:${key}` as const;

const GLOBALS_KEY = localKey("globals");
const globalKeys = new Set<string>(Object.keys(defaultGlobalSettings));

const defaults: Settings = {
    ...defaultSiteSettings,
    ...defaultGlobalSettings,
};

export function createStore() {
    const globalListeners = new Set<GlobalListener>();
    const siteListeners = new Set<SiteListener>();

    async function get<K extends readonly (keyof GlobalSettings)[]>(
        keys: K,
    ): Promise<ResolvedGlobalSettings<K>>;
    async function get<K extends readonly (keyof Settings)[]>(
        siteName: SiteName,
        keys: K,
    ): Promise<ResolvedSettings<K>>;
    async function get(
        siteNameOrKeys: SiteName | readonly (keyof Settings)[],
        maybeKeys?: readonly (keyof Settings)[],
    ) {
        const hasSiteName = typeof siteNameOrKeys === "string";
        const siteName = hasSiteName ? siteNameOrKeys : null;
        const keys = hasSiteName ? maybeKeys! : siteNameOrKeys;

        const needsGlobals = keys.some((k) => globalKeys.has(k as string));
        const needsSite =
            siteName !== null && keys.some((k) => !globalKeys.has(k as string));

        const [globals, siteStored] = await Promise.all([
            needsGlobals
                ? storage.getItem<Partial<GlobalSettings>>(GLOBALS_KEY)
                : null,
            needsSite
                ? storage.getItem<SiteSettingsUpdate>(localKey(siteName))
                : null,
        ]);

        const g = globals ?? {};
        const s = siteStored ?? {};

        return Object.fromEntries(
            keys.map((k) => {
                const stored = globalKeys.has(k as string)
                    ? (g as Record<string, unknown>)[k as string]
                    : s[k as keyof SiteSettings];
                return [k, deepMerge(defaults[k], stored)];
            }),
        );
    }

    const notify = (
        siteName: SiteName | null,
        globalValues: GlobalSettingsUpdate,
        siteValues: SiteSettingsUpdate,
    ) => {
        if (Object.keys(globalValues).length > 0) {
            for (const listener of globalListeners) listener(globalValues);
        }
        if (Object.keys(siteValues).length > 0 && siteName !== null) {
            for (const listener of siteListeners)
                listener(siteName, siteValues);
        }
    };

    async function set(values: GlobalSettingsUpdate): Promise<void>;
    async function set(
        siteName: SiteName,
        values: SettingsUpdate,
    ): Promise<void>;
    async function set(
        siteNameOrValues: SiteName | SettingsUpdate,
        maybeValues?: SettingsUpdate,
    ) {
        const hasSiteName = typeof siteNameOrValues === "string";
        const siteName = hasSiteName ? siteNameOrValues : null;
        const values = hasSiteName ? maybeValues! : siteNameOrValues;

        const filtered = Object.fromEntries(
            Object.entries(values).filter(([, v]) => v !== undefined),
        );

        const globalEntries = Object.entries(filtered).filter(([k]) =>
            globalKeys.has(k),
        );
        const siteEntries = Object.entries(filtered).filter(
            ([k]) => !globalKeys.has(k),
        );

        const writes: Promise<void>[] = [];

        if (globalEntries.length > 0) {
            const globalValues = Object.fromEntries(globalEntries);
            const stored =
                (await storage.getItem<Partial<GlobalSettings>>(GLOBALS_KEY)) ??
                {};
            writes.push(
                storage.setItem(GLOBALS_KEY, { ...stored, ...globalValues }),
            );
        }

        if (siteEntries.length > 0 && siteName !== null) {
            const siteValues = Object.fromEntries(siteEntries);
            const siteKey = localKey(siteName);
            const stored =
                (await storage.getItem<SiteSettingsUpdate>(siteKey)) ?? {};
            writes.push(storage.setItem(siteKey, { ...stored, ...siteValues }));
        }

        await Promise.all(writes);
        notify(
            siteName,
            Object.fromEntries(globalEntries) as GlobalSettingsUpdate,
            Object.fromEntries(siteEntries) as SiteSettingsUpdate,
        );
    }

    // update(siteName, values) — deep merge site settings
    const update = async (siteName: SiteName, values: SiteSettingsUpdate) => {
        const keys = Object.keys(values) as (keyof SiteSettings)[];
        const current = await get(siteName, keys);

        const merged = Object.fromEntries(
            keys.map((k) => [k, deepMerge(current[k], values[k])]),
        ) as SiteSettingsUpdate;

        await set(siteName, merged);
    };

    function subscribe(topic: "globals", listener: GlobalListener): () => void;
    function subscribe(topic: "site", listener: SiteListener): () => void;
    function subscribe(
        topic: "globals" | "site",
        listener: GlobalListener | SiteListener,
    ) {
        if (topic === "globals") {
            globalListeners.add(listener as GlobalListener);
            return () => globalListeners.delete(listener as GlobalListener);
        }
        siteListeners.add(listener as SiteListener);
        return () => siteListeners.delete(listener as SiteListener);
    }

    return { get, set, update, subscribe };
}
