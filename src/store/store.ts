import type { VMSettings } from "../types";
import { defaultVMSettings } from "./defaults";

type StoreSchema = VMSettings & {};

type StoreListener = (changed: Partial<StoreSchema>) => void;

type Store = {
    get<K extends readonly (keyof StoreSchema)[]>(
        keys: K,
    ): Promise<Pick<StoreSchema, K[number]>>;

    set(values: Partial<StoreSchema>): Promise<void>;

    subscribe(listener: StoreListener): () => void;
};

function createStore(): Store {
    const listeners = new Set<(changed: Partial<StoreSchema>) => void>();

    return {
        get: async <K extends readonly (keyof StoreSchema)[]>(keys: K) => {
            const values = await GM.getValues([...keys]);
            return Object.fromEntries(
                keys.map((k) => [k, values[k] ?? defaultVMSettings[k]]),
            ) as Pick<StoreSchema, K[number]>;
        },
        set: async (values) => {
            await GM.setValues(values);
            for (const listener of listeners) listener(values);
        },

        subscribe(listener: StoreListener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}

const store = createStore();

export default store;
