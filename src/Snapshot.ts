export class Snapshot {
	title: string;
	phases: Array<Phase>;
	type: string;

	public constructor(title: string, phases: Array<Phase>, type:string) {
		this.title = title;
		this.phases = phases;
		this.type=type;
	}
}

export class Phase {
	title: string;
	code: string;
	comment: string;
	files: string[];
	dependencies: Dependency[];

	public constructor(title: string, code: string, comment: string, files:string[], dependencies: Dependency[]) {
		this.title = title;
		this.code = code;
		this.comment=comment;
		this.files=files;
		this.dependencies=dependencies;
	}
}

export class Dependency{
	module: string;
	version: string;

	public constructor(module: string, version:string){
		this.module=module;
		this.version=version;
	}
}