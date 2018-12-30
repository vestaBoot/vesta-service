export enum LogLevel { None, Error, Warning, Info }

export interface ILog extends Error {
    id?: number;
    file?: string;
    level?: LogLevel;
    message: string;
    method?: string;
}

export interface ILogDriver {
    log: (log: ILog) => void;
    warn: (log: ILog) => void;
    error: (log: ILog) => void;
}

export interface ILogConfig {
    driver: ILogDriver;
    level: LogLevel;
}

export class Log {

    public constructor(private config: ILogConfig) { }

    public error = (log: ILog) => {
        const { level, driver } = this.config;
        if (level <= LogLevel.Warning) {
            driver.error(log);
        }
    }

    public log = (log: ILog) => {
        const { level, driver } = this.config;
        if (level <= LogLevel.Info) {
            driver.log(log);
        }
    }

    public warn = (log: ILog) => {
        const { level, driver } = this.config;
        if (level <= LogLevel.Warning) {
            driver.warn(log);
        }
    }
}
