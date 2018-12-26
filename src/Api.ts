export interface IRequestHeader {
    [name: string]: string;
}

export interface IApiRequest<T> extends Promise<T> {
    abort?: () => void;
    xhr?: XMLHttpRequest;
}

export interface IApiOption {
    hooks?: {
        beforeSend?: <T>(type: string, edge: string, data: T, headers: IRequestHeader) => void;
        afterReceive?: <T>(type: string, xhr: XMLHttpRequest, edge: string, data: T) => void;
    }
}

export class Api {

    public constructor(private endpoint: string, private option?: IApiOption) {
        if (!this.option) {
            this.option = {};
        }
        if (!this.option.hooks) {
            this.option.hooks = {};
        }
    }

    public delete<T, U>(edge: string, data?: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("GET", edge, data, headers);
        const queryString = data ? this.param(data) : "";
        return this.xhr<U>("DELETE", `${edge}${queryString}`, null, headers);
    }

    public get<T, U>(edge: string, data?: T, headers?: IRequestHeader) {
        headers = headers || {};
        this.onBeforeSend("GET", edge, data, headers);
        const queryString = data ? this.param(data) : "";
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
        if ((this.option as any).hooks.afterReceive) {
            (this.option as any).hooks.afterReceive(type, xhr, edge, data);
        }
    }

    private onBeforeSend<T>(type: string, edge: string, data: T, headers: IRequestHeader) {
        if ((this.option as any).hooks.beforeSend) {
            (this.option as any).hooks.beforeSend(type, edge, data, headers);
        }
    }

    // jquery-param
    private param(data: any) {
        const queryStringParts: string[] = [];
        const rBracket = /\[\]$/;

        return buildParams("", data).join("&").replace(/%20/g, "+");

        function isArray(obj: any) {
            return Object.prototype.toString.call(obj) === "[object Array]";
        }

        function add(k: string, v: any) {
            if (typeof v === "function") { return; }
            if (v === null || v === undefined) { return; }
            queryStringParts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
        }

        function buildParams(prefix: string, obj: any) {
            if (prefix) {
                if (isArray(obj)) {
                    for (let i = 0, len = obj.length; i < len; i++) {
                        if (rBracket.test(prefix)) {
                            add(prefix, obj[i]);
                        } else {
                            buildParams(`${prefix}[${typeof obj[i] === "object" ? i : ""}]`, obj[i]);
                        }
                    }
                } else if (obj && String(obj) === "[object Object]") {
                    for (let keys = Object.keys(obj), i = keys.length; i--;) {
                        buildParams(`${prefix}[${keys[i]}]`, obj[keys[i]]);
                    }
                } else {
                    add(prefix, obj);
                }
            } else {
                for (let keys = Object.keys(obj), i = keys.length; i--;) {
                    buildParams(keys[i], obj[keys[i]]);
                }
            }
            return queryStringParts;
        }
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
            xhr.open(method, `${this.endpoint}/${edge}`, true);
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
