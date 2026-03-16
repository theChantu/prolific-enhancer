const store = new Map<string, unknown>();

export const storage = {
    async getItem<T>(key: string): Promise<T | null> {
        return (store.get(key) as T) ?? null;
    },
    async setItem(key: string, value: unknown): Promise<void> {
        store.set(key, value);
    },
    /** Clear all stored data (for test isolation) */
    _clear() {
        store.clear();
    },
};
