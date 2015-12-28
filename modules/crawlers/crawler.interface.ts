import {IProduct, REVISION} from "../../interfaces/IProduct";

export {IProduct, REVISION} from "../../interfaces/IProduct";

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
