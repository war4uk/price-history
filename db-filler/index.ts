import {productModel} from "./models/product";

import mongoose = require("mongoose");

mongoose.connect("mongodb://localhost:27017/test");

let product = new productModel({name: 3});
product.marketName = "test market name";
product.save();
