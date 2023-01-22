//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.

(function () {
    const vscode = acquireVsCodeApi();

    document.querySelector('#editbtn').addEventListener('click', () => {
        editComment();
    });

    let comment = "";
    let type = "";
    let openSnap = "";
    let openDiary = "";

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'comment':
                {
                    if (message.relatedData.snap) {
                        type = "snapshot";
                        var snap = message.relatedData.snap;
                        openSnap = snap.title;
                        var dTitle = message.relatedData.diaryTitle;
                        openDiary = dTitle;
                        const lab = document.querySelector('#label');
                        lab.textContent = "Diary/Snapshot: " + dTitle + "/" + snap.title;
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "";
                        const com = document.querySelector('.text-box');
                        if (snap.comment !== "") {
                            com.textContent = snap.comment;
                            comment = snap.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }
                    }
                    else if(message.relatedData.type === "dependency"){
                        type = "dependency";
                        var res = message.relatedData.res; //Resource
                        const lab = document.querySelector('#label');
                        lab.textContent = "Diary/Snapshot: " + openDiary + "/" + openSnap;
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "Dependency: " + res.moduleOrCommand;
                        const com = document.querySelector('.text-box');
                        if (res.comment !== "") {
                            com.textContent = res.comment;
                            comment = res.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }
                    }
                    else if(message.relatedData.type === "script"){
                        type = "script";
                        var res = message.relatedData.res; //Resource
                        const lab = document.querySelector('#label');
                        lab.textContent = "Diary/Snapshot: " + openDiary + "/" + openSnap;
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "Script: " + res.moduleOrCommand;
                        const com = document.querySelector('.text-box');
                        if (res.comment !== "") {
                            com.textContent = res.comment;
                            comment = res.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }
                    }
                    else if(message.relatedData.type === "file"){
                        type = "file";
                        comment = "";
                        var res = message.relatedData.res; //FSInstance
                        const lab = document.querySelector('#label');
                        lab.textContent = "Diary/Snapshot: " + openDiary + "/" + openSnap;
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "File: " + res.name;
                        const com = document.querySelector('.text-box');
                        if (res.comment !== "") {
                            com.textContent = res.comment;
                            comment = res.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }
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
        input.rows = 10;
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

    function cancelComment(editB, cancelB, saveB, c, inp) {
        editB.className = "edit-comment-button";
        cancelB.className = "ghost";
        saveB.className = "ghost";
        c.className = "card";
        inp.className = "ghost";
    }

    function saveComment(editB, cancelB, saveB, c, inp) {
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


