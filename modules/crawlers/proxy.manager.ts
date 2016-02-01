import logger from "../logger";

export interface IProxy {
    url: string;
    type: string;
    errorsOccured: number;
}

let noProxy = {
    url: undefined,
    type: undefined,
    errorsOccured: 0
};

export interface IProxyManager {
    getProxy(): IProxy;
    reportConnectionError(url: string): void;
    reportConnectionSuccess(url: string): void;
}

class ProxyManagerImpl implements IProxyManager {
    public connectionErrorsLimit: number = 5;

    private proxyList: IProxy[] = [
        {
            url: "217.20.83.130:3128",
            type: "http",
            errorsOccured: 0
        }];

    public getProxy = (): IProxy => {
        this.shuffleProxies(); // pick a random available proxy in a list
        
        for (let i = 0; i < this.proxyList.length; i++) {
            let proxy: IProxy = this.proxyList[i];
            if (proxy.errorsOccured < this.connectionErrorsLimit) {
                return proxy;
            }
        }
        return noProxy;
    };

    public reportConnectionSuccess = (url: string): void => {
        if (!url) {
            return;
        }

        let proxy = this.getProxyByUrl(url);

        if (proxy && proxy.errorsOccured > 0) {
            proxy.errorsOccured--;
        }
    };

    public reportConnectionError = (url: string): void => {
        if (!url) {
            return;
        }

        let proxy = this.getProxyByUrl(url);

        if (proxy) {
            proxy.errorsOccured++;

            if (proxy.errorsOccured === this.connectionErrorsLimit) {
                logger.log("info", "PROXY DEAD" + " " + url + " considered dead as max consequent error number reached");
            }
        }
    };

    private getProxyByUrl = (url: string): IProxy => {
        for (let i = 0; i < this.proxyList.length; i++) {
            let proxy: IProxy = this.proxyList[i];

            if (proxy.url === url) {
                return proxy;
            }
        }
        return null;
    };

    private shuffleProxies() {
        for (let i = this.proxyList.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = this.proxyList[i];
            this.proxyList[i] = this.proxyList[j];
            this.proxyList[j] = temp;
        }
    }
}

export var ProxyManager: IProxyManager = new ProxyManagerImpl();
