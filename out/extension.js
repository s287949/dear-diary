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
/*

nuovo diario:
- nuova cartella .deardiary
- git init nella cartella .deardiary
- git add .
- git commit -m "<nome snap o numero snap>"


nuovo snap:
- git add .
- git commit -m "<nome snap o numero snap>"

*/
let terminalData = {};
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let snaps = context.globalState.get("snaps");
    //Show dependencies in the Dependencies view
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    //Providing Snapshots to the related view
    const snapshotsProvider = new snapshotsProvider_1.SnapshotsProvider(context);
    vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
    vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => snapshotsProvider.refresh());
    //Open file showing code snapshotted
    vscode.commands.registerCommand('extension.openSnapshot', async (snap, diary) => {
        const nodeDependenciesProvider = new dependenciesProvider_1.DepNodeProvider(snap.dependencies);
        vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
        const nodeScriptsProvider = new scriptsProvider_1.ScriptsProvider(snap.scripts);
        vscode.window.registerTreeDataProvider('command-line-scripts', nodeScriptsProvider);
        const nodeFilesProvider = new filesProvider_1.FilesNodeProvider(snap.files);
        vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
        if (diary.type !== "project") {
            var setting = vscode.Uri.parse(snap.title ? "untitled:" + "C:\\" + diary + "\\" + snap.title + ".txt" : "untitled:" + "C:\\" + diary + "\\" + "code snapshot.txt");
            vscode.workspace.onDidOpenTextDocument((a) => {
                let fn = snap.title ? "C:\\" + diary.title + "\\" + snap.title + ".txt" : "C:\\" + diary.title + "\\" + "code snapshot.txt";
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
            command = "cd " + rootPath + " git checkout " + snap.code;
            output = await execShell(command);
            vscode.window.showInformationMessage(output);
        }
        commentProvider.setComment(snap);
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
    vscode.commands.registerCommand('extension.saveChanges', script => {
        context.globalState.update("snaps", snaps);
    });
    //Comment webview implementation
    const commentProvider = new CommentViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(CommentViewProvider.viewType, commentProvider));
    vscode.commands.registerCommand('dear-diary.comment', () => {
        vscode.commands.executeCommand('comment.focus');
    });
    vscode.commands.registerCommand('dear-diary.new-terminal', async (type, snapNo, ns) => {
        let command = "";
        const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
            ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
        let output;
        if (type === 1) {
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
        ns.code = output.match(/.{7}\]/)?.toString().match(/.{7}/)?.toString();
    });
    //New code snapshot command impelementation
    const snapProvider = new NewSnapshotsViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, snapProvider));
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async (type) => {
        await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
                vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
                    vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
                        const qis = await (0, multiStepInputNewSnapshot_1.newCodeSnapshot)(context);
                        let fileTree = [];
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
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName, type);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code && type !== 3) {
                                vscode.window.showErrorMessage("Error: No code selected for the snapshot");
                            }
                            else {
                                context.globalState.update("snaps", []);
                                snaps = context.globalState.get("snaps");
                                if (!snaps) {
                                    context.globalState.update("snaps", []);
                                    snaps = [];
                                }
                                //get dependencies
                                let deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.window.showWarningMessage('No terminals found, cannot create new Diary');
                                    return;
                                }
                                await vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Resource(s.split("\r\n")[0], s, "script"));
                                        }
                                    });
                                });
                                //creating snapshot and adding it to the array of snapshots
                                if (type === 1 || type === 2) {
                                    snaps.push(new Snapshot_1.Diary(qis.name, [new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps)], "code"));
                                }
                                else if (type === 3) {
                                    let ns = new Snapshot_1.Snapshot(qis.phase, "", "", scripts, fileTree, deps);
                                    await vscode.commands.executeCommand('dear-diary.new-terminal', 1, 1, ns);
                                    if (ns.code === "") {
                                        vscode.window.showErrorMessage("Error: Could not create new Project Diary");
                                        return;
                                    }
                                    snaps.push(new Snapshot_1.Diary(qis.name, [ns], "project"));
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
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newPhase', async (node) => {
        await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
            vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
                vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
                    vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
                        const qis = await (0, multiStepInputNewPhase_1.newCodePhase)(context);
                        let fileTree = [];
                        let type = 0;
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
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName, type);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code && type !== 3) {
                                vscode.window.showErrorMessage("Error: No code selected for the new snapshot");
                            }
                            else {
                                let deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.window.showWarningMessage('No terminals found, cannot create new snapshot');
                                    return;
                                }
                                await vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Resource(s.split("\r\n")[0], s, "script"));
                                        }
                                    });
                                });
                                //create new phase and push it to the relative snapshot
                                node.ref.snapshots.push(new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps));
                                //creating snapshot and adding it to the array of snapshots
                                if (type === 1 || type === 2) {
                                    node.ref.snapshots.push(new Snapshot_1.Snapshot(qis.phase, code, "", scripts, fileTree, deps));
                                }
                                else if (type === 3) {
                                    let ns = new Snapshot_1.Snapshot(qis.phase, "", "", scripts, fileTree, deps);
                                    vscode.commands.executeCommand('dear-diary.new-terminal', 0, node.ref.snapshots.length + 1, ns);
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
    vscode.window.terminals.forEach(t => {
        registerTerminalForCapture(t);
    });
    vscode.window.onDidOpenTerminal(t => {
        registerTerminalForCapture(t);
    });
}
exports.activate = activate;
function generateFileTree(selectedRootPath, level, parentDirIsLast = false, originalFilePath, type) {
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
        let fsInst = new Snapshot_1.FSInstance(elText, isDirectory ? "dir" : "file", false, "", []);
        if (isDirectory) {
            if (!fsInst.name.startsWith(".", 0)) {
                fsInst.subInstances = generateFileTree(fullPath, level + 1, isLastDirInTree, originalFilePath, type);
            }
        }
        else {
            if (fullPath === originalFilePath && type !== 3) {
                fsInst.fileSnapshoted = true;
            }
            else if (type === 3) {
                vscode.workspace.findFiles("*").then((doc) => {
                    vscode.workspace.openTextDocument(doc[0]).then((d) => {
                        fsInst.snap = d.getText();
                    });
                });
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
            // TODO:
            //   - Need to remove (or handle) backspace
            //   - not sure what to do about carriage return???
            //   - might have some odd output
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
                case 'new-code-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot", 1);
                        break;
                    }
                    ;
                case 'new-file-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot", 2);
                        break;
                    }
                    ;
                case 'new-project-snap':
                    {
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot", 3);
                        break;
                    }
                    ;
            }
        });
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

				<button class="new-code-snapshot-button">New Code Diary</button>
				<button class="new-file-snapshot-button">New File Diary</button>
				<button class="new-project-snapshot-button">New Project Diary</button>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
NewSnapshotsViewProvider.viewType = 'new-snapshots';
class CommentViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
        this.snap = new Snapshot_1.Snapshot("", "", "Select a snapshot to visualize and edit a comment", [], [], []);
        this.snapSelected = false;
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
                        this.snap.comment = data.value;
                        vscode.commands.executeCommand("extension.saveChanges");
                        break;
                    }
                    ;
            }
        });
    }
    setComment(s) {
        this.snap = s;
        this.snapSelected = true;
        if (this._view) {
            this._view.webview.postMessage({ type: 'comment', comment: s.comment });
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
				<div id="card" class="card">
					<div class="container">
						<pre class="text-box">Select a snapshot to view and edit the comment</pre>
					</div>
				</div>

				<form id="comment-box">
				</form>

				<div class="buttons-row">				
					<button id="cancelbtn" class="ghost">Cancel</button>
					<button id="editbtn" class="ghost">Edit</button>
					<button id="savebtn" class="ghost">Save</button>
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
            return resolve('error');
        }
        return resolve(out);
    });
});
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map