//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();
    
    document.querySelector('.edit-comment-button').addEventListener('click', () => {
        vscode.postMessage({ type: 'edit-comment' });
    });

    document.querySelector('.');
    

    // Handle messages sent from the extension to the webview
    /*window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'newSnapshot':
                {
                    break;
                }
        }
    });*/
}());


