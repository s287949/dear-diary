// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { newCodeSnapshot } from './multiStepInputNewSnapshot';
import { newCodePhase } from './multiStepInputNewPhase';
import { DepNodeProvider } from './dependenciesProvider';
import { SnapshotsProvider, SnapshotItem } from './snapshotsProvider';
import { FilesNodeProvider } from './filesProvider';
import { ScriptsProvider } from './scriptsProvider';
import { Snapshot, Phase, FSInstance, Script } from './Snapshot';
import { getDepsInPackageJson } from './dependenciesCatcher';
import * as fs from 'fs';
import * as path from 'path';


/*
TODO:
- change tab when panel is opened for commenting


*/

let terminalData = {};


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	let snaps: Array<Snapshot> | undefined = context.globalState.get("snaps");
	//Show dependencies in the Dependencies view
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	//Providing Snapshots to the related view
	const snapshotsProvider = new SnapshotsProvider(context);
	vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
	vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => snapshotsProvider.refresh());
	//Open file showing code snapshotted
	vscode.commands.registerCommand('extension.openPhase', (phase, snap) => {
		const nodeDependenciesProvider = new DepNodeProvider(phase.dependencies!);
		vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
		const nodeScriptsProvider = new ScriptsProvider(phase.scripts!);
		vscode.window.registerTreeDataProvider('command-line-scripts', nodeScriptsProvider);
		const nodeFilesProvider = new FilesNodeProvider(phase.files!);
		vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
		var setting: vscode.Uri = vscode.Uri.parse(phase.title ? "untitled:" + "C:\\" + snap + "\\" + phase.title + ".txt" : "untitled:" + "C:\\" + snap + "\\" + "phase code.txt");
		vscode.workspace.onDidOpenTextDocument((a) => {
			let fn = phase.title ? "C:\\" + snap + "\\" + phase.title + ".txt" : "C:\\" + snap + "\\" + "phase code.txt";
			if (a.fileName === fn) {
				vscode.window.showTextDocument(a, 1, false).then(e => {
					e.edit(edit => {
						edit.insert(new vscode.Position(0, 0), phase.code);
					});
				});
			}

		});
		vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
		}, (error: any) => {
			console.error(error);
			debugger;
		});
		const vscodeAPI = acquireVsCodeApi();
		vscodeAPI.setState({activePhase: phase});
	});
	//Open file showing the command line script and the output
	vscode.commands.registerCommand('extension.openScript', script => {
		var setting: vscode.Uri = vscode.Uri.parse("untitled:" + "C:\\" + script.script + ".txt");
		vscode.workspace.onDidOpenTextDocument((a) => {
			if (a.fileName === "C:\\" + script.script + ".txt") {
				vscode.window.showTextDocument(a, 1, false).then(e => {
					e.edit(edit => {
						edit.insert(new vscode.Position(0, 0), script.output);
					});
				});
			}

		});
		vscode.workspace.openTextDocument(setting).then((a: vscode.TextDocument) => {
			/*vscode.window.showTextDocument(a, 1, false).then(e => {
				e.edit(edit => {
					edit.insert(new vscode.Position(0, 0), script.output);
				});
			});*/
		}, (error: any) => {
			console.error(error);
			debugger;
		});
	});

	//Comment webview implementation
	const commentProvider = new CommentViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(CommentViewProvider.viewType, commentProvider));
	vscode.commands.registerCommand('dear-diary.comment', () => {
		vscode.commands.executeCommand('workbench.action.togglePanel');
	});

	//New code snapshot command impelementation
	const snapProvider = new NewSnapshotsViewProvider(context.extensionUri);
	context.subscriptions.push(vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, snapProvider));

	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async (type: number) => {
		await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
				vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
					vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
						const qis = await newCodeSnapshot(context);
						let fileTree = [];

						const t = type;

						const editor = vscode.window.activeTextEditor;
						let code;
						if (editor) {
							const document = editor.document;
							if (t === 1) {
								const selection = editor.selection;
								code = document.getText(selection);
							}
							else if (t === 2) {
								code = document.getText();
							}
							else if (t !== 3) {
								vscode.window.showErrorMessage("Error: Snapshot type not valid");
								return;
							}

							let fileName = document.fileName;

							if (rootPath) {
								fileTree = generateFileTree(rootPath, 0, false, fileName, t);
							}
							else {
								vscode.window.showErrorMessage("Error: File tree could not be captured");
								return;
							}

							if (!code && t !== 3) {
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
								let scripts: Script[] = [];
								const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
								if (terminals.length <= 0) {
									vscode.window.showWarningMessage('No terminals found, cannot run copy');
									return;
								}
								vscode.env.clipboard.readText().then((text) => {
									let scrts = text.split(new RegExp(/PS C:\\.*>/));
									scrts.shift();
									scrts.forEach((i) => {
										let s = i.replace(new RegExp(/.*PS C:\\.*>/), "").trim();

										if (s && s.trim() !== '') {
											scripts.push(new Script(s.split("\r\n")[0], s));
										}
									});
								});

								//creating snapshot and adding it to the array of snapshots
								if (t === 1) {
									snaps.push(new Snapshot(qis.name, [new Phase(qis.phase, code as string, "", scripts, fileTree, deps)], "code"));
								}
								else if (t === 2) {
									snaps.push(new Snapshot(qis.name, [new Phase(qis.phase, code as string, "", scripts, fileTree, deps)], "file"));
								}
								else if (t === 3) {

								}

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

	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newPhase', async (node: SnapshotItem) => {
		await vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(() => {
			vscode.commands.executeCommand('workbench.action.terminal.selectAll').then(() => {
				vscode.commands.executeCommand('workbench.action.terminal.copySelection').then(() => {
					vscode.commands.executeCommand('workbench.action.terminal.clearSelection').then(async () => {
						const qis = await newCodePhase(context);
						let fileTree = [];
						let t = 0;


						const editor = vscode.window.activeTextEditor;
						let code;
						if (editor) {
							const document = editor.document;
							const selection = editor.selection;

							code = document.getText(selection);
							let fileName = document.fileName;

							if (rootPath) {
								if (node.type === "project") {
									t = 3;
								}

								fileTree = generateFileTree(rootPath, 0, false, fileName, t);
							}
							else {
								vscode.window.showErrorMessage("Error: File tree could not be captured");
								return;
							}

							if (!code) {
								vscode.window.showErrorMessage("Error: No code selected for the new phase");
							}
							else {
								let deps = getDepsInPackageJson(rootPath);

								//get command line scripts
								let scripts: Script[] = [];
								const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
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
											scripts.push(new Script(s.split("\r\n")[0], s));
										}
									});
								});

								//create new phase and push it to the relative snapshot
								node.ref.phases.push(new Phase(qis.phase, code as string, "", scripts, fileTree, deps));

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
			// TODO:
			//   - Need to remove (or handle) backspace
			//   - not sure what to do about carriage return???
			//   - might have some odd output
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

				<button class="new-code-snapshot-button">New Code Snapshot</button>
				<button class="new-file-snapshot-button">New File Snapshot</button>
				<button class="new-project-snapshot-button">New Project Snapshot</button>
				
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

class CommentViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'comment';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri
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
				case 'colorSelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
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
				
				<title>Comments</title>
			</head>
			<body>
				<div id="card" class="card">
					<div class="container">
						<p class="text-box"></p>
					</div>
				</div>

				<form class="addComment">
				</form>
				
				<div class="buttons-row">
					<button id="cancelbtn" class="ghost">Cancel</button>
					<button id="editbtn" class="edit-comment-button">Edit</button>
					<button id="savebtn" class="ghost">Save</button>
				</div>

				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

/*
<div class="card">
	<div class="container">
		<p>Text</p>
	</div>
</div>
<form>
	<input type="text" id="comment" name="comment"><br>
</form>
*/

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// this method is called when your extension is deactivated
export function deactivate() { }