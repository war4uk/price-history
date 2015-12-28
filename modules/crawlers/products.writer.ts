"use strict";
import fs = require("graceful-fs"); // queue up file requests to prevent too many files open situation
import path = require("path");
import mkdirp = require("mkdirp");

export let writeFile = (outputPath: string, fileName: string, content: string): void => {
    fs.writeFile(path.join(outputPath, fileName), content);
};

export let ensureOutput = (outputPath: string): Promise<any> => {
    let defer = Promise.defer<any>();

    mkdirp(outputPath, (err) => {
        if (err) {
            defer.reject(err);
        } else {
            defer.resolve();
        }
    });

    return defer.promise;
};
