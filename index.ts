"use strict";
import "./modules/express_config.js";

/*import fs = require("fs");*/
import path = require("path");

import ProductsUtility = require("./modules/product.utility");
import ProductsWriter = require("./modules/products.writer");

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
let dumpPath: string = "./dump";
let dateNow: Date = new Date();

crawlers.forEach((crawler: IShopCrawler) => {
    urlsToCrawl[crawler.shopName] = {
        visitedUrls: [],
        urlsToVisit: crawler.initialUrls
    };

    ProductsWriter.ensureOutput(getOutputPath(crawler, dumpPath, dateNow));
    planFetchNextUrl(crawler);
});

function getOutputPath(crawler: IShopCrawler, dumpPath: string, dateStarted: Date) {
    "use strict";
    let formattedDate: string = `${dateNow.getUTCFullYear() }-${dateNow.getUTCMonth() + 1}-${dateNow.getUTCDate() }`;
    return path.join(dumpPath, formattedDate, crawler.shopName);
}

function normalizeUrl(url: string): string {
        "use strict";
    return url.replace(/\//g, "_").replace(/:/g, "_").replace(/\?/g, "_"));
}

function planFetchNextUrl(crawler: IShopCrawler): void {
    "use strict";
    let availableUrl = urlsToCrawl[crawler.shopName].urlsToVisit.pop();

    if (!availableUrl) {
        console.log(crawler.shopName + ": all urls fetched");
    } else {
        console.log(crawler.shopName + ": fetching " + availableUrl);
        fetchProducts(crawler, availableUrl)
            .then((products: IProduct[]) => {
                ProductsWriter.writeFile(getOutputPath(crawler, dumpPath, dateNow), normalizeUrl(availableUrl), products);
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

function fetchProducts(crawler: IShopCrawler, url: string): Promise<IProduct[]> {
    "use strict";
    return new Promise<IProduct[]>((resolve, reject) => {
        return crawler.fetchFromUrl(url).then((fetchResult: IFetchResult) => {
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
