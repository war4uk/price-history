"use strict";
import {/*productModel, */IProduct} from "./models/product";
import {readDumpPath} from "./models/dump.reader";

// import mongoose = require("mongoose");
import fs = require("graceful-fs"); // queue up file requests to prevent too many files open situation
import path = require("path");

let dumpPath = "../dump";

let itemsToSave = 0;
let itemsSaved = 0;

// mongoose.connect("mongodb://lostroom.cloudapp.net:27017/test");

readDumpPath(dumpPath);

/*
readDumpDir.then(handleDateName).catch((error: any) => console.log(error));
// function handleLogFile()



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

*/

/*function fetchForDate(date: Date): void {
    
}*/
