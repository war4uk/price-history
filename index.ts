"use strict";

import ProductsUtility = require("./modules/product.utility");
import ProductsWriter = require("./modules/products.writer");
import CrawlerCollector = require("./modules/crawlers.collector");

import {IPhantomShopCrawler, IFetchResult, ICrawlerUrls} from "./modules/crawler.interface";
import {CitilinkCrawler} from "./modules/crawlers/citilink";
import {UlmartCrawler} from "./modules/crawlers/ulmart";

import logger from "./modules/logger";
import configuration from "./modules/configuration";

interface ICrawlerStats {
    [crawlerName: string]: ICrawlerUrls;
};

let dateNow: Date = new Date();


planDailyCrawl();
setInterval(planDailyCrawl, 24 * 60 * 60 * 1000); // once a day

function planDailyCrawl(): void {
    "use strict";
    logger.log("info", "crawl started");
    let crawlers: IPhantomShopCrawler[] = [new CitilinkCrawler(), new UlmartCrawler()];
    let stats: ICrawlerStats = {};
    
    crawlers.forEach((crawler: IPhantomShopCrawler) => {
        logger.log("info", "new crawler initiated: " + crawler.shopName + " , initialUrls: " + crawler.initialUrls.join());
        stats[crawler.shopName] = {
            urlsToVisit: crawler.initialUrls,
            visitedUrls: []
        };

        let outputPath = CrawlerCollector.getOutputPath(crawler, configuration.dumpPath, dateNow);

        ProductsWriter.ensureOutput(outputPath)
            .then(() => planNextUrl(crawler, outputPath, stats));
    });
}

function planNextUrl(crawler: IPhantomShopCrawler, outputPath: string, curStats: ICrawlerStats): void {
    "use strict";
    getAvailableUrl(crawler, curStats[crawler.shopName])
        .then((url: string) => {
            logger.log("info", crawler.shopName + ": fetching " + url);
            curStats[crawler.shopName].visitedUrls.push(url);
            return planFetchFromUrl(crawler, url)
                .then((fetchResult: IFetchResult) => {
                    updateStats(fetchResult, crawler, curStats);
                    ProductsWriter.writeFile(outputPath, CrawlerCollector.normalizeUrl(url), JSON.stringify(fetchResult.products));
                    logger.log("info", crawler.shopName + ": got " + fetchResult.products.length + " products");
                }).catch((err) => {
                    logger.log("error", crawler.shopName + "error when fetching " + url);
                    return Promise.reject(err);
                });
        })
        .catch((err) => {
            if (err.err === "all urls fetched") {
                return Promise.reject(err);
            }
        })
        .then(() => {
            setTimeout(() => planNextUrl(crawler, outputPath, curStats), 1000);
        })
        .catch((err) => {
            logger.log("info", crawler.shopName + ": finished. Fetched: " + curStats[crawler.shopName].visitedUrls.length);
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

function updateStats(fetchResult: IFetchResult, crawler: IPhantomShopCrawler, curStats: ICrawlerStats): ICrawlerStats {
    "use strict";
    let crawlerUrls = curStats[crawler.shopName];
    let newUrlsToVisit = ProductsUtility.deduplicateStringArrays(crawlerUrls.urlsToVisit, fetchResult.urls);

    crawlerUrls.urlsToVisit = newUrlsToVisit.filter((urlToVisit) => {
        return crawlerUrls.visitedUrls.indexOf(urlToVisit) === -1;
    });

    return curStats;
}
