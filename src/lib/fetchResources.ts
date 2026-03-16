type FetchInput = Extract<Parameters<typeof fetch>[0], string>;
type ResourceMap<T extends readonly FetchInput[]> = {
    [K in T[number]]?: ReturnType<typeof URL.createObjectURL>;
};

const fetchResources = <const T extends readonly FetchInput[]>(...args: T) => {
    let promise: Promise<ResourceMap<T>> | null = null;

    return () => {
        if (!promise) {
            promise = (async () => {
                const entries = await Promise.all(
                    args.map(async (name) => {
                        const resource = await fetch(name);
                        return [name as T[number], resource] as const;
                    }),
                );

                const resources = {} as ResourceMap<T>;

                for (const [name, resource] of entries) {
                    if (resource.ok)
                        resources[name] = URL.createObjectURL(
                            await resource.blob(),
                        );
                }

                return resources;
            })();
        }
        return promise;
    };
};

export default fetchResources;
