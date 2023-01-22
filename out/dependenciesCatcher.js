"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDepsInPackageJson = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const Snapshot_1 = require("./Snapshot");
function getDepsInPackageJson(workspaceRoot) {
    if (!workspaceRoot) {
        vscode.window.showInformationMessage('No dependency in empty workspace');
        return [];
    }
    const packageJsonPath = path.join(workspaceRoot, 'package.json');
    if (pathExists(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const toDep = (moduleName, version) => {
            return new Snapshot_1.Resource(moduleName, version, "dependency", "");
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
        vscode.window.showInformationMessage('Workspace has no package.json');
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
//# sourceMappingURL=dependenciesCatcher.js.map