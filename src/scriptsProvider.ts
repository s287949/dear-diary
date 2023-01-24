import * as vscode from 'vscode';
import * as path from 'path';
import { Resource, ResCommented, Snapshot } from './Snapshot';

export class ScriptsProvider implements vscode.TreeDataProvider<ScriptItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ScriptItem | undefined | void> = new vscode.EventEmitter<ScriptItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ScriptItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private scripts: Resource[] | undefined, private r: ResCommented, public snap:Snapshot, public diary:string) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: ScriptItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: ScriptItem): Thenable<ScriptItem[]> {
		if (!this.scripts) {
			return Promise.resolve([]);
		}
		else if(!element) {
			return Promise.resolve(this.getScripts());
		}
		else {
			return Promise.resolve([]);
		}
	}

	/**
	 * Gets the dependencies in input and trasform them in ScriptItem in order to be dispalyed
	 */
	private getScripts(): ScriptItem[] {
		const toScript = (script:Resource): ScriptItem => {
			return new ScriptItem(script.moduleOrCommand, script, this.snap, this.diary, vscode.TreeItemCollapsibleState.None, {
				command: 'extension.openScript',
				title: '',
				arguments: [script]
			});
		};

		
		
		const ds = this.scripts? this.scripts.map(script => toScript(script)) : [];
		
		return ds;
	}
}

export class ScriptItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public script: Resource,
		public snap: Snapshot,
		public diary: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		if(script.comment!==""){
			this.description="commented";
		}
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'terminal.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'terminal.svg')
	};

	contextValue = 'script';
}
