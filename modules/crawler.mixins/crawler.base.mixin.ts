import fs = require("fs");
import path = require("path");
import mkdirp = require("mkdirp");

export class BaseCrawlerMixin {
    public writeFile(outputPath: string, content: string, id: string): void {
        fs.writeFile(path.join(outputPath, id.replace(/\//g, "_").replace(/:/g, "_")), content);
    }

    public ensureOutput(outputPath: string): Promise<any> {
        let defer = Promise.defer<any>();

        mkdirp(outputPath, () => {
            defer.resolve();
        });

        return defer.promise;
    };
}
