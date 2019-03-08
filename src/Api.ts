export interface IRequestHeader {
    [name: string]: string;
}

export interface IApiRequest<T> extends Promise<T> {
    abort?: () => void;
    xhr?: XMLHttpRequest;
}

export interface IApiConfig {
    endpoint: string;
    hooks?: {
        beforeSend?: <T>(type: string, edge: string, data: T, headers: IRequestHeader) => void;
        afterReceive?: <T>(type: string, xhr: XMLHttpRequest, edge: string, data: T) => void;
    };
}

export class Api {

    public constructor(private config: IApiConfig) {
        if (!config.hooks) {
            config.hooks = {};
        }
    }

    public delete<T, U>(edge: string, data?: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("GET", edge, data, headers);
        const queryString = data ? `?wrapper=${this.param(data)}` : "";
        return this.xhr<U>("DELETE", `${edge}${queryString}`, null, headers);
    }

    public get<T, U>(edge: string, data?: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("GET", edge, data, headers);
        const queryString = data ? `?wrapper=${this.param(data)}` : "";
        return this.xhr<U>("GET", `${edge}${queryString}`, null, headers);
    }

    public post<T, U>(edge: string, data: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("POST", edge, data, headers);
        return this.xhr<U>("POST", edge, JSON.stringify(data), headers);
    }

    public put<T, U>(edge: string, data: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("PUT", edge, data, headers);
        return this.xhr<U>("PUT", edge, JSON.stringify(data), headers);
    }

    public upload<T, U>(edge: string, files: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("UPLOAD", edge, files, headers);
        const formData = new FormData();
        for (let fields = Object.keys(files), i = 0, il = fields.length; i < il; ++i) {
            const value = (files as any)[fields[i]];
            const fieldName = fields[i];
            // in order to upload the files properly, we should flattern the uploaded files
            if (value instanceof File) {
                formData.append(fields[i], value);
            } else if (Array.isArray(value)) {
                for (let j = 0, jl = value.length; j < jl; ++j) {
                    formData.append(`${fieldName}_${j}`, value[j]);
                }
            } else if ("object" === typeof value) {
                for (let subFields = Object.keys(value), j = 0, jl = subFields.length; j < jl; ++j) {
                    const subFieldName = subFields[j];
                    formData.append(`${fieldName}_${subFieldName}`, value[subFieldName]);
                }
            }
        }
        return this.xhr<U>("POST", edge, formData, headers);
    }

    private onAfterReceive<T>(type: string, xhr: XMLHttpRequest, edge: string, data: T) {
        if (this.config.hooks.afterReceive) {
            this.config.hooks.afterReceive(type, xhr, edge, data);
        }
    }

    private onBeforeSend<T>(type: string, edge: string, data: T, headers: IRequestHeader) {
        if (this.config.hooks.beforeSend) {
            this.config.hooks.beforeSend(type, edge, data, headers);
        }
    }

    private param(data: any) {
        return encodeURIComponent(JSON.stringify(data));
    }

    private setHeaders(xhr: XMLHttpRequest, headers: any) {
        if (headers) {
            for (let headerKeys = Object.keys(headers), i = headerKeys.length; i--;) {
                const header = headerKeys[i];
                xhr.setRequestHeader(header, headers[header]);
            }
        }
    }

    private xhr<T>(method: string, edge: string, data: any, headers: any): IApiRequest<T> {
        const xhr = new XMLHttpRequest();
        const promise: IApiRequest<T> = new Promise<T>((resolve, reject) => {
            xhr.open(method, `${this.config.endpoint}/${edge}`, true);
            this.setHeaders(xhr, headers);
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    this.onAfterReceive(method, xhr, edge, data);
                    const contentType = xhr.getResponseHeader("Content-Type");
                    if (contentType && contentType.toLowerCase().indexOf("application/json") >= 0) {
                        try {
                            const response: any = JSON.parse(xhr.responseText);
                            response && response.error ? reject(response.error) : resolve(response as T);
                        } catch (e) {
                            reject(new Error(e.message));
                        }
                    } else {
                        resolve(xhr.responseText as any as T);
                    }
                }
            };
            xhr.send(data);
        });
        promise.xhr = xhr;
        promise.abort = () => {
            xhr.abort();
        };
        return promise;
    }
}
