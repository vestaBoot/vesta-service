import { IStorage } from "./Storage";

export interface IAuthConfig<T> {
    tokenKey?: string;
    authUserKey?: string;
    storage: IStorage;
    hooks?: {
        afterInit?: (user: T) => void;
    };
}

export class Auth<T> {

    private tokenKeyName: string = "auth-token";
    private userKeyName: string = "auth-user";
    private user: T = null as any as T;

    public constructor(private config: IAuthConfig<T>) {
        if (!config.hooks) {
            config.hooks = {};
        }
        if (config.tokenKey) {
            this.tokenKeyName = config.tokenKey;
        }
        if (config.authUserKey) {
            this.userKeyName = config.authUserKey;
        }
        this.initUser();
    }

    public logout(): Promise<void> {
        return Promise.all([
            this.config.storage.remove(this.tokenKeyName),
            this.config.storage.remove(this.userKeyName),
        ]).then(() => {
            if (this.config.hooks.afterInit) {
                this.config.hooks.afterInit(null);
            }
        }).catch((error) => {
            //
        });

    }

    public login(user: T): Promise<void> {
        this.user = user;
        return this.config.storage.set(this.userKeyName, user);
    }

    public getUser(): T {
        return this.user;
    }

    public setToken(token: string): Promise<void> {
        return this.config.storage.set(this.tokenKeyName, token);
    }

    public getToken(): Promise<string> {
        return this.config.storage.get<string>(this.tokenKeyName);
    }

    private initUser() {
        this.config.storage.get<T>(this.userKeyName).then((user) => {
            this.user = user;
            if (!user) {
                return this.logout();
            }
            if (this.config.hooks.afterInit) {
                this.config.hooks.afterInit(user);
            }
        });
    }
}
