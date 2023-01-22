import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Resource } from './Snapshot';


export function getDepsInPackageJson(workspaceRoot: string | undefined): Resource[] {
	if (!workspaceRoot) {
        vscode.window.showInformationMessage('No dependency in empty workspace');
        return [];
    }

	const packageJsonPath = path.join(workspaceRoot, 'package.json');
    
    if (pathExists(packageJsonPath)) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

		const toDep = (moduleName: string, version: string): Resource => {
			return new Resource(moduleName, version, "dependency", "");
		};

		const deps = packageJson.dependencies
			? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
			: [];
		const devDeps = packageJson.devDependencies
			? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
			: [];
		return deps.concat(devDeps);
	} else {
		vscode.window.showInformationMessage('Workspace has no package.json');
		return [];
	}
}

function pathExists(p: string): boolean {
	try {
		fs.accessSync(p);
	} catch (err) {
		return false;
	}

	return true;
}