// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { newCodeSnapshot } from './multiStepInputNewSnapshot';
import { newCodePhase } from './multiStepInputNewPhase';
import { DepNodeProvider } from './dependenciesProvider';
import { SnapshotsProvider } from './snapshotsProvider';
import { FilesNodeProvider } from './filesProvider';
import { Snapshot, Phase } from './Snapshot';
import { getDepsInPackageJson } from './dependenciesCatcher';
import { fileURLToPath } from 'url';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	//Show dependencies in the Dependencies view
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	//Providing Snapshots to the relative view
	const snapshotsProvider = new SnapshotsProvider(context);
	vscode.window.registerTreeDataProvider('snapshots', snapshotsProvider);
	vscode.commands.registerCommand('dear-diary.refreshSnapshots', () => snapshotsProvider.refresh());
	vscode.commands.registerCommand('extension.openPhase', phase => {
		const nodeDependenciesProvider = new DepNodeProvider(phase.dependencies!);
		vscode.window.registerTreeDataProvider('dependencies', nodeDependenciesProvider);
		const nodeFilesProvider = new FilesNodeProvider(phase.files!);
		vscode.window.registerTreeDataProvider('files', nodeFilesProvider);
	});



	//New code snapshot command impelementation
	const provider = new NewSnapshotsViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(NewSnapshotsViewProvider.viewType, provider));

	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.new-code-snapshot', async () => {
		const qis = await newCodeSnapshot(context);

		//vscode.commands.executeCommand("comment.focus");

		const editor = vscode.window.activeTextEditor;
		let code;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			code = document.getText(selection);
			let file = document.fileName.split('\\').at(-1);
			let files = Array(file!);
			

			if (!code) {
				vscode.window.showErrorMessage("Error: No code selected for the snapshot");
			}
			else {
				context.globalState.update("snaps", []);
				let snaps: Array<Snapshot> | undefined = context.globalState.get("snaps");
				if (!snaps) {
					context.globalState.update("snaps", []);
					snaps = [];
				}

				//Hard creating the snapshot: future version the phase should be pushed in the phases array of Snapshot
				let deps = getDepsInPackageJson(rootPath);
				snaps.push(new Snapshot(qis.name, [new Phase(qis.phase, code as string, "", files, deps)], "code"));

				context.globalState.update("snaps", snaps);
				vscode.commands.executeCommand("dear-diary.refreshSnapshots");
			}
		}
		else {
			vscode.window.showErrorMessage("Error: Editor not present");
		}
	}));
	context.subscriptions.push(vscode.commands.registerCommand('dear-diary.newPhase', async () => {
		const qis = await newCodePhase(context);

		const editor = vscode.window.activeTextEditor;
		let code;
		if (editor) {
			const document = editor.document;
			const selection = editor.selection;

			code = document.getText(selection);
			let file = document.fileName.split('\\').at(-1);
			let files = Array(file!);
			

			if (!code) {
				vscode.window.showErrorMessage("Error: No code selected for the new phase");
			}
			else {
				let deps = getDepsInPackageJson(rootPath);
				snapshotsProvider.addPhase(new Phase(qis.phase, code as string, "", files, deps));

				vscode.commands.executeCommand("dear-diary.refreshSnapshots");
			}
		}
		else {
			vscode.window.showErrorMessage("Error: Editor not present");
		}
	}));

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
						vscode.commands.executeCommand("dear-diary.new-code-snapshot");
						break;
					}
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

/*function updateSnapshotList(snapshots){

}*/

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


/*TODO:
*-ripulire media/main.js
*-ripulire extension.ts


*/