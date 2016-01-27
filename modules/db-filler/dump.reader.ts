"use strict";
import fs = require("graceful-fs");
import path = require("path");

import {IProduct, REVISION, IShopEntry, IDateFolderInfo, IShopFolderInfo} from "./interfaces";


export function readDumpPath(dumpPath: string): Promise<IShopEntry[]> {
    "use strict";
    return getSubfolders(dumpPath)
        .then((dateStrings: string[]) => dateStrings.map((dateString) => getDateFolder(dateString, dumpPath)))
        .then((dateFolderInfos: IDateFolderInfo[]) => getShopEntries(dateFolderInfos));
}

function getSubfolders(path: string): Promise<string[]> {
    "use strict";
    return new Promise<string[]>((resolve, reject) => {
        fs.readdir(path, (err: NodeJS.ErrnoException, subDirs: string[]) => {
            if (err) {
                reject(err);
            } else {
                resolve(subDirs);
            }
        });
    });
}

function getDateFolder(dateString: string, dumpPath: string): IDateFolderInfo {
    "use strict";
    let parts: string[] = dateString.split("-");
    let date = new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))); // note: months are 0-based
    
    return {
        date: date,
        directoryPath: path.join(dumpPath, dateString)
    };
}

function getShopEntries(dateFolderInfos: IDateFolderInfo[]): Promise<IShopEntry[]> {
    "use strict";
    let promises: Promise<IShopEntry[]>[] = dateFolderInfos.map((dateFolderInfo: IDateFolderInfo) => {
        return getSubfolders(dateFolderInfo.directoryPath)
            .then((shopNames: string[]) => getShopDirectories(shopNames, dateFolderInfo))
            .then((shopFolders: IShopFolderInfo[]) => {
                return Promise.all(shopFolders.map((shopFolder: IShopFolderInfo) => fillShopEntry(dateFolderInfo, shopFolder)));
            });
    });

    return Promise.all(promises)
        .then((res) => res.reduce((prev, cur) => { return prev.concat(cur); }, []));
}

function getShopDirectories(shopNames, dateFolderInfo: IDateFolderInfo): Promise<IShopFolderInfo[]> {
    "use strict";
    return new Promise<IShopFolderInfo[]>((resolve, reject) => {
        Promise.all<IShopFolderInfo>(shopNames.map((shopName) => {
            return getSubfolders(path.join(dateFolderInfo.directoryPath, shopName))
                .then((fileNames: string[]): IShopFolderInfo => {
                    return {
                        productFilePaths: fileNames.map((fileName) => path.join(dateFolderInfo.directoryPath, shopName, fileName)),
                        shopName: shopName
                    };
                });
        })).then((res) => resolve(res));
    });
}

function fillShopEntry(dateFolderInfo: IDateFolderInfo, shopFolder: IShopFolderInfo): Promise<IShopEntry> {
    "use strict";
    return Promise.all(
        shopFolder.productFilePaths
            .map((productFilePath: string) => readProductFile(productFilePath, dateFolderInfo, shopFolder))
    )
        .then((products: IProduct[][]): IShopEntry => {

            let flattenedProducts = [].concat.apply([], products);
            return {
                dateFolder: dateFolderInfo,
                products: <IProduct[]>flattenedProducts,
                shopName: shopFolder.shopName
            };
        });
}

function readProductFile(productFilePath: string, dateFolderInfo: IDateFolderInfo, shopFolder: IShopFolderInfo): Promise<IProduct[]> {
    "use strict";
    // todo check for file
    return new Promise<IProduct[]>((resolve, reject) => {
        fs.readFile(
            productFilePath,
            "utf8",
            (errPrice: NodeJS.ErrnoException, priceString: string) => {
                if (errPrice) {
                    reject(errPrice);
                    return;
                }

                try {
                    let priceObject = JSON.parse(priceString);
                        
                    // handle non-exception-throwing cases:
                    // neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                    // but... JSON.parse(null) returns 'null', and typeof null === "object", 
                    // so we must check for that, too.
                    if (priceObject && typeof priceObject === "object" && priceObject !== null) {

                        let result = priceObject.map((priceObj: any): IProduct => {
                            return {
                                categoryName: priceObj.categoryName,
                                fetchedDate: dateFolderInfo.date, // we have fetchedDate, but this is irrelevant
                                ifaceRevision: REVISION,
                                marketName: shopFolder.shopName,
                                name: priceObj.name,
                                price: priceObj.price,
                                uniqueIdInShop: priceObj.uniqueIdInShop
                            };
                        });

                        resolve(result);
                    }
                } catch (e) {
                    reject(e);
                }
            });
    });


}


/*
function handleShopDir(subdir: string, shopName: string, date: Date): void {
    "use strict";
    // console.log("subdir " + subdir + " name " + shopName + " date " + date);
    
    // todo - check for directory 
    fs.readdir(subdir, (err: NodeJS.ErrnoException, priceFiles: string[]) => {
        priceFiles.forEach((priceFileName: string) => {
            // todo check for file
            fs.readFile(
                path.join(subdir, priceFileName),
                "utf8",
                (errPrice: NodeJS.ErrnoException, priceString: string) => {

                    try {
                        let priceObject = JSON.parse(priceString);
                        
                        // handle non-exception-throwing cases:
                        // neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
                        // but... JSON.parse(null) returns 'null', and typeof null === "object", 
                        // so we must check for that, too.
                        if (priceObject && typeof priceObject === "object" && priceObject !== null) {
                            handlePriceEntry(shopName, date, priceObject);
                        }
                    } catch (e) { 
                        // do nothing
                    }
                });
        });
    });
}*/
