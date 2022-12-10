import * as vscode from 'vscode';
import * as path from 'path';
import { Diary, Snapshot } from './Snapshot';


export class SnapshotsProvider implements vscode.TreeDataProvider<DiaryItem | SnapshotItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<DiaryItem | SnapshotItem | undefined | void> = new vscode.EventEmitter<DiaryItem | SnapshotItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<DiaryItem | SnapshotItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext) { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: DiaryItem | SnapshotItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: DiaryItem | SnapshotItem): Thenable<DiaryItem[] | SnapshotItem[]> {
		if (element instanceof DiaryItem) {
			return Promise.resolve(
				this.getPhases(element.phases, element.title)
			);
		} 
		else if(element instanceof SnapshotItem) {
			return Promise.resolve([]);
		}
		else {
			return Promise.resolve(
				this.getSnapshots(this.context.globalState.get("snaps"))
			);
		}
	}
	
	private getSnapshots(snaps: Diary[] | undefined): DiaryItem[] {
		if(!snaps){
			return [];
		}
		
		const toSnap = (snap: Diary): DiaryItem => {
			return new DiaryItem(snap, snap.title, snap.snapshots, snap.type, vscode.TreeItemCollapsibleState.Collapsed);
		};

		const snapshots = snaps
				? snaps.map(snap => toSnap(snap))
				: [];

		return snapshots;
	}

	private getPhases(phases: Snapshot[] | undefined, snap: string): SnapshotItem[] {
		if(!phases){
			return [];
		}
		
		const toPhase = (phase: Snapshot, index:number): SnapshotItem => {
			return new SnapshotItem(phase.title, phase.code, phase.comment, index, vscode.TreeItemCollapsibleState.None, {
				command: 'extension.openSnapshot',
				title: '',
				arguments: [phase, snap]
			});
		};

		const ps = phases
				? phases.map((phase, index) => toPhase(phase, index))
				: [];

		return ps;
	}
}

export class DiaryItem extends vscode.TreeItem {
	constructor(
		public ref: Diary,
		public readonly title: string,
		public phases : Snapshot[],
		public type: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(title, collapsibleState);
		this.contextValue="snapshot";
	}

	iconPath = checkType(this.type);
}

function checkType(type: string) {
	if(type==="code"){
		return {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'code.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'code.svg')
		};
	}
	else if(type==="file"){
		return {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'file-code.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file-code.svg')
		};
	}
	else if(type==="project"){
		return {
			light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
			dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
		};
	}
}

class SnapshotItem extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		private code: string,
		private comment: string,
		private phaseno: number,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(title, collapsibleState);
		this.contextValue="phase";
		this.description=(phaseno+1).toString();
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'layers.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'layers.svg')
	};
}
