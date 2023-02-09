"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const multiStepInputNewSnapshot_1 = require("./multiStepInputNewSnapshot");
const multiStepInputNewPhase_1 = require("./multiStepInputNewPhase");
const dependenciesProvider_1 = require("./dependenciesProvider");
const snapshotsProvider_1 = require("./snapshotsProvider");
const filesProvider_1 = require("./filesProvider");
const scriptsProvider_1 = require("./scriptsProvider");
const Snapshot_1 = require("./Snapshot");
const dependenciesCatcher_1 = require("./dependenciesCatcher");
const fs = require("fs");
const path = require("path");
const cp = require("child_process");
const diarySnapshotsProvider_1 = require("./diarySnapshotsProvider");
let terminalData = {};
let ft = true;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let snaps = context.globalState.get("snaps");
    let resCommented = new Snapshot_1.ResCommented([], [], []);
    let diary = context.globalState.get("diary") ? context.globalState.get("diary") : new Snapshot_1.Diary("Diary", [], "project");
    //New code snapshot command impelementation
    const snapProvider = new NewSnapshotsViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, snapProvider));
    //create only one single diary with all the project snapshots
    if (diary === undefined) {
        context.globalState.update("diary", new Snapshot_1.Diary("Diary", [], "project"));
        ft = true;
        snapProvider.change(ft);
    }
    else if (diary.snapshots.length > 0) {
        ft = false;
        snapProvider.change(ft);
    }
    else {
        ft = true;
        snapProvider.change(ft);
    }
    //Show dependencies in the Dependencies view
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    var tc = false; // variable for temporary commit in case the user checks out to a project snapshot
    const commentProvider = new CommentViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CommentViewProvider.viewType, commentProvider));
    //Providing Snapshots to the related view
    const snapshotsProvider = new snapshotsProvider_1.SnapshotsProvider(context);
    //vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
    const diarySnapshotsProvider = new diarySnapshotsProvider_1.DiarySnapshotsProvider(context);
    vscode.window.registerTreeDataProvider('snapshots', diarySnapshotsProvider);
    vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => diarySnapshotsProvider.refresh());
    var nodeDependenciesProvider;
    vscode.commands.registerCommand('dear-diary.refreshDependencies', () => nodeDependenciesProvider.refresh());
    var nodeScriptsProvider;
    vscode.commands.registerCommand('dear-diary.refreshScripts', () => nodeScriptsProvider.refresh());
    var nodeFilesProvider;
    vscode.commands.registerCommand('dear-diary.refreshFiles', () => nodeFilesProvider.refresh());
    //Open file showing code/file snapshotted
    vscode.commands.registerCommand('extension.openSnapshot', async (snap, diary) => {
        nodeDependenciesProvider = new dependenciesProvider_1.DepNodeProvider(snap.dependencies, resCommented, snap, diary.title);
        vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
        nodeScriptsProvider = new scriptsProvider_1.ScriptsProvider(snap.scripts, resCommented, snap, diary.title);
        vscode.window.registerTreeDataProvider('command-line-scripts', nodeScriptsProvider);
        nodeFilesProvider = new filesProvider_1.FilesNodeProvider(snap.files, resCommented, snap, diary.title);
        vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
        if (diary.type !== "project") {
            var setting = vscode.Uri.parse(snap.title ? "untitled:" + "C:\\" + diary.title + "\\" + snap.title + snap.extension : "untitled:" + "C:\\" + diary.title + "\\" + "code snapshot" + snap.extension);
            vscode.workspace.onDidOpenTextDocument((a) => {
                let fn = snap.title ? "C:\\" + diary.title + "\\" + snap.title + snap.extension : "C:\\" + diary.title + "\\" + "code snapshot" + snap.extension;
                if (a.fileName === fn) {
                    vscode.window.showTextDocument(a, 1, false).then(e => {
                        e.edit(edit => {
                            edit.insert(new vscode.Position(0, 0), snap.code);
                        });
                    });
                }
            });
            vscode.workspace.openTextDocument(setting).then((a) => {
            }, (error) => {
                console.error(error);
                debugger;
            });
        }
        else {
            let command = "";
            let output;
            command = "cd " + rootPath + " && git add .";
            output = await execShell(command);
            //vscode.window.showInformationMessage(output);
            if (!tc) {
                command = "cd " + rootPath + " && git commit -m \"temporary commit\"";
                output = await execShell(command);
                //vscode.window.showInformationMessage(output);
                tc = true;
            }
            command = "cd " + rootPath + " && git checkout " + snap.code;
            output = await execShell(command);
            //vscode.window.showInformationMessage(output);
            if (output === "error") {
                vscode.window.showErrorMessage("Error: Could not open snapshot");
            }
        }
        commentProvider.setComment(snap, diary.title, resCommented);
    });
    //Open file showing the command line script and the output
    vscode.commands.registerCommand('extension.openScript', script => {
        var setting = vscode.Uri.parse("untitled:" + "C:\\" + script.moduleOrCommand + ".txt");
        vscode.workspace.onDidOpenTextDocument((a) => {
            if (a.fileName === "C:\\" + script.moduleOrCommand + ".txt") {
                vscode.window.showTextDocument(a, 1, false).then(e => {
                    e.edit(edit => {
                        edit.insert(new vscode.Position(0, 0), script.versionOrOutput);
                    });
                });
            }
        });
        vscode.workspace.openTextDocument(setting).then((a) => {
        }, (error) => {
            console.error(error);
            debugger;
        });
    });
    //Save changes to a comment
    vscode.commands.registerCommand('extension.saveChanges', (type) => {
        //context.globalState.update("snaps", snaps);
        context.globalState.update("diary", diary);
        vscode.commands.executeCommand("dear-diary.refreshSnapshots");
        if (type === "dependency") {
            vscode.commands.executeCommand("dear-diary.refreshDependencies");
        }
        else if (type === "script") {
            vscode.commands.executeCommand("dear-diary.refreshScripts");
        }
        else if (type === "file") {
            vscode.commands.executeCommand("dear-diary.refreshFiles");
        }
    });
    //Close the project snapshot previously opened and go back to the version of the code in act before selecting it
    vscode.commands.registerCommand('dear-diary.closeProjectSnapshot', async () => {
        if (!tc) {
            vscode.window.showErrorMessage("Error: No snapshot to close");
            return;
        }
        let command = "";
        let output;
        command = "cd " + rootPath + " && git checkout master";
        output = await execShell(command);
        //vscode.window.showInformationMessage(output);
        /*if (output === "error") {
            vscode.window.showErrorMessage("Error: Could not close snapshot and go back");
        }
        else {
            tc = false;
        }*/
        tc = false;
    });
    //Comment webview implementation
    vscode.commands.registerCommand('dear-diary.comment', async (node) => {
        await vscode.commands.executeCommand('comment.focus');
        if (node instanceof dependenciesProvider_1.DependencyItem) {
            commentProvider.setDepComment(node.dep, node.snap, node.diary);
        }
        else if (node instanceof scriptsProvider_1.ScriptItem) {
            commentProvider.setScriptComment(node.script, node.snap, node.diary);
        }
        else if (node instanceof filesProvider_1.FileItem) {
            commentProvider.setFileComment(node.file, node.snap, node.diary);
        }
        else {
            commentProvider.setComment(node.snap, node.diaryTitle, resCommented);
        }
    });
    vscode.commands.registerCommand('dear-diary.delete-everything', async () => {
        diary.snapshots.length = 0;
        context.globalState.update("diary", diary);
        ft = true;
        snapProvider.change(ft);
        vscode.commands.executeCommand("dear-diary.refreshSnapshots");
    });
    //create a new project snapshot using git
    vscode.commands.registerCommand('dear-diary.new-terminal', async (type, snapNo, ns) => {
        let command = "";
        const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
            ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
        let output;
        if (type === 0) {
            command = "cd " + rootPath + " && rmdir .git /s /q";
            output = await execShell(command);
            if (output === "error") {
                ns.code = "";
                return;
            }
            command = "cd " + rootPath + " && git init";
            output = await execShell(command);
            if (output === "error") {
                ns.code = "";
                return;
            }
        }
        else if (type === 1) {
            command = "cd " + rootPath + " && git init";
            output = await execShell(command);
            if (output === "error") {
                ns.code = "";
                return;
            }
        }
        command = "cd " + rootPath + " && git add .";
        output = await execShell(command);
        command = "cd " + rootPath + " && git commit -m \"" + snapNo + "\"";
        output = await execShell(command);
        //vscode.window.showInformationMessage(output);
        if (output !== "error") {
            ns.code = output.match(/.{7}\]/)?.toString().match(/.{7}/)?.toString();
        }
    });
    //create a new code/file/project diary and the relative first snapshot
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async (type) => {
        await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
                vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
                    vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
                        const qis = await (0, multiStepInputNewSnapshot_1.newCodeSnapshot)(context);
                        let fileTree = [];
                        let packagePath = [];
                        const editor = vscode.window.activeTextEditor;
                        let code;
                        if (editor) {
                            const document = editor.document;
                            if (type === 1) {
                                const selection = editor.selection;
                                code = document.getText(selection);
                            }
                            else if (type === 2) {
                                code = document.getText();
                            }
                            else if (type !== 3) {
                                vscode.window.showErrorMessage("Error: Snapshot type not valid");
                                return;
                            }
                            let fileName = document.fileName;
                            let fileext = fileName.match(/\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi)[0];
                            let ext = fileext ? fileext : "txt";
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName, type, packagePath);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code && type !== 3) {
                                vscode.window.showErrorMessage("Error: No code selected for the snapshot");
                            }
                            else {
                                //context.globalState.update("snaps", []);
                                snaps = context.globalState.get("snaps");
                                if (!snaps) {
                                    context.globalState.update("snaps", []);
                                    snaps = [];
                                }
                                //get dependencies
                                let deps = [];
                                if (packagePath.length > 0) {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(packagePath[0].replace(/\\package\.json/, ''));
                                }
                                else {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                }
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.commands.executeCommand('terminal.focus');
                                }
                                await vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Resource(s.split("\r\n")[0], s, "script", ""));
                                        }
                                    });
                                });
                                //creating snapshot and adding it to the array of snapshots
                                if (type === 1) {
                                    snaps.push(new Snapshot_1.Diary(qis.name, [new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps, ext, 0)], "code"));
                                }
                                else if (type === 2) {
                                    snaps.push(new Snapshot_1.Diary(qis.name, [new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps, ext, 0)], "file"));
                                }
                                else if (type === 3) {
                                    let ns = new Snapshot_1.Snapshot(qis.phase, "", "", scripts, fileTree, deps, "", 0);
                                    if (fileTree[0].name === ".git") {
                                        const selection = await vscode.window.showWarningMessage("Git repository already existing, creating the new diary the repo will be deleted, continue?", "Continue anyway", "Cancel");
                                        if (selection !== null) {
                                            if (selection === 'Continue anyway') {
                                                await vscode.commands.executeCommand('dear-diary.new-terminal', 0, 1, ns);
                                                if (ns.code === "") {
                                                    vscode.window.showErrorMessage("Error: Could not create new Project Diary");
                                                    return;
                                                }
                                                snaps.push(new Snapshot_1.Diary(qis.name, [ns], "project"));
                                            }
                                            else if (selection === 'Cancel') {
                                                vscode.window.showInformationMessage("The diary has not been created");
                                                return;
                                            }
                                        }
                                        else {
                                            vscode.window.showInformationMessage("No selection applied: the diary has not been created");
                                        }
                                    }
                                    else {
                                        await vscode.commands.executeCommand('dear-diary.new-terminal', 1, 1, ns);
                                        if (ns.code === "") {
                                            vscode.window.showErrorMessage("Error: Could not create new Project Diary");
                                            return;
                                        }
                                        snaps.push(new Snapshot_1.Diary(qis.name, [ns], "project"));
                                    }
                                }
                                //updating the system array of diaries
                                context.globalState.update("snaps", snaps);
                                vscode.commands.executeCommand("dear-diary.refreshSnapshots");
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("Error: Editor not present");
                        }
                    });
                });
            });
        });
    }));
    //create new snapshot to the previosuly created diary
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newPhase', async (node) => {
        await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
                vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
                    vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
                        const qis = await (0, multiStepInputNewPhase_1.newCodePhase)(context);
                        let fileTree = [];
                        let type = 0;
                        let packagePath = [];
                        switch (node.type) {
                            case "code":
                                type = 1;
                                break;
                            case "file":
                                type = 2;
                                break;
                            case "project":
                                type = 3;
                                break;
                        }
                        const editor = vscode.window.activeTextEditor;
                        let code;
                        if (editor) {
                            const document = editor.document;
                            if (type === 1) {
                                const selection = editor.selection;
                                code = document.getText(selection);
                            }
                            else if (type === 2) {
                                code = document.getText();
                            }
                            else if (type !== 3) {
                                vscode.window.showErrorMessage("Error: Snapshot type not valid");
                                return;
                            }
                            let fileName = document.fileName;
                            let fileext = fileName.match(/\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi)[0];
                            let ext = fileext ? fileext : "txt";
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName, type, packagePath);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code && type !== 3) {
                                vscode.window.showErrorMessage("Error: No code selected for the new snapshot");
                            }
                            else {
                                //get dependencies
                                let deps = [];
                                if (packagePath.length > 0) {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(packagePath[0].replace(/\\package\.json/, ''));
                                }
                                else {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                }
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.commands.executeCommand('terminal.focus');
                                }
                                await vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Resource(s.split("\r\n")[0], s, "script", ""));
                                        }
                                    });
                                });
                                //creating snapshot and adding it to the array of snapshots (aka diary)
                                if (type === 1 || type === 2) {
                                    node.ref.snapshots.push(new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps, ext, 0));
                                }
                                else if (type === 3) {
                                    let ns = new Snapshot_1.Snapshot(qis.phase, "", "", scripts, fileTree, deps, "", 0);
                                    await vscode.commands.executeCommand('dear-diary.new-terminal', 2, node.ref.snapshots.length + 1, ns);
                                    if (ns.code === "") {
                                        vscode.window.showErrorMessage("Error: Could not create new Project Snapshot");
                                        return;
                                    }
                                    node.ref.snapshots.push(ns);
                                }
                                //update snapshot array of relative diary and updating system diary array
                                context.globalState.update("snaps", snaps);
                                vscode.commands.executeCommand("dear-diary.refreshSnapshots");
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("Error: Editor not present");
                        }
                    });
                });
            });
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newDiaryPhase', async () => {
        await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
                vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
                    vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
                        const qis = await (0, multiStepInputNewPhase_1.newCodePhase)(context);
                        let fileTree = [];
                        let type = 3;
                        let packagePath = [];
                        const editor = vscode.window.activeTextEditor;
                        let code;
                        if (editor) {
                            const document = editor.document;
                            if (type === 1) {
                                const selection = editor.selection;
                                code = document.getText(selection);
                            }
                            else if (type === 2) {
                                code = document.getText();
                            }
                            else if (type !== 3) {
                                vscode.window.showErrorMessage("Error: Snapshot type not valid");
                                return;
                            }
                            let fileName = document.fileName;
                            let fileext = fileName.match(/\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi)[0];
                            let ext = fileext ? fileext : "txt";
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName, type, packagePath);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code && type !== 3) {
                                vscode.window.showErrorMessage("Error: No code selected for the new snapshot");
                            }
                            else {
                                //get dependencies
                                let deps = [];
                                let pa = packagePath[0].replace(/\\package\.json/, '');
                                if (packagePath.length > 0) {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(pa);
                                }
                                else {
                                    deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                }
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.commands.executeCommand('terminal.focus');
                                }
                                await vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Resource(s.split("\r\n")[0], s, "script", ""));
                                        }
                                    });
                                });
                                //creating snapshot and adding it to the array of snapshots (aka diary)
                                /*let ns = new Snapshot(qis.phase, "", "", scripts, fileTree, deps, "", 0);
                                await vscode.commands.executeCommand('dear-diary.new-terminal', 2, diary?.snapshots.length + 1, ns);
                                if (ns.code === "") {
                                    vscode.window.showErrorMessage("Error: Could not create new Snapshot");
                                    return;
                                }
                                diary?.snapshots.push(ns);*/
                                let ns = new Snapshot_1.Snapshot(qis.phase, "", "", scripts, fileTree, deps, "", 0);
                                if (fileTree[0].name === ".git") {
                                    const selection = await vscode.window.showWarningMessage("Git repository already existing, creating the new diary the repo will be deleted, continue?", "Continue anyway", "Cancel");
                                    if (selection !== null) {
                                        if (selection === 'Continue anyway') {
                                            await vscode.commands.executeCommand('dear-diary.new-terminal', 0, 1, ns);
                                            if (ns.code === "") {
                                                vscode.window.showErrorMessage("Error: Could not create new Snapshot");
                                                return;
                                            }
                                            diary?.snapshots.push(ns);
                                        }
                                        else if (selection === 'Cancel') {
                                            vscode.window.showInformationMessage("The snapshot has not been taken");
                                            return;
                                        }
                                    }
                                    else {
                                        vscode.window.showInformationMessage("No selection applied: the diary has not been created");
                                    }
                                }
                                else {
                                    await vscode.commands.executeCommand('dear-diary.new-terminal', 1, 1, ns);
                                    if (ns.code === "") {
                                        vscode.window.showErrorMessage("Error: Could not create new Snapshot");
                                        return;
                                    }
                                    diary?.snapshots.push(ns);
                                }
                                //update snapshot array of relative diary and updating system diary array
                                ft = false;
                                snapProvider.change(ft);
                                context.globalState.update("diary", diary);
                                vscode.commands.executeCommand("dear-diary.refreshSnapshots");
                                ft = false;
                            }
                        }
                        else {
                            vscode.window.showErrorMessage("Error: Editor not present");
                        }
                    });
                });
            });
        });
    }));
    vscode.window.terminals.forEach(t => {
        registerTerminalForCapture(t);
    });
    vscode.window.onDidOpenTerminal(t => {
        registerTerminalForCapture(t);
    });
}
exports.activate = activate;
function generateFileTree(selectedRootPath, level, parentDirIsLast = false, originalFilePath, type, packagePath) {
    let output = [];
    // return if path to target is not valid
    if (!fs.existsSync(selectedRootPath)) {
        return [];
    }
    // order by directory > file
    const beforeSortFiles = fs.readdirSync(selectedRootPath);
    let dirsArray = [];
    let filesArray = [];
    beforeSortFiles.forEach((el) => {
        const fullPath = path.join(selectedRootPath, el.toString());
        if (fs.statSync(fullPath).isDirectory()) {
            dirsArray.push(el);
        }
        else {
            filesArray.push(el);
        }
    });
    const pathsAndFilesArray = [...dirsArray, ...filesArray];
    pathsAndFilesArray.forEach((el) => {
        const elText = el.toString();
        const fullPath = path.join(selectedRootPath, el.toString());
        const lastItem = pathsAndFilesArray.indexOf(el) === pathsAndFilesArray.length - 1;
        const isDirectory = fs.statSync(fullPath).isDirectory();
        const isLastDirInTree = isDirectory && lastItem;
        let fsInst = new Snapshot_1.FSInstance(elText, isDirectory ? "dir" : "file", false, "", [], []);
        if (isDirectory) {
            if (fullPath.replace(/^.*[\\\/]/, '') === "node_modules" || fullPath.replace(/^.*[\\\/]/, '').match(new RegExp(/\..*/))) {
                return;
            }
            if (originalFilePath.includes(fullPath) && type !== 3) {
                fsInst.fileSnapshoted = true;
            }
            if (!fsInst.name.startsWith(".", 0)) {
                fsInst.subInstances = generateFileTree(fullPath, level + 1, isLastDirInTree, originalFilePath, type, packagePath);
            }
        }
        else {
            if (fullPath.replace(/^.*[\\\/]/, '') === "package.json") {
                packagePath.push(fullPath);
            }
            if (fullPath === originalFilePath && type !== 3) {
                fsInst.fileSnapshoted = true;
            }
        }
        output.push(fsInst);
    });
    return output;
}
function registerTerminalForCapture(terminal) {
    terminal.processId.then(terminalId => {
        terminalData[terminalId] = "";
        terminal.onDidWriteData((data) => {
            terminalData[terminalId] += data;
        });
    });
}
class NewSnapshotsViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                /*case 'new-code-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot", 1);
                        break;
                    };

                case 'new-file-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot", 2);
                        break;
                    };*/
                case 'new-project-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.newDiaryPhase", 3);
                        break;
                    }
                    ;
            }
        });
    }
    change(t) {
        if (this._view) {
            this._view.webview.postMessage({ type: 'entry', e: t });
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>New Snapshot</title>
			</head>
			<body>

				<h3>Welcome to Dear Diary!</h3>
				<hr>
				<p></br></p>
				<div id="entry" class="ghost" >
					<p class="prova">
						You still don't have snapshots.</br></br>To get familiar with the extension, you can start by taking the first snapshot of your project.</br></br>
					</p>
				</div>
				<button class="new-project-snapshot-button">New Snapshot</button>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
NewSnapshotsViewProvider.viewType = 'new-snapshots';
class CommentViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.snap = new Snapshot_1.Snapshot("", "", "Select a snapshot to visualize and edit a comment", [], [], [], "", 0);
        this.dep = new Snapshot_1.Resource("", "", "", "");
        this.script = new Snapshot_1.Resource("", "", "", "");
        this.fi = new Snapshot_1.FSInstance("", "", false, "", [], []);
        this.type = "";
        this.dTitle = "";
        this.otherComs = new Snapshot_1.ResCommented([], [], []);
    }
    resolveWebviewView(webviewView, context, _token) {
        this._view = webviewView;
        webviewView.webview.options = {
            // Allow scripts in the webview
            enableScripts: true,
            localResourceRoots: [
                this._extensionUri
            ]
        };
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'saveComment':
                    {
                        if (this.type === "snapshot") {
                            if (this.snap.comment === "" && data.value !== "") {
                                this.snap.nComments++;
                            }
                            else if (this.snap.comment !== "" && data.value === "") {
                                this.snap.nComments--;
                            }
                            this.snap.comment = data.value;
                            vscode.commands.executeCommand("extension.saveChanges", this.type);
                        }
                        else if (this.type === "dependency") {
                            if (this.dep.comment === "" && data.value !== "") {
                                this.snap.nComments++;
                            }
                            else if (this.dep.comment !== "" && data.value === "") {
                                this.snap.nComments--;
                            }
                            this.dep.comment = data.value;
                            vscode.commands.executeCommand("extension.saveChanges", this.type);
                        }
                        else if (this.type === "script") {
                            if (this.script.comment === "" && data.value !== "") {
                                this.snap.nComments++;
                            }
                            else if (this.script.comment !== "" && data.value === "") {
                                this.snap.nComments--;
                            }
                            this.script.comment = data.value;
                            vscode.commands.executeCommand("extension.saveChanges", this.type);
                        }
                        else if (this.type === "file") {
                            let ind = data.index;
                            if (this.fi.comment[ind] === "" && data.value !== "") {
                                this.snap.nComments++;
                            }
                            else if (this.fi.comment[ind] !== "" && data.value === "") {
                                this.snap.nComments--;
                            }
                            if (data.value === "") {
                                this.fi.comment.splice(ind, 1);
                            }
                            else {
                                this.fi.comment[ind] = data.value;
                            }
                            vscode.commands.executeCommand("extension.saveChanges", this.type);
                            this.setFileComment(this.fi, this.snap, "Diary");
                        }
                        break;
                    }
                    ;
                case 'saveNewComment':
                    {
                        this.snap.nComments++;
                        this.fi.comment.push(data.com);
                        vscode.commands.executeCommand("extension.saveChanges", this.type);
                        this.setFileComment(this.fi, this.snap, "Diary");
                    }
                    ;
                /*case 'saveOtherComment':
                    {
                        let val = data.val;
                        if(val.type === 'script'){
                            if(this.otherComs.scripts[val.index].comment === "" && val.newCom !==""){
                                this.snap.nComments++;
                            }
                            else if(this.otherComs.scripts[val.index].comment !== "" && val.newCom === ""){
                                this.snap.nComments--;
                            }
                            this.otherComs.scripts[val.index].comment = val.newCom;
                            if(val.newCom===""){
                                this.otherComs.scripts.splice(val.index, 1);
                            }
                            vscode.commands.executeCommand("extension.saveChanges", "script");
                            this.setComment(this.snap, this.dTitle, this.otherComs);
                        }
                        else if(val.type === 'file'){
                            if(this.otherComs.files[val.index].comment === "" && val.newCom !==""){
                                this.snap.nComments++;
                            }
                            else if(this.otherComs.files[val.index].comment !== "" && val.newCom === ""){
                                this.snap.nComments--;
                            }
                            this.otherComs.files[val.index].comment = val.newCom;
                            if(val.newCom===""){
                                this.otherComs.files.splice(val.index, 1);
                                this.snap.nComments--;
                            }
                            vscode.commands.executeCommand("extension.saveChanges", "file");
                            this.setComment(this.snap, this.dTitle, this.otherComs);
                        }
                        else if(val.type === 'dependency'){
                            if(this.otherComs.dependencies[val.index].comment === "" && val.newCom !==""){
                                this.snap.nComments++;
                            }
                            else if(this.otherComs.dependencies[val.index].comment !== "" && val.newCom === ""){
                                this.snap.nComments--;
                            }
                            this.otherComs.dependencies[val.index].comment = val.newCom;
                            if(val.newCom===""){
                                this.otherComs.dependencies.splice(val.index, 1);
                                this.snap.nComments--;
                            }
                            vscode.commands.executeCommand("extension.saveChanges", "dependency");
                            this.setComment(this.snap, this.dTitle, this.otherComs);
                        }
                        console.log(this.dTitle+"/"+this.snap.title+": "+this.snap.nComments);
                        break;
                    };*/
            }
        });
    }
    setComment(s, d, ss) {
        this.snap = s;
        this.type = "snapshot";
        this.otherComs = ss;
        this.dTitle = d;
        ss.dependencies.splice(0, ss.dependencies.length);
        ss.scripts.splice(0, ss.scripts.length);
        ss.files.splice(0, ss.files.length);
        for (const deps of s.dependencies) {
            if (deps.comment !== "") {
                ss.dependencies.push(deps);
            }
        }
        for (const scrs of s.scripts) {
            if (scrs.comment !== "") {
                ss.scripts.push(scrs);
            }
        }
        this.searchFiles(s.files, ss);
        if (this._view) {
            this._view.webview.postMessage({ type: 'comment', relatedData: { snap: s, diaryTitle: d, coms: ss } });
        }
    }
    searchFiles(f, s2) {
        for (const f2 of f) {
            if (f2.type === "folder") {
                this.searchFiles(f2.subInstances, s2);
            }
            else if (f2.comment.length > 0) {
                s2.files.push(f2);
            }
        }
    }
    setDepComment(n, sn, dtit) {
        this.dep = n;
        this.type = "dependency";
        this.snap = sn;
        this.dTitle = dtit;
        if (this._view) {
            this._view.webview.postMessage({ type: 'comment', relatedData: { res: n, type: this.type, snapT: sn.title, diaryT: dtit } });
        }
    }
    setScriptComment(n, sn, dtit) {
        this.script = n;
        this.type = "script";
        this.snap = sn;
        this.dTitle = dtit;
        if (this._view) {
            this._view.webview.postMessage({ type: 'comment', relatedData: { res: n, type: this.type, snapT: sn.title, diaryT: dtit } });
        }
    }
    setFileComment(n, sn, dtit) {
        this.fi = n;
        this.type = "file";
        this.snap = sn;
        this.dTitle = dtit;
        if (this._view) {
            this._view.webview.postMessage({ type: 'comment', relatedData: { res: n, type: this.type, snapT: sn.title, diaryT: dtit } });
        }
    }
    _getHtmlForWebview(webview) {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'commentMain.js'));
        // Do the same for the stylesheet.
        const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
        const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
        const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
        // Use a nonce to only allow a specific script to be run.
        const nonce = getNonce();
        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">
				
				<title>Comment</title>
			</head>
			<body>
				<h1 id="label"></h1>
				<h3 id="sublabel"></h3>
				<div id="card" class="card">
					<div class="container">
						<pre class="text-box">Here you can view and edit comments</pre>
					</div>
				</div>

				<form id="comment-box">
					<textarea id="input-area" class="ghost"></textarea>
				</form>

				<div id="bRow" class="buttons-row">
					<button id="cancelbtn" class="ghost">Cancel</button>
					<button id="editbtn" class="ghost">Edit</button>
					<button id="savebtn" class="ghost">Save</button>
				</div>

				<div id="file-comments">
					<ul id="file-com-list">
						<div id="delfile"></div>
					</ul>
				</div>

				<div id="lists">
					<h2 id="scripts-label" class="ghost">Scripts comments</h2>
					<ul id="scripts-list">
						<div id="del1"></div>
					</ul>

					<h2 id="files-label" class="ghost">Files comments</h2>
					<ul id="files-list">
						<div id="del2"></div>
					</ul>

					<h2 id="dependencies-label" class="ghost">Dependencies comments</h2>
					<ul id="dependencies-list">
						<div id="del3"></div>
					</ul>
				</div>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
CommentViewProvider.viewType = 'comment';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
const execShell = (cmd) => new Promise((resolve, reject) => {
    cp.exec(cmd, (err, out) => {
        if (err) {
            return resolve(err.toString());
        }
        return resolve(out);
    });
});
// this method is called when your extension is deactivated
function deactivate() {
    vscode.commands.executeCommand("dear-diary.closeProjectSnapshot");
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map