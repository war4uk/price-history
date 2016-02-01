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
        }
    };

    private getProxyByUrl = (url: string): IProxy =>{
        for (let i = 0; i < this.proxyList.length; i++) {
            let proxy: IProxy = this.proxyList[i];

            if (proxy.url === url) {
                return proxy;
            }
        }
        return null;
    };
}

export var ProxyManager: IProxyManager = new ProxyManagerImpl();
