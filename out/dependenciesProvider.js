"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyItem = exports.DepNodeProvider = void 0;
const vscode = require("vscode");
const path = require("path");
class DepNodeProvider {
    constructor(deps, r) {
        this.deps = deps;
        this.r = r;
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
        if (!this.deps) {
            return Promise.resolve([]);
        }
        else if (!element) {
            return Promise.resolve(this.getDeps());
        }
        else {
            return Promise.resolve([]);
        }
    }
    /**
     * Gets the dependencies in input and trasform them in DependencyItem in order to be dispalyed
     */
    getDeps() {
        const toDep = (dep, module, version) => {
            return new DependencyItem(module, version, dep, vscode.TreeItemCollapsibleState.None);
        };
        const ds = this.deps ? this.deps.map(dep => toDep(dep, dep.moduleOrCommand, dep.versionOrOutput)) : [];
        return ds;
    }
}
exports.DepNodeProvider = DepNodeProvider;
class DependencyItem extends vscode.TreeItem {
    constructor(label, version, dep, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.dep = dep;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
        };
        this.contextValue = 'dependency';
        this.tooltip = `${this.label}-${this.version}`;
        if (dep.comment !== "") {
            this.description = this.version + " - commented";
        }
        else {
            this.description = this.version;
        }
    }
}
exports.DependencyItem = DependencyItem;
//# sourceMappingURL=dependenciesProvider.js.map