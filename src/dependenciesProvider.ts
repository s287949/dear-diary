import * as vscode from 'vscode';
import * as path from 'path';
import { Resource } from './Snapshot';

export class DepNodeProvider implements vscode.TreeDataProvider<DependencyItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<DependencyItem | undefined | void> = new vscode.EventEmitter<DependencyItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<DependencyItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private deps: Resource[] | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: DependencyItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: DependencyItem): Thenable<DependencyItem[]> {
		if (!this.deps) {
			return Promise.resolve([]);
		}
		else if(!element) {
			return Promise.resolve(this.getDeps());
		}
		else {
			return Promise.resolve([]);
		}
	}

	/**
	 * Gets the dependencies in input and trasform them in DependencyItem in order to be dispalyed
	 */
	private getDeps(): DependencyItem[] {
		const toDep = (module:string, version:string): DependencyItem => {
			return new DependencyItem(module, version, vscode.TreeItemCollapsibleState.None);
		};

		const ds = this.deps? this.deps.map(dep => toDep(dep.moduleOrCommand, dep.versionOrOutput)) : [];
		
		return ds;
	}
}

export class DependencyItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		//public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);

		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
	};

	contextValue = 'dependency';
}
