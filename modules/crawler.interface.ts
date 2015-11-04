export interface ICrawlerInstance {
    name: string;
    start(output: string): void;
}

export interface ICrawlerStatic {
 new ();
}
