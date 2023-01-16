// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { newCodeSnapshot } from './multiStepInputNewSnapshot';
import { newCodePhase } from './multiStepInputNewPhase';
import { DepNodeProvider } from './dependenciesProvider';
import { SnapshotsProvider, DiaryItem } from './snapshotsProvider';
import { FilesNodeProvider } from './filesProvider';
import { ScriptsProvider } from './scriptsProvider';
import { Diary, Snapshot, FSInstance, Resource } from './Snapshot';
import { getDepsInPackageJson } from './dependenciesCatcher';
import * as fs from 'fs';
import * as path from 'path';
import * as cp from "child_process";


let terminalData = {};


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let snaps: Array<Diary> | undefined = context.globalState.get("snaps");
	//Show dependencies in the Dependencies view
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	var tc = false; // variable for temporary commit in case the user checks out to a project snapshot

	//Providing Snapshots to the related view
	const snapshotsProvider = new SnapshotsProvider(context);
	vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
	vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => snapshotsProvider.refresh());
	//Open file showing code snapshotted
	vscode.commands.registerCommand('extension.openSnapshot', async (snap: Snapshot, diary: Diary) => {
		const nodeDependenciesProvider = new DepNodeProvider(snap.dependencies!);
		vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
		const nodeScriptsProvider = new ScriptsProvider(snap.scripts!);
		vscode.window.registerTreeDataProvider('command-line-scripts', nodeScriptsProvider);
		const nodeFilesProvider = new FilesNodeProvider(snap.files!);
		vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
		if (diary.type !== "project") {
			var t = snap.title ? "untitled:" + "C:\\" + diary.title + "\\" + snap.title + ".txt" : "untitled:" + "C:\\" + diary.title + "\\" + "code snapshot.txt";
			var setting: vscode.Uri = vscode.Uri.parse(snap.title ? "untitled:" + "C:\\" + diary.title + "\\" + snap.title + ".txt" : "untitled:" + "C:\\" + diary.title + "\\" + "code snapshot.txt");
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
			vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
			}, (error: any) => {
				console.error(error);
				debugger;
			});
		}
		else {
			let command: string = "";
			let output;
			if (!tc) {
				command = "cd " + rootPath + " && git add .";
				output = await execShell(command);
				command = "cd " + rootPath + " && git commit -m \"temporary commit\"";
				output = await execShell(command);
				tc = true;
			}
			command = "cd " + rootPath + " && git checkout " + snap.code;
			output = await execShell(command);
			if (output === "error") {
				vscode.window.showErrorMessage("Error: Could not open snapshot");
			}
		}

		commentProvider.setComment(snap);
	});

	//Open file showing the command line script and the output
	vscode.commands.registerCommand('extension.openScript', script => {
		var setting: vscode.Uri = vscode.Uri.parse("untitled:" + "C:\\" + script.moduleOrCommand + ".txt");
		vscode.workspace.onDidOpenTextDocument((a) => {
			if (a.fileName === "C:\\" + script.moduleOrCommand + ".txt") {
				vscode.window.showTextDocument(a, 1, false).then(e => {
					e.edit(edit => {
						edit.insert(new vscode.Position(0, 0), script.versionOrOutput);
					});
				});
			}

		});
		vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
		}, (error: any) => {
			console.error(error);
			debugger;
		});
	});

	//save changes to a comment
	vscode.commands.registerCommand('extension.saveChanges', script => {
		context.globalState.update("snaps", snaps);
	});

	//close the project snapshot previously opened and go back to the version of the code in act before selecting it
	vscode.commands.registerCommand('dear-diary.closeProjectSnapshot', async () => {
		if(!tc){
			vscode.window.showErrorMessage("Error: No Project snapshot was previosuly opened");
			return;
		}
		let command: string = "";
		let output;
		command = "cd " + rootPath + " && git checkout master";
		output = await execShell(command);
		if (output === "error") {
			vscode.window.showErrorMessage("Error: Could not close snapshot and go back");
		}
		else {
			tc = false;
		}
	});

	//Comment webview implementation
	const commentProvider = new CommentViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(CommentViewProvider.viewType, commentProvider));
	vscode.commands.registerCommand('dear-diary.comment', () => {
		vscode.commands.executeCommand('comment.focus');
	});

	//create a new project snapshot using git
	vscode.commands.registerCommand('dear-diary.new-terminal', async (type: number, snapNo: number, ns: Snapshot) => {
		let command: string = "";
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
		if (output !== "error") {
			ns.code = output.match(/.{7}\]/)?.toString().match(/.{7}/)?.toString()!;
		}
	});

	//New code snapshot command impelementation
	const snapProvider = new NewSnapshotsViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, snapProvider));

	//create a new code/file/project diary and the relative first snapshot
	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async (type: number) => {
		await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
				vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
					vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
						const qis = await newCodeSnapshot(context);
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
								let deps = getDepsInPackageJson(rootPath);

								//get command line scripts
								let scripts: Resource[] = [];
								const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
								if (terminals.length <= 0) {
									vscode.commands.executeCommand('terminal.focus');
								}
								await vscode.env.clipboard.readText().then((text) => {
									let scrts = text.split(new RegExp(/PS C:\\.*>/));
									scrts.shift();
									scrts.forEach((i) => {
										let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();
										if (s && s.trim() !== '') {
											scripts.push(new Resource(s.split("\r\n")[0], s, "script"));
										}
									});
								});

								//creating snapshot and adding it to the array of snapshots
								if (type === 1) {
									snaps.push(new Diary(qis.name, [new Snapshot(qis.phase, code as string, "", scripts, fileTree, deps)], "code"));
								}
								else if (type === 2) {
									snaps.push(new Diary(qis.name, [new Snapshot(qis.phase, code as string, "", scripts, fileTree, deps)], "file"));
								}
								else if (type === 3) {
									let ns = new Snapshot(qis.phase, "", "", scripts, fileTree, deps);
									if (fileTree[0].name === ".git") {
										const selection = await vscode.window.showWarningMessage("Git repository already existing, creating the new diary the repo will be deleted, continue?", "Continue anyway", "Cancel");
										if (selection !== null) {
											if (selection === 'Continue anyway') {
												await vscode.commands.executeCommand('dear-diary.new-terminal', 0, 1, ns);
												if (ns.code === "") {
													vscode.window.showErrorMessage("Error: Could not create new Project Diary");
													return;
												}
												snaps.push(new Diary(qis.name, [ns], "project"));
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
										snaps.push(new Diary(qis.name, [ns], "project"));
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
	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newPhase', async (node: DiaryItem) => {
		await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
				vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
					vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
						const qis = await newCodePhase(context);
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
								let deps = getDepsInPackageJson(rootPath);

								//get command line scripts
								let scripts: Resource[] = [];
								const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
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
											scripts.push(new Resource(s.split("\r\n")[0], s, "script"));
										}
									});
								});

								//creating snapshot and adding it to the array of snapshots
								if (type === 1 || type === 2) {
									node.ref.snapshots.push(new Snapshot(qis.phase, code as string, "", scripts, fileTree, deps));
								}
								else if (type === 3) {
									let ns = new Snapshot(qis.phase, "", "", scripts, fileTree, deps);
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

	vscode.window.terminals.forEach(t => {
		registerTerminalForCapture(t);
	});

	vscode.window.onDidOpenTerminal(t => {
		registerTerminalForCapture(t);
	});
}

