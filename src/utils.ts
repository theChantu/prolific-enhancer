const log: typeof console.log = (...args) => {
    console.log("[Prolific Enhancer]", ...args);
};

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

const getSharedResources = fetchResources("prolific_logo");
export { log, fetchResources, getSharedResources };
