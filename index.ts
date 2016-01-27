"use strict"; // npm install --msvs_version=2013

import ProductsWriter = require("./modules/crawlers/products.writer");
import CrawlerCollector = require("./modules/crawlers/crawlers.collector");


import {HorsemanProvider} from "./modules/crawlers/horseman.provider";

import {IPhantomShopCrawler, ICrawlerStats} from "./modules/crawlers/crawler.interface";
import {CitilinkCrawler} from "./modules/crawlers/crawler.classes/citilink";
import {UlmartCrawler} from "./modules/crawlers/crawler.classes/ulmart";

import {planNextUrl, initUrls} from "./modules/crawlers/data.fetcher";

import logger from "./modules/logger";
import configuration from "./modules/configuration";

planDailyCrawl();
setInterval(planDailyCrawl, 24 * 60 * 60 * 1000); // once a day

function planDailyCrawl(): void {
    "use strict";
    let dateNow: Date = new Date();
    logger.log("info", "crawl started");
    let crawlers: IPhantomShopCrawler[] = [
        new CitilinkCrawler(new HorsemanProvider()),
        // new UlmartCrawler(new HorsemanProvider())
    ];
    let stats: ICrawlerStats = {};

    crawlers.forEach((crawler: IPhantomShopCrawler) => {
        logger.log("info", "new crawler initiated: " + crawler.shopName + " , initialUrls: " + crawler.initialUrls.join());
        stats[crawler.shopName] = initUrls(crawler);

        let outputPath = CrawlerCollector.getOutputPath(crawler, configuration.dumpPath, dateNow);

        ProductsWriter.ensureOutput(outputPath)
            .then(() => planNextUrl(crawler, outputPath, stats));
    });
}
