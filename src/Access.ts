export const AclAction = { Read: "read", Add: "add", Edit: "edit", Delete: "delete" }

export interface IAccess {
    [action: string]: boolean | undefined;
    Add?: boolean;
    Delete?: boolean;
    Edit?: boolean;
}
