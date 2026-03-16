import type { GlobalSettings } from "../lib/types";

const defaultGlobalSettings = Object.freeze({
    enableDebug: false,
}) satisfies GlobalSettings;

export { defaultGlobalSettings };
