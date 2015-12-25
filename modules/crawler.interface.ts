export const REVISION = 2;

export interface IPhantomCrawlerCookieFile {
    name: string;
    value: string;
    domain: string;
}

////

export interface ICrawlerStats {
    [crawlerName: string]: ICrawlerUrls;
};

export interface ICrawlerUrls {
        visitedUrls: string[];
        urlsToVisit: string[];
};
 
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

export interface IHorsemanProvider {
    getHorseman: () => Promise<any>;
    resetHorseman: () => void;
    setCookies: (cookies: IPhantomCrawlerCookieFile[]) => void;
}

export interface IPhantomShopCrawler {
    initialUrls: string[];
    shopName: string;
    collectUrls: () => Promise<string[]>;
    collectProducts: () => Promise<IProduct[]>;
    horsemanProvider: IHorsemanProvider;
}
