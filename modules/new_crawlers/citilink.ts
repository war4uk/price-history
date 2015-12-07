"use strict";
// import path = require("path");

import PhantomCrawler = require("../phantom.crawler");
import ProductsUtility = require("../product.utility");

import {IPhantomShopCrawler, IProduct, IPhantomCrawlerCookieFile, REVISION} from "../crawler.interface";

export class CitilinkCrawler implements IPhantomShopCrawler {
    public shopName = "citilink";
    public initialUrls = [];
    public cookies: IPhantomCrawlerCookieFile[];

    public constructor() {
        this.initialUrls = [this.baseUrl];
        this.cookies = [this.cityCookie];
    }

    public collectProducts = (horseman: any): Promise<IProduct[]> => {
        return new Promise<IProduct[]>((resolve, reject) => {
            return horseman.evaluate(this.collectProductsOnPhantom)
                .then((rawProducts: any[]): void => {
                    let result: IProduct[] = rawProducts.map((rawProduct) => {
                        return {
                            uniqueIdInShop: rawProduct.eventProductId,
                            marketName: this.shopName,
                            fetchedDate: new Date(),
                            name: rawProduct.eventProductName,
                            price: rawProduct.eventProductPrice,
                            categoryName: rawProduct.eventCategoryName,
                            rawData: rawProduct,
                            ifaceRevision : REVISION
                        };
                    });
                    resolve(result);
                }).catch(reject);
        });
    };

    public collectUrls = (horseman: any): Promise<string[]> => {
        return new Promise<string[]>((resolve, reject) => {
            let resultUrls = [];

            let dedupeResults = (newUrls: string[]) => {
                resultUrls = ProductsUtility.deduplicateStringArrays(resultUrls, newUrls);
            };

            let collectRootCategories = PhantomCrawler.collectRelativeUrlsFromSelector(horseman, this.rootCategoriesSelector, this.baseUrl)
                .then(dedupeResults);

            let collectSubCategories = PhantomCrawler.collectRelativeUrlsFromSelector(horseman, this.subCatalogSelector, this.baseUrl)
                .then(dedupeResults);

            let collectPaging = this.collectPagingUrls(horseman).then(dedupeResults);

            return Promise.all([collectRootCategories, collectSubCategories, collectPaging]).then(() => resolve(resultUrls));
        });
    };

    private cityCookie: IPhantomCrawlerCookieFile = {
        name: "_space",
        value: "spb_cl%3A",
        domain: "citilink.ru"
    };
    private rootCategoriesSelector: string = ".link_side-menu";
    private baseUrl: string = "http://citilink.ru";
    private subCatalogSelector: string = ".catalog-content-navigation a";
    private lastPagingElSelector: string = ".page_listing .last a";

    private collectProductsOnPhantom = () => {
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
    };

    private collectPagingUrls = (horseman: any): Promise<string[]> => {
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

}
