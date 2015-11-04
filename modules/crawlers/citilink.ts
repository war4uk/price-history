import CrawlerIface from '../crawler.interface'

export default class CitilinkCrawler implements CrawlerIface {
	name:string = "citilink"
	
	constructor() {}
	
	start(output: string) {
		console.log(this.name + " " + output);
	}
}