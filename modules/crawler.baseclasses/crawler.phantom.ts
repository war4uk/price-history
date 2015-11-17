import horseman = require("node-horseman"); // tsd file was created manually

import {IPhantomCrawlerCookieFile, ICrawlerLogger} from "../crawler.interface";

export class PhantomCrawler {
    private urlsToFetch: string[] = [];
    private visitedUrls: string[] = [];
    private horsemanInstanse: any;
    private cookies: IPhantomCrawlerCookieFile[];

    protected logger: ICrawlerLogger;
    constructor(logger: ICrawlerLogger) {
        this.logger = logger;
    }
    
    protected getHorseman = () => {
        return this.horsemanInstanse;
    };

    protected setCookies = (cookies: IPhantomCrawlerCookieFile[]): void => {
        this.cookies = cookies;
    };

    protected parseNextUrl = (outputPath: string, fetchFunc: (url: string, outputPath: string) => Promise<any>): Promise<any> => {
        /* tslint:disable:typedef */
        return new Promise((resolve, reject) => {
            /* tslint:enable:typedef */
            let nextUrl = this.getAvailableUrl();

            if (!nextUrl || !nextUrl.length) {
                this.logger.log("all urls fetched");
                return Promise.reject("");
            }

            return Promise.resolve(nextUrl)
                .then((url: string) => fetchFunc(url, outputPath))
                .catch((error: any): void => {
                    this.logger.log("error occured: " + error);
                    this.addUrlsToVisit([nextUrl]);
                })
                .then(() => {
                    this.logger.log("waiting to fetch next url");
                    setTimeout(() => { return this.parseNextUrl(outputPath, fetchFunc); }, 4000);

                })
                .then(() => {
                    this.horsemanInstanse.close();
                });
        });
    };

    protected getAvailableUrl = (): string => {
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

    protected openPage = (url: string): Promise<any> => {
        if (!url) {
            this.horsemanInstanse.close();
            return Promise.reject({});
        }

        this.initPhantom();

        this.visitedUrls.push(url);
        
        /* tslint:disable:typedef */
        return new Promise((resolve, reject) => {
            /* tslint:enable:typedef */
            this.horsemanInstanse
                .cookies(this.cookies)
                .open(url)
                .then(() => resolve({}))
                .catch(() => reject({}));
        });
    };

    protected addUrlsToVisit = (urls: string[]): void => {
        // todo - maybe need to optimize this
        (urls || []).forEach((url: string) => {
            if (this.urlsToFetch.indexOf(url) === -1 && this.visitedUrls.indexOf(url) === -1) {
                this.urlsToFetch.push(url);
            }
        });
    };

    protected collectRelativeUrlsFromSelectorOnPage = (horseman: any, selector: string, baseUrl: string): Promise<string[]>  => {
        let collectorFunc = (selectorOnPage: string, baseUrlOnPage: string) => {
            let hrefs = [];
            $(selectorOnPage).each((index: number, element: Element) => {
                let href = $(element).attr("href") || "";

                if (href.indexOf("/") === 0) {
                    hrefs.push(baseUrlOnPage + href);
                }
            });

            return hrefs;
        };

        return horseman.evaluate(collectorFunc, selector, baseUrl);
    };

    private initPhantom = (): void => {
        if (!!this.horsemanInstanse) {
            this.horsemanInstanse.close();
        }

        this.horsemanInstanse = new horseman({ loadImages: false });

        this.horsemanInstanse
            .userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0");
    };
};
