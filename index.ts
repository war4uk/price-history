"use strict";
import "./modules/express_config.js";

import ProductsUtility = require("./modules/product.utility");
import ProductsWriter = require("./modules/products.writer");
import CrawlerCollector = require("./modules/crawlers.collector");

import {IPhantomShopCrawler, IFetchResult, ICrawlerUrls} from "./modules/crawler.interface";
import {CitilinkCrawler} from "./modules/new_crawlers/citilink";
import {UlmartCrawler} from "./modules/new_crawlers/ulmart";

interface ICrawlerStats {
    [crawlerName: string]: ICrawlerUrls;
};

let stats: ICrawlerStats = {};
let crawlers: IPhantomShopCrawler[] = [new CitilinkCrawler(), new UlmartCrawler()];
let dumpPath: string = "./dump";
let dateNow: Date = new Date();

planDailyCrawl();
setInterval(planDailyCrawl, 24 * 60 * 60 * 1000); // once a day

function planDailyCrawl(): void {
    "use strict";
    crawlers.forEach((crawler: IPhantomShopCrawler) => {
        stats[crawler.shopName] = {
            urlsToVisit: crawler.initialUrls,
            visitedUrls: []
        };

        let outputPath = CrawlerCollector.getOutputPath(crawler, dumpPath, dateNow);

        ProductsWriter.ensureOutput(outputPath)
            .then(() => planNextUrl(crawler, outputPath));
    });
}


function planNextUrl(crawler: IPhantomShopCrawler, outputPath: string): void {
    "use strict";
    getAvailableUrl(crawler, stats[crawler.shopName])
        .then((url: string) => {
            console.log(crawler.shopName + ": fetching " + url);
            stats[crawler.shopName].visitedUrls.push(url);
            return planFetchFromUrl(crawler, url)
                .then((fetchResult: IFetchResult) => {
                    updateStats(fetchResult, crawler);
                    ProductsWriter.writeFile(outputPath, CrawlerCollector.normalizeUrl(url), JSON.stringify(fetchResult.products));
                    console.log(crawler.shopName + ": got " + fetchResult.products.length + " products");
                }).catch((err) => {
                    console.log(crawler.shopName + "error when fetching " + url);
                    return Promise.reject(err);
                });
        })
        .catch((err) => console.log("Error caught: " + err))
        .then(() => {
            setTimeout(() => planNextUrl(crawler, outputPath), 1000);
        });
};

function getAvailableUrl(crawler: IPhantomShopCrawler, crawlerUrls: ICrawlerUrls): Promise<string> {
    "use strict";
    let url = crawlerUrls.urlsToVisit.pop();
    if (!!url) {
        return Promise.resolve(url);
    } else {
        return Promise.reject({ err: "all urls fetched" });
    }
}

function planFetchFromUrl(crawler: IPhantomShopCrawler, url: string): Promise<IFetchResult> {
    "use strict";
    return new Promise<IFetchResult>((resolve, reject) => {
        setTimeout(() => {
            CrawlerCollector.fetchFromUrl(url, crawler).then(resolve, reject);
        });
    });
}

function updateStats(fetchResult: IFetchResult, crawler: IPhantomShopCrawler): IFetchResult {
    "use strict";
    let crawlerUrls = stats[crawler.shopName];
    let newUrlsToVisit = ProductsUtility.deduplicateStringArrays(crawlerUrls.urlsToVisit, fetchResult.urls);

    crawlerUrls.urlsToVisit = newUrlsToVisit.filter((urlToVisit) => {
        return crawlerUrls.visitedUrls.indexOf(urlToVisit) === -1;
    });

    return fetchResult;
}
