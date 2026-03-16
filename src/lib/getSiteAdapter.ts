import { ProlificAdapter, CloudResearchAdapter } from "../adapters";

const siteAdapters = [new ProlificAdapter(), new CloudResearchAdapter()];

type SiteAdapter = ProlificAdapter | CloudResearchAdapter;

function matchesHost(host: string, allowedHost: string): boolean {
    return host === allowedHost || host.endsWith(`.${allowedHost}`);
}

function getSiteAdapter(): SiteAdapter;
function getSiteAdapter(input: string): SiteAdapter | null;
function getSiteAdapter(input?: string): SiteAdapter | null {
    const host = input ? new URL(input).hostname : window.location.hostname;

    for (const adapter of siteAdapters) {
        if (matchesHost(host, adapter.url.host)) {
            return adapter;
        }
    }

    if (input === undefined) {
        throw new Error(
            `Extension injected on unsupported host: ${window.location.hostname}`,
        );
    }

    return null;
}

export default getSiteAdapter;
export { siteAdapters };
