import fs = require("fs");
import path = require("path");
import Horseman = require("node-horseman"); // tsd file was created manually
import mkdirp = require("mkdirp");

import {ICrawlerInstance} from "../crawler.interface";

let urlsToFetch: string[] = ["http://www.ulmart.ru/catalog/cpu"];
let visitedUrls: string[] = [];
let horseman: any;

export default class UlmartCrawler implements ICrawlerInstance {
    public name: string = "ulmart";

    private showMoreSelector: string = ".js-show-more-parent";

    public start(output: string): void {
        let outpuPath: string = path.join(output, this.name);
        mkdirp(outpuPath, () => console.log("mkdirp failed"));

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
    };

    private crawlAvailableUrl(callback: (content: string, id: string) => void): void {
        let url: string = urlsToFetch.shift();

        if (!url || visitedUrls.indexOf(url) > -1) {
            horseman.close();
            return;
        }

        visitedUrls.push(url);

        console.log("processing: " + url);
        this.parsePage(url, this.showMoreSelector, callback);
    };

    private parsePage(url: string, showMoreSelector: string, callback: (content: string, id: string) => void): Promise<number> {
        let result: Promise.Resolver<number> = Promise.defer<number>();
        horseman.open(url)
            .exists(showMoreSelector)
            .then((showMoreVisible: boolean) => {
                if (showMoreVisible) {
                    return this.clickAllShowMoreElements(showMoreSelector);
                }
                return Promise.resolve();
            })
            .then(function(): void {
                return horseman.evaluate(new Function("return dataLayer;"));
            })
            .then(function(dataLayerObject: any): any[] {
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

                return dataLayerObject
                    .filter(filterFunc)
                    .reduce(reduceFunc, [])
                    .filter(filterDeduplicateFunc);
            })
            .then(function(dataArray: any[]): void {
                callback(JSON.stringify(dataArray), url);
                result.resolve();

                console.log("fetched from " + url + " " + dataArray.length + " items");
            });

        return result.promise;
    };

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

                for (let i = 0; i < Math.floor(maxItems / pageSize); i++) {
                    currShown = currShown + pageSize;

                    let getTotalShownFunc = () => parseInt($("#total-show-count").html(), 10);

                    resultPromise = resultPromise
                        .click(showMoreSelector + " " + ".js-show-more")
                        .waitFor(getTotalShownFunc, Math.min(currShown, maxItems));
                }

                return resultPromise;
            });
    };
};
