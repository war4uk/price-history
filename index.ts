"use strict";
import "./modules/express_config.js";

import fs = require("fs");
import path = require("path");

import {ICrawlerInstance, ICrawlerStatic} from "./modules/crawler.interface";
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
}
