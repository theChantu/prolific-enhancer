import { createStore } from "./createStore";

export type { GlobalListener, SiteListener } from "./createStore";
export { createStore };

const store = createStore();

export default store;
