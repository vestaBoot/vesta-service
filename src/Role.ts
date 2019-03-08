import { IPermission } from "./Permission";

export interface IRole {
    name: string;
    permissions: Array<number | IPermission>;
}