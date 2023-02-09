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
	extension: string;
	nComments: number;

	public constructor(title: string, code: string, comment: string, scripts:Resource[], files:FSInstance[], dependencies: Resource[], extension: string, nComments:number) {
		this.title = title;
		this.code = code;
		this.comment = comment;
		this.scripts = scripts;
		this.files = files;
		this.dependencies=dependencies;
		this.extension = extension;
		this.nComments = nComments;
	}
}

export class Resource{
	moduleOrCommand: string;
	versionOrOutput: string;
	type: string;
	comment: string;

	public constructor(module: string, version:string, type: string, comment: string){
		this.moduleOrCommand=module;
		this.versionOrOutput=version;
		this.type=type;
		this.comment = comment;
	}
}

export class FSInstance{
	name: string;
	type: string;
	fileSnapshoted: boolean;
	snap: string;
	subInstances: FSInstance[];
	comment: string[];

	public constructor(name:string, type: string, fileSnapped: boolean, snap: string, subI: FSInstance[], comment: string[]){
		this.name = name;
		this.type = type;
		this.fileSnapshoted = fileSnapped;
		this.snap = snap;
		this.subInstances = subI;
		this.comment = comment;
	}
}

export class ResCommented{
	files: FSInstance[];
	scripts: Resource[];
	dependencies: Resource[];

	public constructor(fs: FSInstance[], ss: Resource[], ds: Resource[]){
		this.files = fs;
		this.scripts = ss;
		this.dependencies = ds;
	}
}