"use strict";
import path = require("path");

import {ICrawlerInstance, IPhantomCrawlerCookieFile} from "../crawler.interface";
import {PhantomCrawler} from "../crawler.baseclasses/crawler.phantom";
import {BaseCrawlerMixin} from "../crawler.mixins/crawler.base.mixin";
import {applyMixins} from "../mixin.helper";

export default class UlmartCrawler extends PhantomCrawler implements ICrawlerInstance, BaseCrawlerMixin {
    // base crawler mixin
    public writeFile: (outputPath: string, content: string, id: string) => void;
    public ensureOutput: (output: string) => Promise<any>;

    public name: string = "ulmart";

    public start(output: string): void {
        let outpuPath: string = path.join(output, this.name);
        this.ensureOutput(outpuPath).then(() => {
            this.initPhantom([this.cityCookie]);
            this.addUrlsToVisit(this.intiialUrlsToFetch);

            this.parseNextUrl(outpuPath, this.fetchUrl);
        });
    }
    
    private baseUrl: string = "http://www.ulmart.ru";
    private intiialUrlsToFetch: string[] = [
        "http://www.ulmart.ru/catalog/hardware",
        "http://www.ulmart.ru/catalog/95379",
        "http://www.ulmart.ru/catalog/computers_notebooks",
        "http://www.ulmart.ru/catalog/country_house_diy",
        "http://www.ulmart.ru/catalog/93306",
        "http://www.ulmart.ru/catalog/93299"];

    private showMoreSelector: string = ".js-show-more-parent";
    private catalogSelector: string = ".col-main-section .row .js-gtm-click-menu";
    private cityCookie: IPhantomCrawlerCookieFile = {
        name: "city",
        value: "18413",
        domain: "ulmart.ru"
    };

    private fetchUrl = (url: string, outputPath: string): Promise<any> => {
        console.log("---started " + url);
        return this.openPage(url).then((horseman: any) => {
            horseman
                .exists(this.showMoreSelector)
                .then((showMoreVisible: boolean) => this.handleShowMore(horseman, showMoreVisible))
                .then(() => this.collectHrefsOnPage(horseman))
                .then((hrefs: string[]) => this.addUrlsToVisit(hrefs))
                .then(() => this.collectProductsOnPage(horseman))
                .then((dataArray: any[]) => {
                    this.writeFile(outputPath, JSON.stringify(dataArray), url);
                    console.log(dataArray.length + " items were fetched");
                })
                .then(() => console.log("---finished " + url));
        });
    };


    private handleShowMore = (horseman: any, showMoreVisible: boolean): Promise<any> => {
        if (showMoreVisible) {
            return this.clickAllShowMoreElements(horseman, this.showMoreSelector);
        }
        return Promise.resolve();
    };

    private collectHrefsOnPage = (horseman: any): Promise<string[]> => {
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.catalogSelector, this.baseUrl);
    };

    private clickAllShowMoreElements = (horseman: any, showMoreSelector: string): Promise<any> => {
        let evaluateShownFunc = () => {
            return {
                currentlyShown: parseInt($("#total-show-count").html(), 10),
                totalItems: parseInt($("#max-show-count").html(), 10)
            };
        };

        return horseman.evaluate(evaluateShownFunc, showMoreSelector)
            .then((result: any) => {
                let pageSize = result.currentlyShown;
                let currShown = result.currentlyShown;
                let maxItems = result.totalItems;

                let resultPromise = horseman;

                let appendShowMore = (waitForShow: number) => {
                    resultPromise = resultPromise
                        .click(showMoreSelector + " " + ".js-show-more")
                        .waitFor(() => parseInt($("#total-show-count").html(), 10), Math.min(waitForShow, maxItems));
                };

                for (let i = 0; i < Math.floor(maxItems / pageSize); i++) {
                    currShown = currShown + pageSize;

                    appendShowMore(currShown);
                }

                return resultPromise;
            });
    };

    private collectProductsOnPage = (horseman: any): any[] => {
        return horseman.evaluate(() => {
            let dupes = [];

            let filterFunc = (obj: any) => obj.eventLabel === "product";
            let reduceFunc = (prev: [any], cur: any) => prev.concat(cur.eventProducts);
            let filterDeduplicateFunc = (item: any) => {
                if (dupes.indexOf(item.eventProductId) === -1) {
                    dupes.push(item.eventProductId);
                    return true;
                } else {
                    return false;
                }
            };

            /* tslint:disable:no-eval */
            // code is run inside phantomjs
            return eval("dataLayer")
            /* tslint:enable:(no-eval */
                .filter(filterFunc)
                .reduce(reduceFunc, [])
                .filter(filterDeduplicateFunc);
        });
    };
}

applyMixins(UlmartCrawler, [BaseCrawlerMixin]);
