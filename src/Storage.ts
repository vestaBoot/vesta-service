export interface IStorage {
    get<T>(key: string): Promise<T>;
    remove(key: string): Promise<void>;
    set<T>(key: string, value: T): Promise<void>;
}

export class Storage implements IStorage {
    public get<T>(key: string): Promise<T> {

        const value = localStorage.getItem(key);
        try {
            return Promise.resolve(JSON.parse(value || "") as T);
        } catch (e) {
            return Promise.reject(value as any as T);
        }
    }
    public remove(key: string): Promise<void> {
        localStorage.getItem(key);
        return Promise.resolve();
    }
    public set<T>(key: string, value: T): Promise<void> {
        localStorage.setItem(key, JSON.stringify(value));
        return Promise.resolve();
    }
}