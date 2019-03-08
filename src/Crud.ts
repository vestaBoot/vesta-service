import { Err, IRequest, IResponse, Model, ValidationError } from "@vesta/core";
import { Api } from "./Api";

export interface IApiHooks {
    afterRequest?: () => void;
    beforeRequest?: () => void;
    onError?: (error: Error) => void;
    onSuccess?: (...info: any) => void;
}

export interface ICrudConfig {
    api: Api;
    edge: string;
    hooks?: IApiHooks;
}

export class Crud<T> {

    // private api: Api = (Crud as any).config.api;
    // private hooks: IApiHooks = (Crud as any).config.hooks;

    public constructor(protected config: ICrudConfig) {
        if (!config.hooks) {
            config.hooks = {};
        }
    }

    public fetch(id: number): Promise<T> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.get<T, IResponse<T>>(`${this.config.edge}/${id}`)
            .then((result) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                return result.items[0];
            })
            .catch((error) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                return null;
            });
    }

    public fetchAll(query?: IRequest<T>): Promise<T[]> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.get<IRequest<T>, IResponse<T>>(this.config.edge, query)
            .then((response) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                return response.items;
            })
            .catch((error) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                return [];
            });
    }

    public fetchCount(query?: IRequest<T>): Promise<number> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.get<IRequest<T>, IResponse<T>>(`${this.config.edge}/count`, query)
            .then((response) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                return response.total;
            })
            .catch((error) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                return 0;
            });
    }

    public insert(data: T, files?: T): Promise<T> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.post<T, IResponse<T>>(this.config.edge, data)
            .then((response) => {
                if (files) {
                    const id = (response.items[0] as any).id;
                    return this.config.api.upload<T, IResponse<T>>(`${this.config.edge}/file/${id}`, files);
                }
                return response;
            })
            .then((response) => {
                const id = (response.items[0] as any).id;
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onSuccess) {
                    this.config.hooks.onSuccess("info_add_record", id);
                }
                return response.items[0];
            })
            .catch((error: Err) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                if (error.code === Err.Code.Validation.code) { throw error; }
                return null;
            });
    }

    public remove(id: number): Promise<boolean> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.delete<IRequest<T>, IResponse<number>>(`${this.config.edge}/${id}`)
            .then((response) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onSuccess) {
                    this.config.hooks.onSuccess("info_delete_record", response.items[0]);
                }
                return true;
            })
            .catch((error) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                return false;
            });
    }

    public save(model: T, files?: T): Promise<T> {
        return ((model as any).id ?
            this.update(model, files) :
            this.insert(model, files));
    }

    public submit(model: Model, files?: T, ...fields: string[]): Promise<T> {
        const validationErrors = model.validate(...fields);
        if (validationErrors) {
            return Promise.reject(new ValidationError(validationErrors));
        }
        return this.save(model.getValues(...fields), files);
    }

    public update(data: T, files?: T): Promise<T> {
        if (this.config.hooks.beforeRequest) {
            this.config.hooks.beforeRequest();
        }
        return this.config.api.put<T, IResponse<T>>(this.config.edge, data)
            .then((response) => {
                if (files) {
                    const id = (response.items[0] as any).id;
                    return this.config.api.upload<T, IResponse<T>>(`${this.config.edge}/file/${id}`, files);
                }
                return response;
            })
            .then((response) => {
                const id = (response.items[0] as any).id;
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onSuccess) {
                    this.config.hooks.onSuccess("info_update_record", id);
                }
                return response.items[0];
            })
            .catch((error) => {
                if (this.config.hooks.afterRequest) {
                    this.config.hooks.afterRequest();
                }
                if (this.config.hooks.onError) {
                    this.config.hooks.onError(error);
                }
                if (error.code === Err.Code.Validation.code) { throw error; }
                return null;
            });
    }
}
