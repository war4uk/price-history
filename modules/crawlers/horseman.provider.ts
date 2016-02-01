"use strict";
import horseman = require("node-horseman"); // tsd file was created manually
import {IPhantomCrawlerCookieFile, IHorsemanProvider} from "./crawler.interface";
import {ProxyManager} from "./proxy.manager";

export class HorsemanProvider implements IHorsemanProvider {
    private horsemanInstanse: any;
    private cookies: IPhantomCrawlerCookieFile[];
    
    public setCookies(cookies: IPhantomCrawlerCookieFile[]): void {
        this.cookies = cookies;
    }
    
    public resetHorseman(): void {
        try {
            if (this.horsemanInstanse) {
                this.horsemanInstanse.close();
            }
        } catch (ex) {
            // swallow it
        }
        this.horsemanInstanse = null;
    }

    public getHorseman(): Promise<any> {
        if (!this.horsemanInstanse) {
            return this.getNewHorseman()
                .then((horseman) => {
                    horseman.cookies(this.cookies);
                    
                    this.horsemanInstanse = horseman;
                    return horseman;
                });
        }

        return Promise.resolve(this.horsemanInstanse);
    }

    private getNewHorseman = (): Promise<any> => {
        return new Promise((resolve, reject) => {
            let proxy = ProxyManager.getProxy();
            let horsemanInstanse = new horseman({ 
                loadImages: false,
                proxy: proxy.url,
                proxyType: proxy.type
             });
            horsemanInstanse.userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0");

            resolve(horsemanInstanse);
        });
    };
}
