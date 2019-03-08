import { IPermission } from "./Permission";
import { Status } from "./Status";

export interface IRole {
    name: string;
    permissions: Array<number | IPermission>;
    status: Status;
}