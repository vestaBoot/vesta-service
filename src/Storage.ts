export interface ISyncStorage {
    get<T>(key: string): T;
    remove(key: string): void;
    set<T>(key: string, value: T): void;
}

export interface IStorage {
    sync: ISyncStorage;
    get<T>(key: string): Promise<T>;
    remove(key: string): Promise<void>;
    set<T>(key: string, value: T): Promise<void>;
}

export const Storage: IStorage = {
    // sync stotage
    sync: {
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
        },
    },

    // async storage
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
    },
};
