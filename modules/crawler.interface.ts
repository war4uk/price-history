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
}

export interface IFetchResult {
    urls: string[];
    products: IProduct[];
}

export interface IShopCrawler {
    initialUrls: string[];
    shopName: string;
    fetchFromUrl(url: string): Promise<IFetchResult>;
}
