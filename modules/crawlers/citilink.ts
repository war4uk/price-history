import  {ICrawlerInstance} from "../crawler.interface";

export default class CitilinkCrawler implements ICrawlerInstance {
    public name: string = "citilink";

    public start(output: string): void {
        console.log(this.name + " " + output);
    }
}
