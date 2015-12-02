"use strict";
import {IProduct, IFetchResult} from "./crawler.interface";

export class FetchResultManager {
    public static deduplicateStringArrays(existingResult: string[], newResult: string[]): string[] {
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
    }
    
    public static deduplicateProducts(existingResult: IProduct[], newResult: IProduct[]): IProduct[] {
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
    }
    
}
