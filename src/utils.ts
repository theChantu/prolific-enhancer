const log: typeof console.log = (...args) => {
    console.log("[Prolific Enhancer]", ...args);
};

type GetResourceUrlParam = Parameters<typeof GM.getResourceUrl>[0];
type ResourceMap<T extends readonly GetResourceUrlParam[]> = {
    [K in T[number]]?: string;
};

const fetchResources = <const T extends readonly GetResourceUrlParam[]>(
    ...args: T
) => {
    let promise: Promise<ResourceMap<T>> | null = null;

    return () => {
        if (!promise) {
            promise = (async () => {
                const resources = {} as ResourceMap<T>;

                for (const name of args as readonly T[number][]) {
                    const resource = await GM.getResourceUrl(name);
                    if (!resource) continue;
                    resources[name] = resource;
                }

                return resources;
            })();
        }
        return promise;
    };
};

const getSharedResources = fetchResources("prolific_logo");
export { log, fetchResources, getSharedResources };
