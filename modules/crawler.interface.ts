export interface ICrawlerInstance {
    name: string;
    start(): void;
}

export interface ICrawlerStatic {
    new (output: string, loggerStatic: ICrawlerLoggerStatic): ICrawlerInstance;
}

export interface ICrawlerLogger {
    log(message: string): void;
}

export interface ICrawlerLoggerStatic {
    new (output: string, name: string): ICrawlerLogger;
}

export interface IPhantomCrawlerCookieFile {
    name: string;
    value: string;
    domain: string;
}

