"use strict";
import {IProduct} from "./crawler.interface";

export let deduplicateStringArrays = (existingResult: string[], newResult: string[]): string[] => {
    let result: string[] = existingResult.slice(0);
    let hash = {};

    existingResult.forEach((value: string) => {
        hash[value] = true;
    });
        
    // do actual dedupe
    newResult.forEach((value) => {
        if (!hash[value]) {
            hash[value] = true;
            result.push(value);
        }
    });

    return result;
};

export let deduplicateProducts = (existingResult: IProduct[], newResult: IProduct[]): IProduct[] => {
    let result: IProduct[] = existingResult.slice(0);
    let hash: {};

    existingResult.forEach((value: IProduct) => {
        hash[value.uniqueIdInShop] = true;
    });
        
    // do actual dedupe
    newResult.forEach((value) => {
        if (!hash[value.uniqueIdInShop]) {
            hash[value.uniqueIdInShop] = true;
            result.push(value);
        }
    });

    return result;
};
