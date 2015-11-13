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

    public start = (output: string): void => {
        let outpuPath: string = path.join(output, this.name);
        this.ensureOutput(outpuPath).then(() => {
            this.setCookies([this.cityCookie]);
            this.addUrlsToVisit(this.intiialUrlsToFetch);

            this.parseNextUrl(outpuPath, this.fetchUrl);
        });
    };


    private fetchUrl = (url: string, outputPath: string): Promise<any> => {
        console.log("---started " + url);

        return this.openPage(url).then(() => {
            return this.collectRootCategoriesOnPage()
                .then((collectedUrls: string[]) => { this.handleUrlsToVisit(collectedUrls); })
                .then(() => this.collectSubCategories())
                .then((collectedUrls: string[]) => this.handleUrlsToVisit(collectedUrls))
                .then(() => this.collectPagingUrlsOnPage())
                .then((collectedUrls: string[]) => this.handleUrlsToVisit(collectedUrls))
                .then(() => this.collectProductsOnPage())
                .then((products: any[]) => {
                    this.writeFile(outputPath, JSON.stringify(products), url);
                    console.log(products.length + " items were fetched");
                });
        });
    };

    private collectRootCategoriesOnPage = (): Promise<string[]> => {
        let horseman = this.getHorseman();
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.rootCategoriesSelector, this.baseUrl);
    };

    private collectSubCategories = (): Promise<string[]> => {
        let horseman = this.getHorseman();
        return this.collectRelativeUrlsFromSelectorOnPage(horseman, this.subCatalogSelector, this.baseUrl);
    };

    private handleUrlsToVisit = (collectedUrls: string[]): void => {
        this.addUrlsToVisit(this.filterDiscount(collectedUrls));
    };

    private filterDiscount = (urls: string[]): string[]  => {
        return urls.filter((url: string) => { return url.indexOf("/discount/") === -1; });
    };

    private collectPagingUrlsOnPage = (): Promise<string[]> => {
        let horseman = this.getHorseman();
        
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
    };
    
    // todo - same code as for ulmart
    private collectProductsOnPage = (): any[] => {
        let horseman = this.getHorseman();
        
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
    };
}

applyMixins(CitilinkCrawler, [BaseCrawlerMixin]);
