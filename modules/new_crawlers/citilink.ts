"use strict";
// import path = require("path");

import {IShopCrawler, IFetchResult, IProduct, IPhantomCrawlerCookieFile} from "../crawler.interface";
import {PhantomCrawler} from "../phantom.crawler"
import {FetchResultManager} from "../fetchResult.manager.ts"

export default class CitilinkCrawler implements IShopCrawler {
    public fetchFromUrl = (url: string): Promise<IFetchResult> => {
        return PhantomCrawler.openUrl(url, [this.cityCookie])
            .then((horseman: any): Promise<IFetchResult> => {
                var result: IFetchResult = {
                    products: [],
                    urls: []
                };

                var collectUrls = this.collectUrls(horseman).then((urls: string[]) => { result.urls = urls });
                var collectProducts = Promise.resolve([]).then((products: IProduct[]) => { result.products = products });

                return Promise.all([collectUrls, collectProducts]).then((): IFetchResult => result);
            })
            .catch((err) => {
                console.dir(err);
                return Promise.reject(err);
            })
    }

    private cityCookie: IPhantomCrawlerCookieFile = {
        name: "_space",
        value: "spb_cl%3A",
        domain: "citilink.ru"
    };
    private rootCategoriesSelector: string = ".link_side-menu";
    private baseUrl: string = "http://citilink.ru";
    private subCatalogSelector: string = ".catalog-content-navigation a";
    private lastPagingElSelector: string = ".page_listing .last a";


    private collectUrls = (horseman: any): Promise<string[]> => {
        return new Promise<string[]>((resolve, reject) => {
            var resultUrls = [];

            var dedupeResults = (newUrls: string[]) => {
                resultUrls = FetchResultManager.deduplicateStringArrays(resultUrls, newUrls);
            }

            var collectRootCategories = PhantomCrawler.collectRelativeUrlsFromSelectorOnPage(horseman, this.rootCategoriesSelector, this.baseUrl)
                .then(dedupeResults);

            var collectSubCategories = PhantomCrawler.collectRelativeUrlsFromSelectorOnPage(horseman, this.subCatalogSelector, this.baseUrl)
                .then(dedupeResults);

            var collectPaging = this.collectPagingUrlsOnPage(horseman).then(dedupeResults);

            return Promise.all([collectRootCategories, collectSubCategories, collectPaging]).then(() => resolve(resultUrls));
        });
    }

    private collectPagingUrlsOnPage = (horseman: any): Promise<string[]> => {
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