function generateFileTree(selectedRootPath: string, level: number, parentDirIsLast = false, originalFilePath: string, type: number) {
	let output: FSInstance[] = [];

	// return if path to target is not valid
	if (!fs.existsSync(selectedRootPath)) {
		return [];
	}

	// order by directory > file
	const beforeSortFiles = fs.readdirSync(selectedRootPath);
	let dirsArray: string[] = [];

	let filesArray: string[] = [];
	beforeSortFiles.forEach((el) => {
		const fullPath = path.join(selectedRootPath, el.toString());
		if (fs.statSync(fullPath).isDirectory()) {
			dirsArray.push(el);
		} else {
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

		let fsInst = new FSInstance(elText, isDirectory ? "dir" : "file", false, "", []);

		if (isDirectory) {
			if (originalFilePath.includes(fullPath) && type !== 3) {
				fsInst.fileSnapshoted = true;
			}
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

function registerTerminalForCapture(terminal: vscode.Terminal) {
	terminal.processId.then(terminalId => {
		(<any>terminalData)[terminalId!] = "";
		(<any>terminal).onDidWriteData((data: any) => {
			(<any>terminalData)[terminalId!] += data;
		});
	});
}

class NewSnapshotsViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'new-snapshots';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
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
					};

				case 'new-file-snap':
					{
						vscode.commands.executeCommand("dear-diary.new-code-snapshot", 2);
						break;
					};
				case 'new-project-snap':
					{
						vscode.commands.executeCommand("dear-diary.new-code-snapshot", 3);
						break;
					};
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
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

class CommentViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'comment';

	private _view?: vscode.WebviewView;

	private snap: Snapshot = new Snapshot("", "", "Select a snapshot to visualize and edit a comment", [], [], []);
	private snapSelected: boolean = false;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
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
					};
			}
		});
	}

	public setComment(s: Snapshot) {
		this.snap = s;
		this.snapSelected = true;

		if (this._view) {
			this._view.webview.postMessage({ type: 'comment', relatedData: s });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
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
				<h2 id="label"></h2>	
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

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

const execShell = (cmd: string) =>
	new Promise<string>((resolve, reject) => {
		cp.exec(cmd, (err, out) => {
			if (err) {
				return resolve('error');
			}
			return resolve(out);
		});
	});


// this method is called when your extension is deactivated
export function deactivate() {
	vscode.commands.executeCommand("dear-diary.closeProjectSnapshot");
}