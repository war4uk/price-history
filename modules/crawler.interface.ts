export interface ICrawlerInstance {
    name: string;
    start(output: string): void;
}

export interface ICrawlerStatic {
    new ();
}

export interface ICrawlerCookieFile {
    name: string;
    value: string;
    domain: string;
}

