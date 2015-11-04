import './modules/express_config.js';

import fs = require('fs');
import path = require('path');

import CrawlerIface from './modules/crawler.interface'



var crawlers:CrawlerIface[] = [];
var crawlersPath = path.join(__dirname, 'modules', 'crawlers');
var dateNow = new Date();


fs.readdirSync(crawlersPath).forEach(function(filePath) {
	if (!endsWith(filePath, '.js')) {
		return;
	}
	let crawler = require(path.join(crawlersPath, filePath)).default;
	crawlers.push(<CrawlerIface> (new crawler()));
});

crawlers.forEach(function(crawler) {
	crawler.start(path.join(__dirname, 'dump', dateNow.getUTCFullYear().toString() + '-' + dateNow.getUTCMonth().toString() + '-' + dateNow.getUTCDay().toString()));
})

function endsWith (input:string, search: string): boolean {
	return input.lastIndexOf(search) === (input.length - search.length)
}