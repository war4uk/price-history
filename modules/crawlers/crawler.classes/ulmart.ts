"use strict";
// import path = require("path");

import PhantomCrawler = require("../phantom.crawler");

import {IPhantomShopCrawler, IProduct, IPhantomCrawlerCookieFile, IHorsemanProvider, REVISION} from "../crawler.interface";

export class UlmartCrawler implements IPhantomShopCrawler {
    public horsemanProvider: IHorsemanProvider;
    public shopName = "ulmart";
    public initialUrls = [];

    public constructor(horsemanProvider: IHorsemanProvider) {
        this.initialUrls = [
            "http://www.ulmart.ru/catalog/hardware",
            "http://www.ulmart.ru/catalog/95379",
            "http://www.ulmart.ru/catalog/computers_notebooks",
            "http://www.ulmart.ru/catalog/country_house_diy",
            "http://www.ulmart.ru/catalog/93306",
            "http://www.ulmart.ru/catalog/93299"];
        this.horsemanProvider = horsemanProvider;
        this.horsemanProvider.setCookies([this.cityCookie]);
    }

    public collectProducts = (): Promise<IProduct[]> => {
        return new Promise<IProduct[]>((resolve, reject) => {
            this.horsemanProvider.getHorseman()
                .then((horseman: any) => {
                    return horseman
                        .exists(this.showMoreSelector)
                        .then((showMoreVisible: boolean) => this.handleShowMore(horseman, showMoreVisible))
                        .then(() => horseman.evaluate(this.collectProductsOnPhantom))
                        .then((rawProducts: any[]): void => {
                            let result: IProduct[] = rawProducts.map((rawProduct) => {
                                return {
                                    categoryName: rawProduct.eventCategoryName,
                                    fetchedDate: new Date(),
                                    ifaceRevision: REVISION,
                                    marketName: this.shopName,
                                    name: rawProduct.eventProductName,
                                    price: rawProduct.eventProductPrice,
                                    rawData: rawProduct,
                                    uniqueIdInShop: rawProduct.eventProductId
                                };
                            });
                            resolve(result);
                        });
                }).catch(reject);
        });
    };

    public collectUrls = (): Promise<string[]> => {
        return this.horsemanProvider.getHorseman()
        .then((horseman: any) => PhantomCrawler.collectRelativeUrlsFromSelector(horseman, this.catalogSelector, this.baseUrl));        
    };

    private cityCookie: IPhantomCrawlerCookieFile = {
        domain: "ulmart.ru",
        name: "city",
        value: "18413"
    };

    private baseUrl: string = "http://www.ulmart.ru";
    private showMoreSelector: string = ".js-show-more-parent";
    private catalogSelector: string = ".col-main-section .row .js-gtm-click-menu";

    private clickAllShowMoreElements = (horseman: any, showMoreSelector: string): Promise<any> => {
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

                    return resultPromise;
                })
                .then(resolve)
                .catch(reject);
        });
    };

    private handleShowMore = (horseman: any, showMoreVisible: boolean): Promise<any> => {
        if (showMoreVisible) {
            return this.clickAllShowMoreElements(horseman, this.showMoreSelector);
        }
        return Promise.resolve();
    };

    private collectProductsOnPhantom = (): any[] => {
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
    };
}
