type StoreSchema = {
    gbpToUsd?: { rate: number; timestamp: number };
    initialized?: boolean;
    surveys?: Record<string, number>;
};

type Store = {
    get<K extends readonly (keyof StoreSchema)[]>(
        keys: K,
    ): Promise<Pick<StoreSchema, K[number]>>;

    get<K extends Partial<StoreSchema>>(defaults: K): Promise<StoreSchema & K>;

    set<K extends keyof StoreSchema>(
        values: Pick<StoreSchema, K>,
    ): Promise<void>;
};

const store: Store = {
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
    },
};

export default store;
