export class Diary {
	title: string;
	snapshots: Array<Snapshot>;
	type: string;

	public constructor(title: string, phases: Array<Snapshot>, type:string) {
		this.title = title;
		this.snapshots = phases;
		this.type=type;
	}
}

export class Snapshot {
	title: string;
	code: string;
	comment: string;
	scripts: Resource[];
	files: FSInstance[];
	dependencies: Resource[];

	public constructor(title: string, code: string, comment: string, scripts:Resource[], files:FSInstance[], dependencies: Resource[]) {
		this.title = title;
		this.code = code;
		this.comment = comment;
		this.scripts = scripts;
		this.files = files;
		this.dependencies=dependencies;
	}
}

export class Resource{
	moduleOrCommand: string;
	versionOrOutput: string;
	type: string;

	public constructor(module: string, version:string, type: string){
		this.moduleOrCommand=module;
		this.versionOrOutput=version;
		this.type=type;
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