import * as vscode from 'vscode';
import * as path from 'path';
import { Dependency } from './Snapshot';

export class FilesNodeProvider implements vscode.TreeDataProvider<FileItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private files: string[] | undefined) {
	}

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: FileItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: FileItem): Thenable<FileItem[]> {
		if (!this.files) {
			return Promise.resolve([]);
		}
		else if(!element) {
			return Promise.resolve(this.getFiles());
		}
		else {
			return Promise.resolve([]);
		}
	}

	/**
	 * Gets the dependencies in input and trasform them in FileItem in order to be dispalyed
	 */
	private getFiles(): FileItem[] {
		const toFile = (file:string): FileItem => {
			return new FileItem(file, vscode.TreeItemCollapsibleState.None);
		};
		
		const ds = this.files!.map(file => toFile(file));
		
		return ds;
	}
}

export class FileItem extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		//public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	iconPath = {
		light: path.join(__filename, '..', '..', 'resources', 'light', 'file.svg'),
		dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file.svg')
	};

	contextValue = 'file';
}
