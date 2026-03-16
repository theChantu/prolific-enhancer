import getSiteAdapter from "../lib/getSiteAdapter";

export default abstract class BaseEnhancement {
    readonly adapter;

    constructor() {
        this.adapter = getSiteAdapter();
    }

    abstract apply(): Promise<void>;
    abstract revert(): Promise<void>;

    async run() {
        await this.revert();
        await this.apply();
    }
}
