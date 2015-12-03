"use strict";
// import path = require("path");

import PhantomCrawler = require("../phantom.crawler");
import ProductsUtility = require("../product.utility");

import {IShopCrawler, IFetchResult, IProduct, IPhantomCrawlerCookieFile} from "../crawler.interface";

export class CitilinkCrawler implements IShopCrawler {
    public shopName = "citilink";
    public initialUrls = [this.baseUrl];

    public fetchFromUrl = (url: string): Promise<IFetchResult> => {
        return PhantomCrawler.openUrl(url, [this.cityCookie])
            .then((horseman: any): Promise<IFetchResult> => {
                let result: IFetchResult = {
                    products: [],
                    urls: []
                };

                let collectUrls = this.collectUrls(horseman).then((urls: string[]) => { result.urls = urls; });
                let collectProducts = this.collectProducts(horseman).then((products: IProduct[]) => { result.products = products; });

                return Promise.all([collectUrls, collectProducts]).then((): IFetchResult => result);
            })
            .catch((err) => {
                console.dir(err);
                return Promise.reject(err);
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

    private collectProducts = (horseman: any): Promise<IProduct[]> => {
        return new Promise<IProduct[]>((resolve, reject) => {
            let collectorFunct = () => {
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

            return horseman.evaluate(collectorFunct).then((rawProducts: any[]): void => {
                let result: IProduct[] = rawProducts.map((rawProduct) => {
                    return {
                        uniqueIdInShop: rawProduct.eventProductId,
                        marketName: this.shopName,
                        fetchedDate: new Date(),
                        name: rawProduct.eventProductName,
                        price: rawProduct.eventProductPrice,
                        categoryName: rawProduct.eventCategoryName,
                        rawData: rawProduct
                    };
                });
                resolve(result);
            });
        });
    };

    private collectUrls = (horseman: any): Promise<string[]> => {
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
