export let openUrl = (horsemanInstanse: any, url: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        horsemanInstanse.open(url)
            .then(
            () => {
                resolve(horsemanInstanse);
            },
            (err) => reject({
                devDesc: "horseman failed to open",
                error: err,
                urlRequested: url
            }));
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
            .then((hrefs: string[]) => resolve(hrefs))
            .catch((err: any) => reject({ devDesc: "collecting urls failed", error: err }));
    });
};
