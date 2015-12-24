import winston = require("winston");
import extend = require("extend");
import mkdirp = require("mkdirp");
import path = require("path");

import configuration from "./configuration";

mkdirp(configuration.logPath, (cb) => {
    // do nothing, pray it will be created atomically :)
});

let formattinOptions = {
    formatter: function(options: any): string {
        // return string will be passed to logger.
        return options.timestamp() + " " + options.level.toUpperCase() + " "
            + (undefined !== options.message ? options.message : "") +
            (options.meta && Object.keys(options.meta).length ? "\n\t" + JSON.stringify(options.meta) : "");
    },
    timestamp: function(): string {
        return (new Date()).toUTCString();
    }
};


export default new (winston.Logger)({
    transports: [
        new (winston.transports.Console)(formattinOptions),
        new (winston.transports.File)(extend({}, formattinOptions, {
            filename: path.join(configuration.logPath, "log.log"),
            maxsize: 10 * 1024 * 1024,
            tailable: true
        }))
    ]
});
