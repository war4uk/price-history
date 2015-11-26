import mongoose = require("mongoose");

export interface IProduct {
    name: String;
    categoryName: String;
    marketName: String;
    marketId: String;
    price: Number;
    fetchedDate: Date;   
}

export interface IProductModel extends IProduct, mongoose.Document { }

let prioductSchema = new mongoose.Schema({
    name: String,
    categoryName: String,
    marketName: String,
    marketId: String,
    price: Number,
    fetchedDate: Date    
});


export let productModel = mongoose.model<IProductModel>("Product", prioductSchema);
