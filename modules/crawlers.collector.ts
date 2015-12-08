/*import fs = require("fs");*/
import path = require("path");

import PhantomCrawler = require("./phantom.crawler");

import {IPhantomShopCrawler, IProduct, IFetchResult} from "./crawler.interface";

export let getOutputPath = (crawler: IPhantomShopCrawler, dumpDirectory, dateStarted: Date): string => {
    "use strict";
    let formattedDate: string = `${dateStarted.getUTCFullYear() }-${dateStarted.getUTCMonth() + 1}-${dateStarted.getUTCDate() }`;
    return path.join(dumpDirectory, formattedDate, crawler.shopName);
};

export let normalizeUrl = (url: string): string => {
    "use strict";
    return url.replace(/\//g, "_").replace(/:/g, "_").replace(/\?/g, "_");
};

export let fetchFromUrl = (url: string, crawler: IPhantomShopCrawler): Promise<IFetchResult> => {
    "use strict";
    return new Promise<IFetchResult>((resolve, reject) => {
        PhantomCrawler.openUrl(url, crawler.cookies)
            .then((horseman: any): void => {
                let result: IFetchResult = {
                    products: [],
                    urls: []
                };

                let collectUrls = crawler.collectUrls(horseman).then((urls: string[]) => {
                    result.urls = urls;
                });
                let collectProducts = crawler.collectProducts(horseman).then((products: IProduct[]) => {
                    result.products = products;
                });

                Promise.all([collectUrls, collectProducts]).then((): IFetchResult => result)
                    .then(
                    (fetchedResult: IFetchResult) => {
                        horseman.close();
                        resolve(fetchedResult);
                    },
                    (err) => {
                        horseman.close();
                        reject(err);
                    });
            })
            .catch((err) => {
                console.dir(err);
                return reject(err);
            });
    });
};
