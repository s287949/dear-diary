import * as vscode from 'vscode';
import * as path from 'path';
import { Snapshot, Phase } from './Snapshot';


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
				this.getPhases(element.phases)
			);
		} else {
			return Promise.resolve(
				this.getSnapshots(this.context.globalState.get("snaps"))
			);
		}
	}
	
	private getSnapshots(snaps: Snapshot[] | undefined): SnapshotItem[] {
		if(!snaps){
			return [];
		}
		
		const toSnap = (snap: Snapshot): SnapshotItem => {
			return new SnapshotItem(snap.title, snap.phases, snap.type,vscode.TreeItemCollapsibleState.Collapsed);
		};

		const snapshots = snaps
				? snaps.map(snap => toSnap(snap))
				: [];

		return snapshots;
	}

	private getPhases(phases: Phase[] | undefined): PhaseItem[] {
		if(!phases){
			return [];
		}
		
		const toPhase = (phase: Phase, index:number): PhaseItem => {
			return new PhaseItem(phase.title, phase.code, phase.comment, index, vscode.TreeItemCollapsibleState.None, {
				command: 'extension.openPhase',
				title: '',
				arguments: [phase]
			});
		};

		const ps = phases
				? phases.map((phase, index) => toPhase(phase, index))
				: [];

		return ps;
	}
}

class SnapshotItem extends vscode.TreeItem {
	constructor(
		public readonly title: string,
		public phases : Phase[],
		private type: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(title, collapsibleState);
		this.contextValue="snapshot";
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'code.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'code.svg')
	};
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
