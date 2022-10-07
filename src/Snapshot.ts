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
	scripts: string[];
	files: FSInstance[];
	dependencies: Dependency[];

	public constructor(title: string, code: string, comment: string, scripts:string[], files:FSInstance[], dependencies: Dependency[]) {
		this.title = title;
		this.code = code;
		this.comment = comment;
		this.scripts = scripts;
		this.files = files;
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

export class FSInstance{
	name: string;
	type: string;
	fileSnapshoted: boolean;
	subInstances: FSInstance[];

	public constructor(name:string, type: string, fileSnapped: boolean, subI: FSInstance[]){
		this.name = name;
		this.type = type;
		this.fileSnapshoted = fileSnapped;
		this.subInstances = subI;
	}
}