import fs = require("fs");
import path = require("path");
import Horseman = require("node-horseman"); // tsd file was created manually
import mkdirp = require("mkdirp");

import {ICrawlerInstance, ICrawlerCookieFile} from "../crawler.interface";

let urlsToFetch: string[] = [
    "http://www.ulmart.ru/catalog/hardware",
    "http://www.ulmart.ru/catalog/95379",
    "http://www.ulmart.ru/catalog/computers_notebooks",
    "http://www.ulmart.ru/catalog/country_house_diy"];
let visitedUrls: string[] = [];
let horseman: any;

export default class UlmartCrawler implements ICrawlerInstance {
    public name: string = "ulmart";

    private showMoreSelector: string = ".js-show-more-parent";
    private catalogSelector: string = ".col-main-section .row .js-gtm-click-menu";
    private cityCookie: ICrawlerCookieFile = {
        name: "city",
        value: "18413",
        domain: "ulmart.ru"
    };

    public start(output: string): void {
        let outpuPath: string = path.join(output, this.name);
        mkdirp(outpuPath, () => {
            if (!!horseman) {
                horseman.close();
            }

            horseman = new Horseman({ loadImages: false });

            horseman
                .userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0");

            let writeFile = (content: string, id: string) => {
                fs.writeFile(path.join(outpuPath, id.replace(/\//g, "_").replace(/:/g, "_")), content);
            };

            console.log(this.name + " " + output);

            this.crawlAvailableUrl(writeFile);
        });
    };

    private crawlAvailableUrl(callback: (content: string, id: string) => void): void {
        let url: string = urlsToFetch.shift();

        if (!url) {
            horseman.close();
            return;
        }

        if (visitedUrls.indexOf(url) > -1) {
            setTimeout(() => this.crawlAvailableUrl(callback), 4000);
        }

        visitedUrls.push(url);

        this.parsePage(url, callback)
            .then(() => setTimeout(() => this.crawlAvailableUrl(callback), 4000));
    };

    private parsePage(url: string, callback: (content: string, id: string) => void): Promise<number> {
        let result: Promise.Resolver<number> = Promise.defer<number>();

        console.log("---visiting: " + url);

        horseman
            .cookies(this.cityCookie)
            .open(url)
            .exists(this.showMoreSelector)
            .then((showMoreVisible: boolean) => {
                if (showMoreVisible) {
                    return this.clickAllShowMoreElements(this.showMoreSelector);
                }
                return Promise.resolve();
            })
            .then(() => this.collectHrefsOnPage())
            .then((hrefs: string[]) => {
                let addedUrls = 0;
                hrefs.forEach((href: string): void => {
                    if (visitedUrls.indexOf(href) === -1 && urlsToFetch.indexOf(href) === -1) {
                        urlsToFetch.push(href);
                        addedUrls = addedUrls + 1;
                    }
                });

                console.log(addedUrls + " urls were added to be visited");
            })
            .then(() => this.collectProductsOnPage())
            .then((dataArray: any[]) => {
                callback(JSON.stringify(dataArray), url);
                result.resolve();

                console.log(dataArray.length + " items were fetched");
            })
            .then(() => console.log("---finished " + url));

        return result.promise;
    };

    private collectHrefsOnPage(): Promise<string[]> {
        let collectorFunc = (selector: string): string[] => {
            let hrefs = [];
            $(selector).each((index: number, value: Element) => {
                let href = $(value).attr("href");

                if (href.indexOf("/") === 0) {
                    hrefs.push("http://www.ulmart.ru" + href);
                }
            });

            return hrefs;
        };

        return horseman.evaluate(collectorFunc, this.catalogSelector);
    };


    private collectProductsOnPage(): any[] {
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
    }

    private clickAllShowMoreElements(showMoreSelector: string): Promise<any> {
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
};
