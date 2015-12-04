import horseman = require("node-horseman"); // tsd file was created manually

import {IPhantomCrawlerCookieFile} from "./crawler.interface";

export let openUrl = (url: string, cookies: IPhantomCrawlerCookieFile[]): Promise<any> => {
    return new Promise((resolve, reject) => {
        let horsemanInstanse = new horseman({ loadImages: false });
        horsemanInstanse.userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0");
        horsemanInstanse.cookies(cookies);

        horsemanInstanse.open(url)
            .then(
            () => {
                resolve(horsemanInstanse);
            },
            (err) => reject({ urlRequested: url, error: err, devDesc: "horseman failed to open" }));
    });
};

export let collectRelativeUrlsFromSelector = (horseman: any, selector: string, baseUrl: string): Promise<string[]>  => {
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

    return new Promise<string[]>((resolve, reject) => {
        horseman.evaluate(collectorFunc, selector, baseUrl)
            .then((hrefs: string[]) => resolve(hrefs), (err: any) => reject({ error: err, devDesc: "collecting urls failed" }));
    });
};
