"use strict";
import "./modules/express_config.js";

/*import fs = require("fs");
import path = require("path");*/

import ProductsUtility = require("./modules/product.utility");
import PhantomCrawler = require("./modules/phantom.crawler");

import {IPhantomShopCrawler, IProduct, IFetchResult} from "./modules/crawler.interface";
import {CitilinkCrawler} from "./modules/new_crawlers/citilink";
import {UlmartCrawler} from "./modules/new_crawlers/ulmart";
/*import {ICrawlerInstance, ICrawlerStatic} from "./modules/crawler.interface";
import {Logger} from "./modules/logger";

let crawlers: ICrawlerInstance[] = [];
let crawlersPath: string = path.join(__dirname, "modules", "crawlers");
let dateNow: Date = new Date();
let formattedDate: string = `${dateNow.getUTCFullYear() }-${dateNow.getUTCMonth() + 1}-${dateNow.getUTCDate() }`;

fs.readdirSync(crawlersPath).forEach(function(filePath: string): void {
    if (!endsWith(filePath, ".js")) {
        return;
    }
    let crawler: ICrawlerStatic = require(path.join(crawlersPath, filePath)).default;
    crawlers.push(new crawler(path.join(__dirname, "dump", formattedDate), Logger));
});

crawlers.forEach(function(crawler: ICrawlerInstance): void {
    crawler.start();
});

function endsWith(input: string, search: string): boolean {
    "use strict";
    return input.lastIndexOf(search) === (input.length - search.length);
}*/

interface ICrawlerUrls {
    [crawlerName: string]: {
        visitedUrls: string[],
        urlsToVisit: string[]
    };
};

let crawlers: IPhantomShopCrawler[] = [new CitilinkCrawler(), new UlmartCrawler()];
let urlsToCrawl: ICrawlerUrls = {};


crawlers.forEach((crawler: IPhantomShopCrawler) => {
    urlsToCrawl[crawler.shopName] = {
        visitedUrls: [],
        urlsToVisit: crawler.initialUrls
    };

    planFetchNextUrl(crawler);
});

function planFetchNextUrl(crawler: IPhantomShopCrawler): void {
    "use strict";
    let availableUrl = urlsToCrawl[crawler.shopName].urlsToVisit.pop();

    if (!availableUrl) {
        console.log(crawler.shopName + ": all urls fetched");
    } else {
        console.log(crawler.shopName + ": fetching " + availableUrl);
        fetchProducts(crawler, availableUrl)
            .then((products: IProduct[]) => {
                console.log(crawler.shopName + ": got " + products.length + " products");
            })
            .catch((err) => {
                console.log("error occured while fetching " + availableUrl); console.dir(err);
            })
            .then(() => {
                console.log(crawler.shopName + ": fetched " + availableUrl + ".");
                setTimeout(() => planFetchNextUrl(crawler), 2000);
            });
    }
}

function fetchProducts(crawler: IPhantomShopCrawler, url: string): Promise<IProduct[]> {
    "use strict";
    return new Promise<IProduct[]>((resolve, reject) => {
        return fetchFromUrl(url, crawler).then((fetchResult: IFetchResult) => {
            let urlsForCrawler = urlsToCrawl[crawler.shopName];

            urlsForCrawler.visitedUrls.push(url);

            let newUrlsToVisit = ProductsUtility.deduplicateStringArrays(urlsForCrawler.urlsToVisit, fetchResult.urls);
            urlsForCrawler.urlsToVisit = newUrlsToVisit.filter((urlToVisit) => {
                return urlsForCrawler.visitedUrls.indexOf(urlToVisit) === -1;
            });

            console.log(crawler.shopName + ": " + fetchResult.products.length + " fetched from " + url);

            resolve(fetchResult.products);
        }).catch(reject);
    });
}


function fetchFromUrl(url: string, crawler: IPhantomShopCrawler): Promise<IFetchResult> {
    "use strict";
    return PhantomCrawler.openUrl(url, crawler.cookies)
        .then((horseman: any): Promise<IFetchResult> => {
            let result: IFetchResult = {
                products: [],
                urls: []
            };

            let collectUrls = crawler.collectUrls(horseman).then((urls: string[]) => { result.urls = urls; });
            let collectProducts = crawler.collectProducts(horseman).then((products: IProduct[]) => { result.products = products; });

            return Promise.all([collectUrls, collectProducts]).then((): IFetchResult => result)
                .then(
                (fetchedResult: IFetchResult) => { 
                    horseman.close(); return fetchedResult; },
                (err) => { 
                    horseman.close(); return Promise.reject(err); 
                });
        })
        .catch((err) => {
            console.dir(err);
            return Promise.reject(err);
        });
};
