"use strict";
import path = require("path");

import {ICrawlerInstance, IPhantomCrawlerCookieFile} from "../crawler.interface";
import {PhantomCrawler} from "../crawler.baseclasses/crawler.phantom";
import {BaseCrawlerMixin} from "../crawler.mixins/crawler.base.mixin";
import {applyMixins} from "../mixin.helper";

export default class CitilinkCrawler extends PhantomCrawler implements ICrawlerInstance, BaseCrawlerMixin {
    // base crawler mixin
    public writeFile: (outputPath: string, content: string, id: string) => void;
    public ensureOutput: (output: string) => Promise<any>;

    public name: string = "citilink";

    private intiialUrlsToFetch: string[] = ["http://citilink.ru"];
    private cityCookie: IPhantomCrawlerCookieFile = {
        name: "city",
        value: "18413",
        domain: "ulmart.ru"
    };

    public start(output: string): void {
        let outpuPath: string = path.join(output, this.name);
        this.ensureOutput(outpuPath).then(() => {
            this.initPhantom([this.cityCookie]);
            this.addUrlsToVisit(this.intiialUrlsToFetch);

            let url = this.getAvailableUrl();

            if (!url) {
                return;
            }

            this.fetchUrl(url, outpuPath);

        });
    }

    private fetchUrl(url: string, outputPath: string): void {
        console.log("---started " + url);
        this.openPage(url).then((horseman: any) => {
            horseman
                .html()
                .then((resukt: string) => console.log(resukt));
            /* .exists(this.showMoreSelector)
             .then((showMoreVisible: boolean) => this.handleShowMore(horseman, showMoreVisible))
             .then(() => this.collectHrefsOnPage(horseman))
             .then((hrefs: string[]) => this.addUrlsToVisit(hrefs))
             .then(() => this.collectProductsOnPage(horseman))
             .then((dataArray: any[]) => {
                 this.writeFile(outputPath, JSON.stringify(dataArray), url);
                 console.log(dataArray.length + " items were fetched");
             })
             .then(() => console.log("---finished " + url))
             .then(() => this.getAvailableUrl())
             .then((nextUrl: string): any => {
                 if (nextUrl && nextUrl.length > 0) {
                     console.log("waiting to fetch " + nextUrl);
                     setTimeout(() => { return this.fetchUrl(nextUrl, outputPath); }, 4000);
                 } else {
                     console.log("all urls fetched");
                 }
             });*/
        });
    }
}

applyMixins(CitilinkCrawler, [BaseCrawlerMixin]);
