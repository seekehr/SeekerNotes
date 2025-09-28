export namespace config {
	
	export class Config {
	    userSelectedDirectory: string;
	    theme: string;
	
	    static createFrom(source: any = {}) {
	        return new Config(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.userSelectedDirectory = source["userSelectedDirectory"];
	        this.theme = source["theme"];
	    }
	}

}

export namespace files {
	
	export class FileData {
	    name: string;
	    content: string;
	    htmlContent: string;
	
	    static createFrom(source: any = {}) {
	        return new FileData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.content = source["content"];
	        this.htmlContent = source["htmlContent"];
	    }
	}

}

