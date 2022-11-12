import * as vscode from 'vscode';
import * as path from 'path';
import { Diary, Snapshot } from './Snapshot';


export class SnapshotsProvider implements vscode.TreeDataProvider<SnapshotItem | PhaseItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<SnapshotItem | PhaseItem | undefined | void> = new vscode.EventEmitter<SnapshotItem | PhaseItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<SnapshotItem | PhaseItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private context: vscode.ExtensionContext) { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: SnapshotItem | PhaseItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: SnapshotItem | PhaseItem): Thenable<SnapshotItem[] | PhaseItem[]> {
		if (element instanceof SnapshotItem) {
			return Promise.resolve(
				this.getPhases(element.phases, element.title)
			);
		} 
		else if(element instanceof PhaseItem) {
			return Promise.resolve([]);
		}
		else {
			return Promise.resolve(
				this.getSnapshots(this.context.globalState.get("snaps"))
			);
		}
	}
	
	private getSnapshots(snaps: Diary[] | undefined): SnapshotItem[] {
		if(!snaps){
			return [];
		}
		
		const toSnap = (snap: Diary): SnapshotItem => {
			return new SnapshotItem(snap, snap.title, snap.snapshots, snap.type,vscode.TreeItemCollapsibleState.Collapsed);
		};

		const snapshots = snaps
				? snaps.map(snap => toSnap(snap))
				: [];

		return snapshots;
	}

	private getPhases(phases: Snapshot[] | undefined, snap: string): PhaseItem[] {
		if(!phases){
			return [];
		}
		
		const toPhase = (phase: Snapshot, index:number): PhaseItem => {
			return new PhaseItem(phase.title, phase.code, phase.comment, index, vscode.TreeItemCollapsibleState.None, {
				command: 'extension.openPhase',
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

export class SnapshotItem extends vscode.TreeItem {
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

class PhaseItem extends vscode.TreeItem {
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
