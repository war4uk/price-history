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

    private baseUrl: string = "http://citilink.ru";
    private intiialUrlsToFetch: string[] = [this.baseUrl];

    private rootCategoriesSelector: string = ".link_side-menu";
    private subCatalogSelector: string = ".catalog-content-navigation a";
    private lastPagingElSelector: string = ".page_listing .last a";

    private cityCookie: IPhantomCrawlerCookieFile = {
        name: "_space",
        value: "spb_cl%3A",
        domain: "citilink.ru"
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
            this.collectRootCategoriesOnPage(horseman)
                .then((collectedUrls: string[]) => { this.handleUrlsToVisit(collectedUrls); })
                .then(() => this.collectSubCategories(horseman))
                .then((collectedUrls: string[]) => this.handleUrlsToVisit(collectedUrls))
                .then(() => this.collectPagingUrlsOnPage(horseman))
                .then((collectedUrls: string[]) => this.handleUrlsToVisit(collectedUrls))
                .then(() => this.collectProductsOnPage(horseman))
                .then((products: any[]) => {
                    this.writeFile(outputPath, JSON.stringify(products), url);
                    console.log(products.length + " items were fetched");
                })
                .then(() => this.getAvailableUrl())
                .then((nextUrl: string): any => {
                    if (nextUrl && nextUrl.length > 0) {
                        console.log("waiting to fetch " + nextUrl);
                        setTimeout(() => { return this.fetchUrl(nextUrl, outputPath); }, 4000);
                    } else {
                        console.log("all urls fetched");
                    }
                });
        });
    }

    private collectRootCategoriesOnPage(horseman: any): Promise<string[]> {
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.rootCategoriesSelector, this.baseUrl);
    }

    private collectSubCategories(horseman: any): Promise<string[]> {
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.subCatalogSelector, this.baseUrl);
    }

    private handleUrlsToVisit(collectedUrls: string[]): void {
        this.addUrlsToVisit(this.filterDiscount(collectedUrls));
    }

    private filterDiscount(urls: string[]): string[] {
        return urls.filter((url: string) => { return url.indexOf("/discount/") === -1; });
    }
    private collectPagingUrlsOnPage(horseman: any): Promise<string[]> {
        let collectorFunc = (selector: string) => {
            let hrefs: string[] = [];
            let lastPage = parseInt($(selector).attr("data-page"), 10);
            let url = window.location.href.split(/[?#]/)[0];

            for (let i = 2; i < lastPage + 1; i++) {
                hrefs.push(url + "?p=" + i);
            }

            return hrefs;
        };

        return horseman.evaluate(collectorFunc, this.lastPagingElSelector);
    }
    
    // todo - same code as for ulmart
    private collectProductsOnPage(horseman: any): any[] {
        return horseman.evaluate(() => {
            let dupes = [];

            let filterFunc = (obj: any) => obj.eventLabel === "products";
            let reduceFunc = (prev: [any], cur: any) => prev.concat(cur.products);
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
}

applyMixins(CitilinkCrawler, [BaseCrawlerMixin]);
