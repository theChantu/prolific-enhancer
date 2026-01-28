import type { VMSettings } from "../types";
import { defaultVMSettings } from "./defaults";

type StoreSchema = VMSettings & {};

export type StoreListener = (changed: Partial<StoreSchema>) => void;

type DeepNonNullable<T> = T extends (...args: any[]) => any
    ? T
    : T extends object
      ? { [K in keyof T]-?: DeepNonNullable<T[K]> }
      : NonNullable<T>;

function deepMerge(target: any, source: any): any {
    // If value is undefined, return the default (target)
    if (source === undefined) return target;

    // If both are objects, merge their children
    if (
        typeof target === "object" &&
        target !== null &&
        typeof source === "object" &&
        source !== null
    ) {
        const merged = { ...target };
        for (const key of Object.keys(source)) {
            // Recursively overwrite with the User's saved values
            merged[key] = deepMerge(target[key], source[key]);
        }
        return merged;
    }

    return source;
}

function createStore() {
    const listeners = new Set<(changed: Partial<StoreSchema>) => void>();

    const get = async <K extends readonly (keyof StoreSchema)[]>(keys: K) => {
        const values = await GM.getValues([...keys]);
        return Object.fromEntries(
            keys.map((k) => {
                return [k, deepMerge(defaultVMSettings[k], values[k])];
            }),
        ) as Pick<
            { [P in keyof StoreSchema]: DeepNonNullable<StoreSchema[P]> },
            K[number]
        >;
    };
    const set = async (values: Partial<StoreSchema>) => {
        const keys = Object.keys(values) as (keyof StoreSchema)[];
        const prevValues = await get(keys);

        const newValues = Object.fromEntries(
            keys.map((k) => {
                const prev = prevValues[k];
                const next = values[k];

                if (
                    typeof prev === "object" &&
                    prev !== null &&
                    typeof next === "object" &&
                    next !== null
                ) {
                    return [k, { ...prev, ...next }];
                }

                return [k, next === undefined ? prev : next];
            }),
        ) as Pick<StoreSchema, (typeof keys)[number]>;

        await GM.setValues(newValues);

        for (const listener of listeners) listener(newValues);
    };

    const subscribe = (listener: StoreListener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    return { get, set, subscribe };
}

const store = createStore();

export default store;
