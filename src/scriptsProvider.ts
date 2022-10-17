import * as vscode from 'vscode';
import * as path from 'path';
import { Script } from './Snapshot';

export class ScriptsProvider implements vscode.TreeDataProvider<ScriptItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<ScriptItem | undefined | void> = new vscode.EventEmitter<ScriptItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<ScriptItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private scripts: Script[] | undefined) {
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
		const toScript = (script:Script): ScriptItem => {
			return new ScriptItem(script.script, vscode.TreeItemCollapsibleState.None, {
				command: 'extension.openScript',
				title: '',
				arguments: [script]
			});
		};
		
		const ds = this.scripts!.map(script => toScript(script));
		
		return ds;
	}
}

export class ScriptItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'terminal.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'terminal.svg')
	};

	contextValue = 'script';
}
