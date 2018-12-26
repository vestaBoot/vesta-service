import { IStorage } from "./Storage";

export interface IAuthOption<T> {
    tokenKey?: string;
    authUserKey?: string;
    storage: IStorage;
    hooks?: {
        afterInit?: (user: T) => void;
    }
}

export class Auth<T> {

    private tokenKeyName: string = "auth-token";
    private userKeyName: string = "auth-user";
    private user: T = null as any as T;

    public constructor(private option: IAuthOption<T>) {
        if (!option.hooks) {
            option.hooks = {};
        }
        if (option.tokenKey) {
            this.tokenKeyName = option.tokenKey;
        }
        if (option.authUserKey) {
            this.userKeyName = option.authUserKey;
        }
        this.initUser();
    }

    public logout(): Promise<void> {
        return Promise.all([this.option.storage.remove(this.tokenKeyName), this.option.storage.remove(this.userKeyName)])
            .then(() => { });

    }

    public login(user: T): Promise<void> {
        this.user = user;
        return this.option.storage.set(this.userKeyName, JSON.stringify(user))
    }

    public getUser(): T {
        return this.user;
    }

    public setToken(token: string): Promise<void> {
        return this.option.storage.set(this.tokenKeyName, token);
    }

    public getToken(): Promise<string> {
        return this.option.storage.get<string>(this.tokenKeyName);
    }

    private initUser() {
        this.option.storage.get<T>(this.userKeyName).then((user) => {
            this.user = user;
            if (!user) {
                return this.logout();
            }
            if ((this.option.hooks as any).afterInit) {
                (this.option.hooks as any)(user);
            }
        })
    }
}
