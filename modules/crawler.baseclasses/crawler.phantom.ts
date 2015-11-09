import horseman = require("node-horseman"); // tsd file was created manually

import {IPhantomCrawlerCookieFile} from "../crawler.interface";

export class PhantomCrawler {
    private urlsToFetch: string[] = [];
    private visitedUrls: string[] = [];
    private horsemanInstanse: any;
    private cookies: IPhantomCrawlerCookieFile[];

    protected initPhantom(cookies: IPhantomCrawlerCookieFile[]): void {
        if (!!this.horsemanInstanse) {
            this.horsemanInstanse.close();
        }

        this.cookies = cookies;

        this.horsemanInstanse = new horseman({ loadImages: false });

        this.horsemanInstanse
            .userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0");
    };

    protected getAvailableUrl(): string {
        let url: string = this.urlsToFetch.shift();

        while (this.visitedUrls.indexOf(url) > -1 && this.urlsToFetch.length > 0) {
            url = this.urlsToFetch.shift();
        }

        if (this.visitedUrls.indexOf(url) === -1) {
            return url;
        } else {
            return "";
        }
    };

    protected openPage(url: string): Promise<any> {
        if (!url) {
            this.horsemanInstanse.close();
            return Promise.reject({});
        }

        this.visitedUrls.push(url);

        return this.horsemanInstanse
            .cookies(this.cookies)
            .open(url)
            .then(() => this.horsemanInstanse);
    };

    protected addUrlsToVisit(urls: string[]): void {
        // todo - maybe need to optimize this
        urls.forEach((url: string) => {
            if (this.urlsToFetch.indexOf(url) === -1 && this.visitedUrls.indexOf(url) === -1) {
                this.urlsToFetch.push(url);
            }
        });
    }

    protected collectRelativeUrlsFromSelectorOnPage(horseman: any, selector: string, baseUrl: string): Promise<string[]> {
        let collectorFunc = (selectorOnPage: string, baseUrlOnPage: string) => {
            let hrefs = [];
            $(selectorOnPage).each((index: number, element: Element) => {
                let href = $(element).attr("href");

                if (href.indexOf("/") === 0) {
                    hrefs.push(baseUrlOnPage + href);
                }
            });

            return hrefs;
        };

        return horseman.evaluate(collectorFunc, selector, baseUrl);
    }
};
