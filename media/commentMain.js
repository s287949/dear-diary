//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#editbtn').addEventListener('click', () => {
        const frm = document.querySelector('.edit-comment-button');
        if(frm)
            frm.className="ghost";
        
        //editComment();
    });

    // Handle messages sent from the extension to the webview
    /*window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'addColor':
                {
                    addColor();
                    break;
                }
            case 'clearColors':
                {
                    colors = [];
                    updateColorList(colors);
                    break;
                }

        }
    });*/

    
    function editComment() {
        //card disappears
        const crd = document.querySelector('.card');
        crd.className = "ghost";

        const frm = document.querySelector('.addComment');
        const input = document.createElement('input');
        input.type="text";
        input.className = "input-box";
        frm?.appendChild(input);

        /*const editButton = document.querySelector('#editbtn');
        const saveButton = document.querySelector('#savebtn');
        const cancelButton = document.querySelector('#cancelbtn');
        cancelButton.className = "cancel-button";
        editButton.className = "ghost";*/

        /*saveButton.addEventListener('click', () => {
            editButton?.className = "edit-comment-button";
            cancelButton?.className = "ghost";
            crd?.className = "card";
            input.className = "ghost";
        });*/

    }
});