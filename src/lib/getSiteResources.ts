import getSiteAdapter from "./getSiteAdapter";
import fetchResources from "./fetchResources";

const adapter = getSiteAdapter();
const getSharedResources = fetchResources(adapter.iconUrl);

export default getSharedResources;
