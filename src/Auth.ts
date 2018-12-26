import { AclAction, IAccess } from "./Access";
import { IStorage } from "./Storage";

export interface IPermissionCollection {
    [resource: string]: string[];
}

export interface IAuthOption<T> {
    authTokenKeyName?: string;
    authUserKeyName?: string;
    storage: IStorage;
    isAllowed: (resource: string, action: string) => boolean;
    getAccessList: (resource: string) => IAccess;
    hooks?: {
        afterInit?: (user: T) => void;
    }
}

export class Auth<T> {

    public static getInstance<T>(option: IAuthOption<T>): Auth<T> {
        if (!Auth.instance) {
            Auth.instance = new Auth(option);
        }
        return Auth.instance;
    }

    private static instance: Auth<any>;
    private tokenKeyName: string = "auth-token";
    private userKeyName: string = "auth-user";
    private user: T = null as any as T;

    constructor(private option: IAuthOption<T>) {
        if (!option.hooks) {
            option.hooks = {};
        }
        if (option.authTokenKeyName) {
            this.tokenKeyName = option.authTokenKeyName;
        }
        if (option.authUserKeyName) {
            this.userKeyName = option.authUserKeyName;
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

    public getAccessList(resource: string): IAccess {
        return this.option.getAccessList(resource);
    }

    public isAllowed(resource: string, action: string): boolean {
        return this.option.isAllowed(resource, action);
    }

    private initUser() {
        this.option.storage.get<T>(this.userKeyName).then((user) => {
            this.user = user;
            if (!user) {
                return this.logout();
            };
            if ((this.option.hooks as any).afterInit) {
                (this.option.hooks as any)(user);
            }
        })
    }
}
