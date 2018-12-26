export const AclAction = { Read: "read", Add: "add", Edit: "edit", Delete: "delete" }

export enum AclPolicy { Deny, Allow }

export interface IAccess {
    [action: string]: boolean | undefined;
    Add?: boolean;
    Delete?: boolean;
    Edit?: boolean;
}

export interface IPermissions {
    [resource: string]: string[];
}

export class Acl {

    private defaultPolicy = AclPolicy.Deny;
    private permissions: IPermissions = {};
    private statePermissions: { [state: string]: IPermissions } = {};

    public constructor() { }

    public addPermissions(permissions: IPermissions) {
        this.permissions = { ...this.permissions, ...permissions };
    }

    public getAccessList(resource: string, ...actions: string[]): IAccess {
        if (!actions.length) {
            actions = [AclAction.Read, AclAction.Add, AclAction.Edit, AclAction.Delete];
        }
        const access: IAccess = {};
        for (let i = actions.length; i--;) {
            if (this.isAllowed(resource, actions[i])) { access[actions[i]] = true; }
        }
        return access;
    }

    public hasAccessToState(state: string): boolean {
        if (!state) { return true; }
        const requiredPermissions = this.statePermissions[state];
        if (!requiredPermissions) { return this.defaultPolicy === AclPolicy.Allow; }
        for (let resources = Object.keys(requiredPermissions), i = resources.length; i--;) {
            const resource = resources[i];
            const actions = requiredPermissions[resource];
            for (let j = actions.length; j--;) {
                if (!this.isAllowed(resource, actions[j])) { return false; }
            }
        }
        return true;
    }

    /**
     * Check if user has access to the action of resource
     */
    public isAllowed(resource: string, action: string): boolean {
        const userPermissions = this.permissions;
        const userActions = userPermissions[resource];
        if ((userActions && (userActions.indexOf("*") >= 0 || userActions.indexOf(action) >= 0)) ||
            // tslint:disable-next-line:max-line-length
            (userPermissions["*"] && (userPermissions["*"].indexOf("*") >= 0 || userPermissions["*"].indexOf(action) >= 0))) {
            return true;
        }
        return this.defaultPolicy == AclPolicy.Allow;
    }

    /**
     * The following permissions are required to meet the state
     * @param state         The name of the state
     * @param permissions   Required permissions
     */
    public registerPermisions(state: string, permissions: IPermissions) {
        this.statePermissions[state] = permissions;
    }

    public setDefaultPolicy(policy: AclPolicy) {
        this.defaultPolicy = policy;
    }
}