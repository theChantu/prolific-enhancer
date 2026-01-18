const store = {
    set: async <T>(k: string, v: T) => await GM.setValue(k, JSON.stringify(v)),
    get: async <T>(k: string, def: T) =>
        JSON.parse(await GM.getValue(k, JSON.stringify(def))),
};

export default store;
