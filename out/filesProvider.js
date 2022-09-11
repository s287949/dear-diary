"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileItem = exports.FilesNodeProvider = void 0;
const vscode = require("vscode");
const path = require("path");
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
            return Promise.resolve(this.getFiles());
        }
        else {
            return Promise.resolve([]);
        }
    }
    /**
     * Gets the dependencies in input and trasform them in FileItem in order to be dispalyed
     */
    getFiles() {
        const toFile = (file) => {
            return new FileItem(file, vscode.TreeItemCollapsibleState.None);
        };
        const ds = this.files.map(file => toFile(file));
        return ds;
    }
}
exports.FilesNodeProvider = FilesNodeProvider;
class FileItem extends vscode.TreeItem {
    constructor(label, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'file.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file.svg')
        };
        this.contextValue = 'file';
    }
}
exports.FileItem = FileItem;
//# sourceMappingURL=filesProvider.js.map