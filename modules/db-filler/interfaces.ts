import {IProduct} from "../../interfaces/IProduct";

export {IProduct, REVISION} from "../../interfaces/IProduct";
export interface IDateFolderInfo {
    date: Date;
    directoryPath: string;
}

export interface IShopFolderInfo {
    shopName: string;
    productFilePaths: string[];
}

export interface IShopEntry {
    dateFolder: IDateFolderInfo;
    shopName: string;
    products: IProduct[];
}