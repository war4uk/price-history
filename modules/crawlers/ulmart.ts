"use strict";
import path = require("path");

import {ICrawlerInstance, IPhantomCrawlerCookieFile, ICrawlerLoggerStatic} from "../crawler.interface";
import {PhantomCrawler} from "../crawler.baseclasses/crawler.phantom";
import {BaseCrawlerMixin} from "../crawler.mixins/crawler.base.mixin";
import {applyMixins} from "../mixin.helper";

export default class UlmartCrawler extends PhantomCrawler implements ICrawlerInstance, BaseCrawlerMixin {
    // base crawler mixin
    public writeFile: (outputPath: string, content: string, id: string) => void;
    public ensureOutput: (output: string) => Promise<any>;

    public name: string = "ulmart";

    public constructor(output: string, loggerStatic: ICrawlerLoggerStatic) {
        super(new loggerStatic(output, "ulmart"));

        this.output = output;
    }

    public start(): void {
        let outpuPath: string = path.join(this.output, this.name);
        this.ensureOutput(outpuPath).then(() => {
            this.setCookies([this.cityCookie]);
            this.addUrlsToVisit(this.intiialUrlsToFetch);

            this.parseNextUrl(outpuPath, this.fetchUrl);
        });
    }

    private output: string;
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
        this.logger.log("fetching " + url);
        return this.openPage(url).then(() => {
            return this.getHorseman()
                .exists(this.showMoreSelector)
                .then((showMoreVisible: boolean) => this.handleShowMore(showMoreVisible))
                .then(() => this.collectHrefsOnPage())
                .then((hrefs: string[]) => this.addUrlsToVisit(hrefs))
                .then(() => this.collectProductsOnPage())
                .then((dataArray: any[]) => {
                    this.writeFile(outputPath, JSON.stringify(dataArray), url);
                    this.logger.log(dataArray.length + " items were fetched from " + url);
                })
                .then(() => this.logger.log("finished " + url));
        });
    };


    private handleShowMore = (showMoreVisible: boolean): Promise<any> => {
        if (showMoreVisible) {
            return this.clickAllShowMoreElements(this.showMoreSelector);
        }
        return Promise.resolve();
    };

    private collectHrefsOnPage = (): Promise<string[]> => {
        let horseman = this.getHorseman();
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.catalogSelector, this.baseUrl);
    };

    private clickAllShowMoreElements = (showMoreSelector: string): Promise<any> => {
        let horseman = this.getHorseman();

        let evaluateShownFunc = () => {
            return {
                currentlyShown: parseInt($("#total-show-count").html(), 10),
                totalItems: parseInt($("#max-show-count").html(), 10)
            };
        };

        /* tslint:disable:typedef */
        return new Promise((resolve, reject) => {
            /* tslint:enable:typedef */
            horseman.evaluate(evaluateShownFunc, showMoreSelector)
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

                    Promise.resolve(resultPromise).then(() => resolve(horseman));
                });
        });
    };

    private collectProductsOnPage = (): any[] => {
        let horseman = this.getHorseman();

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
