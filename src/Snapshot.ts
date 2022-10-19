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
	scripts: Script[];
	files: FSInstance[];
	dependencies: Dependency[];

	public constructor(title: string, code: string, comment: string, scripts:Script[], files:FSInstance[], dependencies: Dependency[]) {
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
	snap: string;
	subInstances: FSInstance[];

	public constructor(name:string, type: string, fileSnapped: boolean, snap: string, subI: FSInstance[]){
		this.name = name;
		this.type = type;
		this.fileSnapshoted = fileSnapped;
		this.snap = snap;
		this.subInstances = subI;
	}
}

export class Script{
	script: string;
	output: string;

	public constructor(script: string, output:string){
		this.script=script;
		this.output=output;
	}
}