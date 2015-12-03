"use strict";
import "./modules/express_config.js";

import fs = require("fs");
import path = require("path");

import ProductsUtility = require("./modules/product.utility");

import {IShopCrawler, IProduct, IFetchResult} from "./modules/crawler.interface";
import {CitilinkCrawler} from "./modules/new_crawlers/citilink";
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

let crawlers: IShopCrawler[] = [new CitilinkCrawler()];
let urlsToCrawl: ICrawlerUrls = {};


crawlers.forEach((crawler: IShopCrawler) => {
    urlsToCrawl[crawler.shopName] = {
        visitedUrls: [],
        urlsToVisit: crawler.initialUrls
    };
});

function fetchProducts(crawler: IShopCrawler, url: string): Promise<IProduct[]> {
    "use strict";
    return new Promise<IProduct[]>((resolve, reject) => {
        return crawler.fetchFromUrl(url).then((fetchResult: IFetchResult) => {
            let urlsForCrawler = urlsToCrawl[crawler.shopName];

            urlsForCrawler.visitedUrls.push(url);
            urlsForCrawler.urlsToVisit = ProductsUtility.deduplicateStringArrays(urlsForCrawler.urlsToVisit, fetchResult.urls);

            console.log(crawler.shopName + ": " + fetchResult.products.length + " fetched from " + url);

            resolve(fetchResult.products);
        }).catch(reject);
    });
}
