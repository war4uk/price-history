export const REVISION = 2;
export interface IProduct {
    name: string;
    categoryName: string;
    marketName: string;
    uniqueIdInShop: string;
    price: number;
    fetchedDate: Date;
    rawData? : any;
    ifaceRevision: number;   
}