//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#editbtn').addEventListener('click', () => {
        editComment();
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'comment':
                {
                    const com = document.querySelector('.text-box');
                    com.textContent=message.comment;
                    break;
                }
        }
    });

    function editComment() {
        //card disappears
        const crd = document.querySelector('.card');
        crd.className = "ghost";

        //input text box for editing the comment appears
        const frm = document.querySelector('#comment-box');
        const input = document.createElement('textarea');
        input.rows=10;
        frm?.appendChild(input);

        //edit button disappears and save and cancel buttons appear
        const editButton = document.querySelector('#editbtn');
        const saveButton = document.querySelector('#savebtn');
        const cancelButton = document.querySelector('#cancelbtn');
        cancelButton.className = "cancel-button";
        editButton.className = "ghost";
        saveButton.className = "edit-comment-button";

        /*saveButton.addEventListener('click', () => {
            editButton?.className = "edit-comment-button";
            cancelButton?.className = "ghost";
            crd?.className = "card";
            input.className = "ghost";
        });*/

    }
}());


