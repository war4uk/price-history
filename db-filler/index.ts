"use strict";
import {productModel, IProduct} from "./models/product";

import mongoose = require("mongoose");
import fs = require("graceful-fs"); // queue up file requests to prevent too many files open situation
import path = require("path");

let dumpPath = "../dump";

let itemsToSave = 0;
let itemsSaved = 0;

setInterval(() => console.log("items to save: " + itemsToSave + " items saved: " + itemsSaved), 2000);

mongoose.connect("mongodb://localhost:27017/test");

let readDumpDir = new Promise((resolve, reject) => {
    fs.readdir(dumpPath, (err: NodeJS.ErrnoException, dateNames: string[]) => {
        if (err) {
            reject(err);
        } else {
            resolve(dateNames);
        }
    });
});

readDumpDir.then(handleDateName).catch((error: any) => console.log(error));
// function handleLogFile()

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
}

function handlePriceEntry(shopName: string, date: Date, pricesArray: any): void {
    "use strict";
    let objects: IProduct[] = pricesArray.map((priceObj: any): IProduct => {
        return {
            marketId: priceObj.eventProductId,
            marketName: shopName,
            fetchedDate: date,
            name: priceObj.eventProductName,
            price: priceObj.eventProductPrice,
            categoryName: priceObj.eventCategoryName
        };
    });

    itemsToSave = itemsToSave + objects.length;

    productModel.create(objects, (err) => {
        itemsToSave = itemsToSave - objects.length;
        itemsSaved = itemsSaved + objects.length;
        // do nothing
    });
}

function handleDateName(dateNames: string[]): void {
    "use strict";
    dateNames.forEach((dateName: string) => {
        // todo - check for directory 
        let subDirPath = path.join(dumpPath, dateName);
        let parts: string[] = dateName.split("-");
        let date = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); // note: months are 0-based
        
        fs.readdir(subDirPath, (err: NodeJS.ErrnoException, shopNames: string[]) => {
            shopNames.forEach((shopName: string) => handleShopDir(path.join(subDirPath, shopName), shopName, date));
        });

    });
}

/*function fetchForDate(date: Date): void {
    
}*/
