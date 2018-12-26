export interface ISyncStorage {
    get<T>(key: string): T;
    remove(key: string): void;
    set<T>(key: string, value: T): void;
}

export const SyncStorage: ISyncStorage = {
    get<T>(key: string): T {

        const value = localStorage.getItem(key);
        try {
            return JSON.parse(value || "");
        } catch (e) {
            return value as any as T;
        }
    },
    remove(key: string): void {
        localStorage.removeItem(key);
    },
    set<T>(key: string, value: T): void {
        localStorage.setItem(key, JSON.stringify(value));
    }
}