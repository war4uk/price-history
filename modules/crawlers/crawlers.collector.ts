/*import fs = require("fs");*/
import path = require("path");

import PhantomCrawler = require("./phantom.crawler");

import {IPhantomShopCrawler, IProduct, IFetchResult} from "./crawler.interface";
import logger from "../logger";

export let getOutputPath = (crawler: IPhantomShopCrawler, dumpDirectory, dateStarted: Date): string => {
    "use strict";
    let formattedDate: string = `${dateStarted.getUTCFullYear()}-${dateStarted.getUTCMonth() + 1}-${dateStarted.getUTCDate()}`;
    return path.join(dumpDirectory, formattedDate, crawler.shopName);
};

export let normalizeUrl = (url: string): string => {
    "use strict";
    return url.replace(/\//g, "_").replace(/:/g, "_").replace(/\?/g, "_");
};

export let fetchFromUrl = (url: string, crawler: IPhantomShopCrawler): Promise<IFetchResult> => {
    "use strict";
    return new Promise<IFetchResult>((resolve, reject) => {
        crawler.horsemanProvider.getHorseman()
            .then((horseman: any): any => PhantomCrawler.openUrl(horseman, url))
            .then((): void => {
                let result: IFetchResult = {
                    products: [],
                    urls: []
                };

                let collectUrls = crawler.collectUrls().then((urls: string[]) => {
                    result.urls = urls;
                });
                let collectProducts = crawler.collectProducts().then((products: IProduct[]) => {
                    result.products = products;
                });

                Promise.all([collectUrls, collectProducts]).then((): IFetchResult => result)
                    .then(
                    (fetchedResult: IFetchResult) => {
                        resolve(fetchedResult);
                    },
                    (err) => {
                        logger.log("error", crawler.shopName + ": error while fetching " + url + ". Error: " + JSON.stringify(err));
                        reject(err);
                    });
            })
            .catch((err) => {
                logger.log("error", crawler.shopName + ": error while fetching " + url + ". Error: " + JSON.stringify(err));
                return reject(err);
            });
    });
};
