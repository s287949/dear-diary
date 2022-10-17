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
/*
TODO:
- adding comments and saving them

*/
let terminalData = {};
let commentId = 1;
class NoteComment {
    constructor(body, mode, author, parent, contextValue) {
        this.body = body;
        this.mode = mode;
        this.author = author;
        this.parent = parent;
        this.contextValue = contextValue;
        this.id = ++commentId;
        this.savedBody = this.body;
    }
}
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    let snaps = context.globalState.get("snaps");
    //Show dependencies in the Dependencies view
    const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
        ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;
    // A `CommentController` is able to provide comments for documents.
    const commentController = vscode.comments.createCommentController('diary-comment', 'Diary snapshot comment');
    context.subscriptions.push(commentController);
    // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
    /*commentController.commentingRangeProvider = {
        provideCommentingRanges: (document: vscode.TextDocument, token: vscode.CancellationToken) => {
            const lineCount = document.lineCount;
            return [new vscode.Range(0, 0, lineCount - 1, 0)];
        }
    };*/
    //Providing Snapshots to the related view
    const snapshotsProvider = new snapshotsProvider_1.SnapshotsProvider(context);
    vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
    vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => snapshotsProvider.refresh());
    //Open file showing code snapshotted
    vscode.commands.registerCommand('extension.openPhase', phase => {
        const nodeDependenciesProvider = new dependenciesProvider_1.DepNodeProvider(phase.dependencies);
        vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
        const nodeScriptsProvider = new scriptsProvider_1.ScriptsProvider(phase.scripts);
        vscode.window.registerTreeDataProvider('command-line-scripts', nodeScriptsProvider);
        const nodeFilesProvider = new filesProvider_1.FilesNodeProvider(phase.files);
        vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
        var setting = vscode.Uri.parse(phase.title ? "untitled:" + "C:\\" + phase.title + ".txt" : "untitled:" + "C:\phase code.txt");
        vscode.workspace.onDidOpenTextDocument((a) => {
            let fn = phase.title ? "C:\\" + phase.title + ".txt" : "C:\phase code.txt";
            if (a.fileName === fn) {
                vscode.window.showTextDocument(a, 1, false).then(e => {
                    e.edit(edit => {
                        edit.insert(new vscode.Position(0, 0), phase.code);
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
    //Open file showing the command line script and the output
    vscode.commands.registerCommand('extension.openScript', script => {
        var setting = vscode.Uri.parse("untitled:" + "C:\\" + script.script + ".txt");
        vscode.workspace.onDidOpenTextDocument((a) => {
            if (a.fileName === "C:\\" + script.script + ".txt") {
                vscode.window.showTextDocument(a, 1, false).then(e => {
                    e.edit(edit => {
                        edit.insert(new vscode.Position(0, 0), script.output);
                    });
                });
            }
        });
        vscode.workspace.openTextDocument(setting).then((a) => {
            /*vscode.window.showTextDocument(a, 1, false).then(e => {
                e.edit(edit => {
                    edit.insert(new vscode.Position(0, 0), script.output);
                });
            });*/
        }, (error) => {
            console.error(error);
            debugger;
        });
    });
    //New code snapshot command impelementation
    const provider = new NewSnapshotsViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async () => {
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
                            const selection = editor.selection;
                            code = document.getText(selection);
                            let range = new vscode.Range(editor.selection.start, editor.selection.end);
                            let fileName = document.fileName;
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code) {
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
                                    vscode.window.showWarningMessage('No terminals found, cannot run copy');
                                    return;
                                }
                                vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "");
                                        if (s && s.trim() !== '') {
                                            scripts.push(new Snapshot_1.Script(s.split("\r\n")[0], s));
                                        }
                                    });
                                });
                                let commentThread = commentController.createCommentThread(editor.document.uri, range, []);
                                //creating snapshot and adding it to the array of snapshots
                                snaps.push(new Snapshot_1.Snapshot(qis.name, [new Snapshot_1.Phase(qis.phase, code, "", scripts, fileTree, deps)], "code"));
                                //updating the system array of snapshots
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
                        const editor = vscode.window.activeTextEditor;
                        let code;
                        if (editor) {
                            const document = editor.document;
                            const selection = editor.selection;
                            code = document.getText(selection);
                            let fileName = document.fileName;
                            if (rootPath) {
                                fileTree = generateFileTree(rootPath, 0, false, fileName);
                            }
                            else {
                                vscode.window.showErrorMessage("Error: File tree could not be captured");
                                return;
                            }
                            if (!code) {
                                vscode.window.showErrorMessage("Error: No code selected for the new phase");
                            }
                            else {
                                let deps = (0, dependenciesCatcher_1.getDepsInPackageJson)(rootPath);
                                //get command line scripts
                                let scripts = [];
                                const terminals = vscode.window.terminals;
                                if (terminals.length <= 0) {
                                    vscode.window.showWarningMessage('No terminals found, cannot run copy');
                                    return;
                                }
                                vscode.env.clipboard.readText().then((text) => {
                                    let scrts = text.split(new RegExp(/PS C:\\.*>/));
                                    scrts.shift();
                                    scrts.forEach((i) => {
                                        let s = i.replace(new RegExp(/.*PS C:\\.*>/), "");
                                        if (s) {
                                            scripts.push(new Snapshot_1.Script(s.split("\r\n")[0], s));
                                        }
                                    });
                                });
                                //create new phase and push it to the relative snapshot
                                node.ref.phases.push(new Snapshot_1.Phase(qis.phase, code, "", scripts, fileTree, deps));
                                //update system snapshots array
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
    context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newComment', (reply) => {
        replyNote(reply);
    }));
    vscode.window.terminals.forEach(t => {
        registerTerminalForCapture(t);
    });
    vscode.window.onDidOpenTerminal(t => {
        registerTerminalForCapture(t);
    });
    function replyNote(reply) {
        const thread = reply.thread;
        const newComment = new NoteComment(reply.text, vscode.CommentMode.Preview, { name: 'vscode' }, thread, thread.comments.length ? 'canDelete' : undefined);
        if (thread.contextValue === 'draft') {
            newComment.label = 'pending';
        }
        thread.comments = [...thread.comments, newComment];
    }
}
exports.activate = activate;
function generateFileTree(selectedRootPath, level, parentDirIsLast = false, originalFilePath) {
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
        let fsInst = new Snapshot_1.FSInstance(elText, isDirectory ? "dir" : "file", false, []);
        if (isDirectory) {
            fsInst.subInstances = generateFileTree(fullPath, level + 1, isLastDirInTree, originalFilePath);
        }
        else if (fullPath === originalFilePath) {
            fsInst.fileSnapshoted = true;
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
                        vscode.commands.executeCommand("dear-diary.new-code-snapshot");
                        break;
                    }
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

				<button class="new-code-snapshot-button">New Code Snapshot</button>
				<button class="new-file-snapshot-button">New File Snapshot</button>
				<button class="new-project-snapshot-button">New Project Snapshot</button>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}
NewSnapshotsViewProvider.viewType = 'new-snapshots';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map