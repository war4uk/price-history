export const REVISION = 2;

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

////

export interface IProduct {
    name: string;
    categoryName: string;
    marketName: string;
    uniqueIdInShop: string;
    price: number;
    fetchedDate: Date;
    rawData? : any;
    ifaceRevision: number;   
}

export interface IFetchResult {
    urls: string[];
    products: IProduct[];
}

export interface IPhantomShopCrawler {
    initialUrls: string[];
    shopName: string;
    cookies: IPhantomCrawlerCookieFile[];
    collectUrls: (horseman: any) => Promise<string[]>;
    collectProducts: (horseman: any) => Promise<IProduct[]>;
}
