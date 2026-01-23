const vmSettingsDefaults = {
    enableCurrencyConversion: true,
    enableHighlightRates: true,
    enableSurveyLinks: true,
    enableNewSurveyNotifications: true,
} as const;

type VMSettings = {
    [K in keyof typeof vmSettingsDefaults]: (typeof vmSettingsDefaults)[K];
};

type StoreSchema = VMSettings & {
    gbpToUsd?: { rate: number; timestamp: number };
    initialized?: boolean;
    surveys?: Record<string, number>;
};

type StoreListener = (changed: Partial<StoreSchema>) => void;

type Store = {
    get<K extends readonly (keyof StoreSchema)[]>(
        keys: K,
    ): Promise<Pick<StoreSchema, K[number]>>;

    get<K extends Partial<StoreSchema>>(defaults: K): Promise<StoreSchema & K>;

    set(values: Partial<StoreSchema>): Promise<void>;

    subscribe(listener: StoreListener): () => void;
};

function createStore(): Store {
    const listeners = new Set<(changed: Partial<StoreSchema>) => void>();

    return {
        async get(arg: any) {
            if (Array.isArray(arg)) {
                return GM.getValues([...arg]);
            }

            const keys = Object.keys(arg) as (keyof StoreSchema)[];
            const values = await GM.getValues(keys);
            return { ...arg, ...values };
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
export { vmSettingsDefaults };
