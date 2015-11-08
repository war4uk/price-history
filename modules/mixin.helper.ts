export function applyMixins(derivedCtor: any, baseCtors: any[]): void {
    "use strict";
    baseCtors.forEach((baseCtor: any) => {
        Object.getOwnPropertyNames(baseCtor.prototype).forEach((name: string) => {
            derivedCtor.prototype[name] = baseCtor.prototype[name];
        });
    });
}
