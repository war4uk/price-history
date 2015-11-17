"use strict";
import path = require("path");
import fs = require("fs");
import mkdirp = require("mkdirp");

import {ICrawlerLogger} from "./crawler.interface";

export class Logger implements ICrawlerLogger {

    private logPath: string;
    private pathCreatedPromise: Promise<any>;
    private name: string;

    constructor(output: string, name: string) {
        let defer = Promise.defer();
        this.pathCreatedPromise = defer.promise;

        this.name = name;
        let dirPath: string = path.join(output, name);
        this.logPath = path.join(dirPath, "log-" + (new Date()).getTime().toString(10));
        mkdirp(dirPath, () => { defer.resolve(); });
    }

    public log = (message: string) => {
        console.log(this.name + ": " +  message);
        this.pathCreatedPromise
            .then(() => fs.appendFile(this.logPath, message, function(err: any): void {
                if (err) {
                    throw err;
                }
            }));
    };
}
