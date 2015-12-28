import {IPhantomShopCrawler, IFetchResult, ICrawlerUrls, ICrawlerStats} from "./crawler.interface";
import ProductsWriter = require("./products.writer");
import ProductsUtility = require("./product.utility");
import CrawlerCollector = require("./crawlers.collector");

import logger from "../logger";

let pagesRequestsBeforRefresh = 100; // phantom uses too much memory of not refreshed time to time

export let initUrls = (crawler: IPhantomShopCrawler): ICrawlerUrls => {
    "use strict";
    return {
        urlsToVisit: crawler.initialUrls,
        visitedUrls: []
    };
};

export let planNextUrl = (crawler: IPhantomShopCrawler, outputPath: string, curStats: ICrawlerStats): void => {
    "use strict";
    getAvailableUrl(crawler, curStats[crawler.shopName])
        .then((url: string) => {
            logger.log("info", crawler.shopName + ": fetching " + url);
            curStats[crawler.shopName].visitedUrls.push(url);
            
            let milestoneForPhantomResetHit = (curStats[crawler.shopName].visitedUrls.length % pagesRequestsBeforRefresh) === 0;
                        
            if (milestoneForPhantomResetHit) {
                logger.log("info", crawler.shopName + ": phantom reset");
                crawler.horsemanProvider.resetHorseman();
            }
            
            return planFetchFromUrl(crawler, url)
                .then((fetchResult: IFetchResult) => {
                    updateStats(fetchResult, crawler, curStats);
                    ProductsWriter.writeFile(outputPath, CrawlerCollector.normalizeUrl(url), JSON.stringify(fetchResult.products));
                    logger.log("info", crawler.shopName + ": got " + fetchResult.products.length + " products");
                }).catch((err) => {
                    logger.log("error", crawler.shopName + "error when fetching " + url + ". Resetting phantom");
                    crawler.horsemanProvider.resetHorseman();
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
