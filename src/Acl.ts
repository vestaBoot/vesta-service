import { IPermission } from "./Permission";
import { IRole } from "./Role";

export const AclAction = { All: "*", Read: "read", Add: "add", Edit: "edit", Delete: "delete", Detail: "detail" };

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

    private permissions: IPermissions = {};
    private statePermissions: { [state: string]: IPermissions } = {};

    public addRole(role: IRole) {
        // console.log("addRole", role);
        if (!role || !role.status) { return; }
        for (let i = 0, il = role.permissions.length; i < il; ++i) {
            const permission = role.permissions[i] as IPermission;
            if (!(permission.resource in this.permissions)) {
                this.permissions[permission.resource] = [];
            }
            // if (this.permissions[permission.resource].indexOf(permission.action)) {
            this.permissions[permission.resource].push(permission.action);
            // }
        }
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
        if (!requiredPermissions) { return true; }
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
        return false;
    }

    /**
     * The following permissions are required to meet the state
     * @param state         The name of the state
     * @param permissions   Required permissions
     */
    public register(state: string, permissions: IPermissions) {
        this.statePermissions[state] = permissions;
    }
}