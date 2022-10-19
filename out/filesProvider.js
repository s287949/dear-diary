"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileItem = exports.FilesNodeProvider = void 0;
const vscode = require("vscode");
class FilesNodeProvider {
    constructor(files) {
        this.files = files;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.files) {
            return Promise.resolve([]);
        }
        else if (!element) {
            return Promise.resolve(this.getFiles(this.files));
        }
        else {
            return Promise.resolve(this.getFiles(element.subfiles));
        }
    }
    /**
     * Gets the dependencies in input and trasform them in FileItem in order to be dispalyed
     */
    getFiles(f) {
        const toFile = (file) => {
            if (file.type === "dir" && file.snap) {
                return new FileItem({ label: file.name, highlights: file.fileSnapshoted === true ? [[0, file.name.length]] : void 0 }, file.subInstances, file.type === "dir" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None, {
                    command: 'extension.openFile',
                    title: '',
                    arguments: [file]
                });
            }
            return new FileItem({ label: file.name, highlights: file.fileSnapshoted === true ? [[0, file.name.length]] : void 0 }, file.subInstances, file.type === "dir" ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
        };
        const fs = f ? f.map(file => toFile(file)) : [];
        return fs;
    }
}
exports.FilesNodeProvider = FilesNodeProvider;
class FileItem extends vscode.TreeItem {
    constructor(label, subfiles, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.subfiles = subfiles;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.contextValue = 'file';
    }
}
exports.FileItem = FileItem;
//# sourceMappingURL=filesProvider.js.map