import * as vscode from 'vscode';
import * as path from 'path';
import { FSInstance } from './Snapshot';

export class FilesNodeProvider implements vscode.TreeDataProvider<FileItem> {

	private _onDidChangeTreeData: vscode.EventEmitter<FileItem | undefined | void> = new vscode.EventEmitter<FileItem | undefined | void>();
	readonly onDidChangeTreeData: vscode.Event<FileItem | undefined | void> = this._onDidChangeTreeData.event;

	constructor(private files: FSInstance[] | undefined) {
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
			return Promise.resolve(this.getFiles(this.files));
		}
		else {
			return Promise.resolve(this.getFiles(element.subfiles));
		}
	}

	/**
	 * Gets the dependencies in input and trasform them in FileItem in order to be dispalyed
	 */
	private getFiles(f: FSInstance[]): FileItem[] {
		const toFile = (file: FSInstance): FileItem => {
			return new FileItem(<any>{ label: file.name, highlights: file.fileSnapshoted === true ? [[0, file.name.length]] : void 0 }, file.subInstances, file.type==="dir"? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
		};
		
		const fs = f? f.map(file => toFile(file)) : [];
		
		return fs;
	}
}

export class FileItem extends vscode.TreeItem {

	constructor(
		public readonly label: vscode.TreeItemLabel,
		public readonly subfiles: FSInstance[],
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		//public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
	}

	contextValue = 'file';
}
