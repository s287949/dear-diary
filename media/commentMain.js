//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#editbtn').addEventListener('click', () => {
        editComment();
    });

    let comment="";

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'comment':
                {
                    const com = document.querySelector('.text-box');
                    if(message.comment!==""){
                        com.textContent = message.comment;
                        comment = message.comment;
                    }
                    else {
                        com.textContent = "";
                    }
                    
                    document.querySelector('#editbtn').className = "edit-comment-button"; 
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
        input.textContent = comment;
        frm?.appendChild(input);
        input.addEventListener('change', (e) => {
            const value = e.target.value;
            comment = value;
        });

        //edit button disappears and save and cancel buttons appear
        const editButton = document.querySelector('#editbtn');
        const saveButton = document.querySelector('#savebtn');
        const cancelButton = document.querySelector('#cancelbtn');
        cancelButton.className = "cancel-button";
        editButton.className = "ghost";
        saveButton.className = "edit-comment-button";

        cancelButton.addEventListener('click', () => {
            cancelComment(editButton, cancelButton, saveButton, crd, input);
        });

        saveButton.addEventListener('click', () => {
            saveComment(editButton, cancelButton, saveButton, crd, input);
        });

    }

    function cancelComment(editB, cancelB, saveB, c, inp){
        editB.className = "edit-comment-button";
        cancelB.className = "ghost";
        saveB.className = "ghost";
        c.className = "card";
        inp.className = "ghost";
    }

    function saveComment(editB, cancelB, saveB, c, inp){
        vscode.postMessage({ type: 'saveComment', value: comment });
        const com = document.querySelector('.text-box');
        com.textContent = comment;
        editB.className = "edit-comment-button";
        cancelB.className = "ghost";
        saveB.className = "ghost";
        c.className = "card";
        inp.className = "ghost";
    }
}());


