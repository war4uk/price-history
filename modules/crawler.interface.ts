export interface ICrawlerInstance {
    name: string;
    start(output: string): void;
}

export interface ICrawlerStatic {
    new () : ICrawlerInstance;
}

export interface IPhantomCrawlerCookieFile {
    name: string;
    value: string;
    domain: string;
}

