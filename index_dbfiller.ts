"use strict";
import {productModel} from "./modules/db-filler/product.dbmodel";
import {readDumpPath} from "./modules/db-filler/dump.reader";
import {IProduct, IShopEntry} from "./modules/db-filler/interfaces";

import mongoose = require("mongoose");
import fs = require("graceful-fs"); // queue up file requests to prevent too many files open situation

import configuration from "./modules/configuration";


let creds = JSON.parse(fs.readFileSync("./creds.config.json", "utf8")).filler;
mongoose.connect("mongodb://lostroom.cloudapp.net:27017/pricehistory", { user: creds.user, pass: creds.pass });
// todo - db is connected promise

readDumpPath(configuration.dumpPath).then((shopEntries: IShopEntry[]) => {
    shopEntries.forEach((shopEntry: IShopEntry) => saveShopEntry(shopEntry));
});

function saveShopEntry(shopEntry: IShopEntry) {
    productModel.find({fetchedDate: shopEntry.dateFolder.date, marketName: shopEntry.shopName}, (err, existingProducts: IProduct[]) => {
        if (err) {
            console.log(err);
            return;
        }
        existingProducts = existingProducts || [];
        console.log(shopEntry.shopName + " " + shopEntry.dateFolder.date.toISOString() + " found " + existingProducts.length + " in db");

        saveToDb(shopEntry).then(() => {
            let ids = existingProducts.map((product: any) => product._id);
            console.log(ids.length);
            productModel.remove({_id: {$in: ids}}, (err) => {
                console.log(err);                
            });
           /* existingProducts.remove(existingProducts, (err) => {

            });*/
        });
    });
}


function saveToDb(shopEntry: IShopEntry): Promise<boolean> {
    console.log("products before dedupe: " + shopEntry.products.length);
    let products = dedupeProducts(shopEntry.products); // todo generic method
    console.log("products after dedupe: " + products.length);    
    return new Promise<boolean>((resolve, reject) => {
        productModel.create(products, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    })
}

function dedupeProducts(products: IProduct[]): IProduct[] {
    let dedupedProducts: IProduct[] = [];
    let hash = {};

    products.forEach((value: IProduct) => {
        if (!hash[value.uniqueIdInShop.toString()]) {
            hash[value.uniqueIdInShop.toString()] = true;
            dedupedProducts.push(value);
        }
    });

    return dedupedProducts;
} 
