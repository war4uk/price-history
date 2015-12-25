"use strict";

import ProductsWriter = require("./modules/products.writer"); //
import CrawlerCollector = require("./modules/crawlers.collector"); //

import {IPhantomShopCrawler, ICrawlerStats} from "./modules/crawler.interface";
import {CitilinkCrawler} from "./modules/crawlers/citilink";
import {UlmartCrawler} from "./modules/crawlers/ulmart";

import {planNextUrl, initUrls} from "./modules/data.fetcher";

import logger from "./modules/logger";
import configuration from "./modules/configuration";

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
        stats[crawler.shopName] = initUrls(crawler);

        let outputPath = CrawlerCollector.getOutputPath(crawler, configuration.dumpPath, dateNow);

        ProductsWriter.ensureOutput(outputPath)
            .then(() => planNextUrl(crawler, outputPath, stats));
    });
}
