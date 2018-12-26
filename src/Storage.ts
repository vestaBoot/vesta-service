export interface IStorage {
    get<T>(key: string): Promise<T>;
    remove(key: string): Promise<void>;
    set<T>(key: string, value: T): Promise<void>;
}

export const Storage: IStorage = {
    get<T>(key: string): Promise<T> {

        const value = localStorage.getItem(key);
        try {
            return Promise.resolve(JSON.parse(value || "") as T);
        } catch (e) {
            return Promise.resolve(value as any as T);
        }
    },
    remove(key: string): Promise<void> {
        localStorage.removeItem(key);
        return Promise.resolve();
    },
    set<T>(key: string, value: T): Promise<void> {
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }
}
