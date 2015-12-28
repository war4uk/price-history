import mongoose = require("mongoose");
import {IProduct} from "./interfaces";

export interface IProductModel extends IProduct, mongoose.Document { }

let prioductSchema = new mongoose.Schema({
    name: String,
    categoryName: String,
    marketName: { type: [String], index: true },
    uniqueIdInShop: { type: [String], index: true },
    price: Number,
    fetchedDate: { type: [Date], index: true },
    ifaceRevision: Number
});


export let productModel = mongoose.model<IProductModel>("Product", prioductSchema);
