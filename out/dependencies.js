"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepsInPackageJson = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const Snapshot_1 = require("./Snapshot");
if (element) {
    return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
}
else {
    const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
    }
    else {
        vscode.window.showInformationMessage('Workspace has no package.json');
        return Promise.resolve([]);
    }
}
function getDepsInPackageJson(workspaceRoot, packageJsonPath) {
    if (!workspaceRoot) {
        vscode.window.showInformationMessage('No dependency in empty workspace');
        return [];
    }
    if (pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const toDep = (moduleName, version) => {
            if (pathExists(path.join(workspaceRoot, 'node_modules', moduleName))) {
                return new Snapshot_1.Dependency(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
            }
            else {
                return new Snapshot_1.Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None, {
                    command: 'extension.openPackageOnNpm',
                    title: '',
                    arguments: [moduleName]
                });
            }
        };
        const deps = packageJson.dependencies
            ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
            : [];
        const devDeps = packageJson.devDependencies
            ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
            : [];
        return deps.concat(devDeps);
    }
    else {
        return [];
    }
}
exports.getDepsInPackageJson = getDepsInPackageJson;
function pathExists(p) {
    try {
        fs.accessSync(p);
    }
    catch (err) {
        return false;
    }
    return true;
}
//# sourceMappingURL=dependencies.js.map