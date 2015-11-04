import request = require('request-promise');
import fs = require('fs');
import path = require('path');
import Q = require('q');
var Horseman = require('node-horseman');
var mkdirp = require('mkdirp');

import CrawlerIface from '../crawler.interface'

var urlsToFetch = ["http://www.ulmart.ru/catalog/cpu"];//["http://www.ulmart.ru/catalog/hardware"];
var visitedUrls = [];
var fetchingInterval;
var horseman;

export default class UlmartCrawler implements CrawlerIface {
	private showMoreSelector = '.js-show-more-parent';

	name: string = "ulmart"

	constructor() {

	}

	start(output: string) {
		let outpuPath = path.join(output, this.name);
		mkdirp(outpuPath);

		if (!!horseman) {
			horseman.close();
		}

		horseman = new Horseman({ loadImages: false });


		horseman
			.userAgent("Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0")

		let writeFile = (content: string, id: string) => {
			fs.writeFile(path.join(outpuPath, id.replace(/\//g, '_').replace(/:/g, '_')), content);
		}

		this.crawlAvailableUrl(writeFile);

		console.log(this.name + " " + output);
	}

	private crawlAvailableUrl(callback: (content: string, id: string) => void): void {
		var url = urlsToFetch.shift();

		if (!url || visitedUrls.indexOf(url) > -1) {
			horseman.close();
			return;
		}

		visitedUrls.push(url);

		this.parsePage(url, this.showMoreSelector, callback);
	}

	private parsePage(url, showMoreSelector, callback: (content: string, id: string) => void): Promise<number> {
		var result = Promise.defer<number>();
		horseman.open(url)
			.exists(showMoreSelector)
			.then((showMoreVisible: boolean) => {
				if (showMoreVisible) {
					return this.clickAllShowMoreElements(showMoreSelector);
				}
				return true;
			})
			.then(function() {
				return horseman.evaluate(new Function("return dataLayer;"));
			})
			.then(function(dataLayerObject) {
				var dupes = [];
				return dataLayerObject
					.filter(function(obj) {
						return obj.eventLabel === "product";
					}).reduce(function(prev, cur) {
						return prev.concat(cur.eventProducts);
					}, [])
					.filter(function(item) {
						//deduplicate
						
						if (dupes.indexOf(item.eventProductId) === -1) {
							dupes.push(item.eventProductId);
							return true;
						} else {
							return false;
						}
					});
			})
			.then(function(dataArray) {
				callback(JSON.stringify(dataArray), url);
				result.resolve();
			});

		return result.promise;
	}

	private clickAllShowMoreElements(showMoreSelector) {
		return horseman.evaluate(function() {
			return {
				currentlyShown: parseInt($('#total-show-count').html()),
				totalItems: parseInt($('#max-show-count').html())
			}
		}, showMoreSelector)
			.then((result) => {
				var pageSize = result.currentlyShown;
				var currShown = result.currentlyShown;
				var maxItems = result.totalItems;

				var resultPromise = horseman;

				for (var i = 0; i < Math.floor(maxItems / pageSize); i++) {
					currShown = currShown + pageSize;

					((currShown) => {
						resultPromise = resultPromise
							.click(showMoreSelector + " " + '.js-show-more')
							.waitFor(function() { return parseInt($('#total-show-count').html()); }, Math.min(currShown, maxItems))
							.then(function(vale) {
								console.log(currShown);
								return horseman.evaluate(function() {
									return parseInt($('#total-show-count').html());
								})
							})
							.then(function(val) {

							});
					})(currShown)

				}

				return resultPromise;
				/*return horseman
					.click(showMoreSelector + " " + '.js-show-more')
					.waitFor(function() { }, )
					.then(function(vale) {
						console.log(currShown);
						return horseman.evaluate(function() {
							return parseInt($('#total-show-count').html());
						})
					})
					.then(function(val) {

					});

				/*for (var i = 0; i < Math.floor(maxItems / pageSize); i++) {
					currShown = currShown + pageSize;

					((currShown) => {
						resultPromise = resultPromise
							.click(this.showMoreSelector + " " + '.js-show-more')
							.wait(1000)
							.then(function(vale) {
								console.log(currShown);
								return horseman.evaluate(function() {
									return parseInt($('#total-show-count').html());
								})
							})
							.then(function(val){
								
							});
					})(currShown)

				}*/
				// return resultPromise;
			});
	}
}