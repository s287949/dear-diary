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

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'comment':
                {
                    document.querySelector('#savebtn').className = "ghost";
                    document.querySelector('#cancelbtn').className = "ghost";
                    document.querySelector('#card').className = "card";
                    document.querySelector('#comment-box').className = "ghost";
                    document.querySelector('#file-comments').className = "ghost";
                    document.querySelector('#bRow').className = "buttons-row";

                    if (message.relatedData.snap) {
                        type = "snapshot";
                        var snap = message.relatedData.snap;
                        openSnap = snap.title;
                        var dTitle = message.relatedData.diaryTitle;
                        openDiary = dTitle;
                        var coms = message.relatedData.coms;
                        vscode.setState({ scripts: coms.scripts, files: coms.files, dependencies: coms.dependencies });
                        const lab = document.querySelector('#label');
                        lab.textContent = "Snapshot: " + snap.title;
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "";
                        var lists = document.querySelector('#lists');
                        lists.className = "";
                        const com = document.querySelector('.text-box');
                        if (snap.comment !== "") {
                            com.textContent = snap.comment;
                            comment = snap.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }

                        prepareLists(coms.dependencies, coms.files, coms.scripts);
                        document.querySelector('#editbtn').className = "edit-comment-button";
                    }
                    else if (message.relatedData.type === "dependency") {
                        type = "dependency";
                        const lab = document.querySelector('#label');
                        lab.textContent = "Snapshot: " + message.relatedData.snapT;

                        var lists = document.querySelector('#lists');
                        lists.className = "ghost";
                        var res = message.relatedData.res; //Resource
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
                        document.querySelector('#editbtn').className = "edit-comment-button";
                    }
                    else if (message.relatedData.type === "script") {
                        type = "script";
                        const lab = document.querySelector('#label');
                        lab.textContent = "Snapshot: " + message.relatedData.snapT;

                        var lists = document.querySelector('#lists');
                        lists.className = "ghost";
                        var res = message.relatedData.res; //Resource
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
                        document.querySelector('#editbtn').className = "edit-comment-button";
                    }
                    else if (message.relatedData.type === "file") {
                        type = "file";
                        const lab = document.querySelector('#label');
                        lab.textContent = "Snapshot: " + message.relatedData.snapT;

                        var lists = document.querySelector('#lists');
                        lists.className = "ghost";
                        var res = message.relatedData.res; //FSInstance
                        const sublab = document.querySelector('#sublabel');
                        sublab.textContent = "File: " + res.name;

                        let ca = document.querySelector("#card");
                        ca.className = "ghost";
                        let br = document.querySelector("#bRow");
                        br.className = "ghost";

                        document.querySelector('#file-comments').className = "";
                        const coml = document.querySelector('#file-com-list');
                        coml.className = "";
                        const del = document.querySelector('#delfile');
                        coml?.removeChild(del);
                        del?.remove();
                        const newdel = document.createElement('div');
                        newdel.id = "delfile";
                        coml?.appendChild(newdel);

                        //list previous added comments
                        if (res.comment.length > 0) {
                            res.comment.forEach(function (co, ind) {
                                let edCom = co;
                                const li = document.createElement('li');
                                const comDiv = document.createElement('div');
                                comDiv.className = "comment-card";

                                li.appendChild(comDiv);
                                li.className = "comment-padding";

                                //create and prepare card with comment
                                const comCard = document.createElement('div');
                                comCard.className = 'card';
                                const comContainer = document.createElement('div');
                                comContainer.className = 'container';
                                const comTextBox = document.createElement('pre');
                                comTextBox.className = 'text-box';
                                comContainer.appendChild(comTextBox);
                                comCard.appendChild(comContainer);
                                comTextBox.textContent = co;

                                const comForm = document.createElement('form');
                                const comButtons = document.createElement('div');
                                comButtons.className = 'buttons-row';
                                const comCancelBtn = document.createElement('button');
                                comCancelBtn.textContent = "Cancel";
                                comCancelBtn.className = "ghost";
                                const comEditBtn = document.createElement('button');
                                comEditBtn.textContent = "Edit";
                                comEditBtn.className = "edit-comment-button";
                                const comSaveBtn = document.createElement('button');
                                comSaveBtn.textContent = "Save";
                                comSaveBtn.className = "ghost";

                                comEditBtn.addEventListener('click', () => {
                                    //card disappears
                                    comCard.className = "ghost";
                                    var prevScrCom = edCom;

                                    //input text box for editing the comment appears
                                    const input = document.createElement('textarea');
                                    input.rows = 10;
                                    input.textContent = co;
                                    comForm?.appendChild(input);
                                    input.addEventListener('change', (e) => {
                                        const value = e.target.value;
                                        edCom = value;
                                    });

                                    //edit button disappears and save and cancel buttons appear
                                    comCancelBtn.className = "cancel-button";
                                    comEditBtn.className = "ghost";
                                    comSaveBtn.className = "edit-comment-button";

                                    comCancelBtn.addEventListener('click', () => {
                                        edCom = prevScrCom;
                                        cancelComment(comEditBtn, comCancelBtn, comSaveBtn, comCard, input);
                                    });

                                    comSaveBtn.addEventListener('click', () => {
                                        prevScrCom = edCom;
                                        saveOtherComment(comEditBtn, comCancelBtn, comSaveBtn, comTextBox, comCard, input, "file", edCom, ind, li);
                                    });
                                });

                                comButtons.appendChild(comCancelBtn);
                                comButtons.appendChild(comEditBtn);
                                comButtons.appendChild(comSaveBtn);

                                //add everything to comDiv appended to li
                                comDiv.appendChild(comCard);
                                comDiv.appendChild(comForm);
                                comDiv.appendChild(comButtons);

                                newdel?.appendChild(li);

                            });
                        }


                        //new comment section
                        let nCom = "";
                        const newComDiv = document.createElement('div');

                        const newComForm = document.createElement('form');
                        const newInput = document.createElement('textarea');
                        newInput.rows = 10;
                        newInput.textContent = "";
                        newComForm.appendChild(newInput);
                        newInput.addEventListener('change', (e) => {
                            const value = e.target.value;
                            nCom = value;
                        });

                        const newComButtons = document.createElement('div');
                        newComButtons.className = 'buttons-row';
                        const newComSaveBtn = document.createElement('button');
                        newComSaveBtn.textContent = "Save";
                        newComSaveBtn.className = "edit-comment-button";
                        newComButtons.appendChild(newComSaveBtn);

                        newComSaveBtn.addEventListener('click', () => {
                            if (nCom !== "") {
                                vscode.postMessage({ type: 'saveNewComment', com: nCom });
                            }
                        });

                        newComDiv.appendChild(newComForm);
                        newComDiv.appendChild(newComButtons);

                        newdel?.appendChild(newComDiv);
                        /////////
                        /*const com = document.querySelector('.text-box');
                        if (res.comment !== "") {
                            com.textContent = res.comment;
                            comment = res.comment;
                        }
                        else {
                            com.textContent = "";
                            comment = "";
                        }*/
                    }
                    break;
                }
        }
    });

    function editComment() {
        //card disappears
        const crd = document.querySelector('.card');
        crd.className = "ghost";
        var prevCom = comment;

        //input text box for editing the comment appears
        const frm = document.querySelector('#comment-box');
        frm.className = "";
        //delete previous text area
        const previnput = document.querySelector('#input-area');
        frm?.removeChild(previnput);
        previnput?.remove();
        //create new text area and append it to form
        const input = document.createElement('textarea');
        input.id = "input-area";
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
            comment = prevCom;
            cancelComment(editButton, cancelButton, saveButton, crd, input);
        });

        saveButton.addEventListener('click', () => {
            prevCom = comment;
            saveComment(editButton, cancelButton, saveButton, crd, input);
        });
    }

    function prepareLists(dependencies, files, scripts) {
        //create scripts list
        if (scripts.length > 0) {
            const sList = document.querySelector('#scripts-list');
            sList.className = "";
            const slabel = document.querySelector('#scripts-label');
            slabel.className = "subtitle-padding";
            const del = document.querySelector('#del1');
            sList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del1";
            sList?.appendChild(newdel);

            scripts.forEach(function (scr, index) {
                let scom = scr.comment;
                const li = document.createElement('li');
                const comCard = document.createElement('div');
                comCard.className = "comment-card";

                const title = document.createElement('h3');
                title.textContent = scr.moduleOrCommand;
                comCard.appendChild(title);
                li.appendChild(comCard);
                li.className = "comment-padding";

                //create and prepare card with comment
                const scriptCard = document.createElement('div');
                scriptCard.className = 'card';
                const scriptContainer = document.createElement('div');
                scriptContainer.className = 'container';
                const scriptTextBox = document.createElement('pre');
                scriptTextBox.className = 'text-box';
                scriptContainer.appendChild(scriptTextBox);
                scriptCard.appendChild(scriptContainer);
                scriptTextBox.textContent = scr.comment;

                //create and prepare comment-box and cancel/save/edit buttons
                /*const scriptForm = document.createElement('form');
                const scriptButtons = document.createElement('div');
                scriptButtons.className = 'buttons-row';
                const scriptCancelBtn = document.createElement('button');
                scriptCancelBtn.textContent = "Cancel";
                scriptCancelBtn.className = "ghost";
                const scriptEditBtn = document.createElement('button');
                scriptEditBtn.textContent = "Edit";
                scriptEditBtn.className = "edit-comment-button";
                const scriptSaveBtn = document.createElement('button');
                scriptSaveBtn.textContent = "Save";
                scriptSaveBtn.className = "ghost";

                scriptEditBtn.addEventListener('click', () => {
                    //card disappears
                    scriptCard.className = "ghost";
                    var prevScrCom = scom;

                    //input text box for editing the comment appears
                    const input = document.createElement('textarea');
                    input.rows = 10;
                    input.textContent = scr.comment;
                    scriptForm?.appendChild(input);
                    input.addEventListener('change', (e) => {
                        const value = e.target.value;
                        scom = value;
                    });

                    //edit button disappears and save and cancel buttons appear
                    scriptCancelBtn.className = "cancel-button";
                    scriptEditBtn.className = "ghost";
                    scriptSaveBtn.className = "edit-comment-button";

                    scriptCancelBtn.addEventListener('click', () => {
                        scom = prevScrCom;
                        cancelComment(scriptEditBtn, scriptCancelBtn, scriptSaveBtn, scriptCard, input);
                    });

                    scriptSaveBtn.addEventListener('click', () => {
                        prevScrCom = scom;
                        saveOtherComment(scriptEditBtn, scriptCancelBtn, scriptSaveBtn, scriptTextBox, scriptCard, input, "script", scom, index, li);
                    });
                });

                scriptButtons.appendChild(scriptCancelBtn);
                scriptButtons.appendChild(scriptEditBtn);
                scriptButtons.appendChild(scriptSaveBtn);*/

                //add everything to li
                comCard.appendChild(scriptCard);
                //li.appendChild(scriptForm);
                //li.appendChild(scriptButtons);

                newdel?.appendChild(li);
            });
        }
        else {
            const sList = document.querySelector('#scripts-list');
            const slabel = document.querySelector('#scripts-label');
            const del = document.querySelector('#del1');
            sList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del1";
            sList?.appendChild(newdel);
            sList.className = "ghost";
            slabel.className = "ghost";
        }
        //create files list
        if (files.length > 0) {
            const fList = document.querySelector('#files-list');
            fList.className = "";
            const flabel = document.querySelector('#files-label');
            flabel.className = "subtitle-padding";
            const del = document.querySelector('#del2');
            fList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del2";
            fList?.appendChild(newdel);

            files.forEach(function (fl, index) {
                let fcom = fl.comment;
                const li = document.createElement('li');
                const comCard = document.createElement('div');
                comCard.className = "comment-card";

                const title = document.createElement('h3');
                title.textContent = fl.name;
                comCard.appendChild(title);
                li.appendChild(comCard);
                li.className = "comment-padding";

                fl.comment.forEach(function (c, i) {
                    //create and prepare card with comment
                    const fileCard = document.createElement('div');
                    fileCard.className = 'card';
                    const fileContainer = document.createElement('div');
                    fileContainer.className = 'container';
                    const fileTextBox = document.createElement('pre');
                    fileTextBox.className = 'text-box';
                    fileContainer.appendChild(fileTextBox);
                    fileCard.appendChild(fileContainer);
                    fileTextBox.textContent = c;

                    comCard.appendChild(fileCard);
                });
                


                //create and prepare comment-box and cancel/save/edit buttons
                /*const fileForm = document.createElement('form');
                const fileButtons = document.createElement('div');
                fileButtons.className = 'buttons-row';
                const fileCancelBtn = document.createElement('button');
                fileCancelBtn.textContent = "Cancel";
                fileCancelBtn.className = "ghost";
                const fileEditBtn = document.createElement('button');
                fileEditBtn.textContent = "Edit";
                fileEditBtn.className = "edit-comment-button";
                const fileSaveBtn = document.createElement('button');
                fileSaveBtn.textContent = "Save";
                fileSaveBtn.className = "ghost";

                fileEditBtn.addEventListener('click', () => {
                    //card disappears
                    fileCard.className = "ghost";
                    var prevFilCom = fcom;

                    //input text box for editing the comment appears
                    const input = document.createElement('textarea');
                    input.rows = 10;
                    input.textContent = fl.comment;
                    fileForm?.appendChild(input);
                    input.addEventListener('change', (e) => {
                        const value = e.target.value;
                        fcom = value;
                    });

                    //edit button disappears and save and cancel buttons appear
                    fileCancelBtn.className = "cancel-button";
                    fileEditBtn.className = "ghost";
                    fileSaveBtn.className = "edit-comment-button";

                    fileCancelBtn.addEventListener('click', () => {
                        fcom = prevFilCom;
                        cancelComment(fileEditBtn, fileCancelBtn, fileSaveBtn, fileCard, input);
                    });

                    fileSaveBtn.addEventListener('click', () => {
                        prevFilCom = fcom;
                        saveOtherComment(fileEditBtn, fileCancelBtn, fileSaveBtn, fileTextBox, fileCard, input, "file", fcom, index, li);
                    });
                });

                fileButtons.appendChild(fileCancelBtn);
                fileButtons.appendChild(fileEditBtn);
                fileButtons.appendChild(fileSaveBtn);*/

                //add everything to li
                //comCard.appendChild(fileCard);
                //li.appendChild(fileForm);
                //li.appendChild(fileButtons);

                newdel?.appendChild(li);
            });
        }
        else {
            const fList = document.querySelector('#files-list');
            const flabel = document.querySelector('#files-label');
            const del = document.querySelector('#del2');
            fList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del2";
            fList?.appendChild(newdel);
            fList.className = "ghost";
            flabel.className = "ghost";
        }
        //create dependencies list
        if (dependencies.length > 0) {
            const dList = document.querySelector('#dependencies-list');
            dList.className = "";
            const dlabel = document.querySelector('#dependencies-label');
            dlabel.className = "subtitle-padding";
            const del = document.querySelector('#del3');
            dList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del3";
            dList?.appendChild(newdel);

            dependencies.forEach(function (de, index) {
                let dcom = de.comment;
                const li = document.createElement('li');
                const comCard = document.createElement('div');
                comCard.className = "comment-card";

                const title = document.createElement('h3');
                title.textContent = de.moduleOrCommand;
                comCard.appendChild(title);
                li.appendChild(comCard);
                li.className = "comment-padding";

                //create and prepare card with comment
                const dependencyCard = document.createElement('div');
                dependencyCard.className = 'card';
                const dependencyContainer = document.createElement('div');
                dependencyContainer.className = 'container';
                const dependencyTextBox = document.createElement('pre');
                dependencyTextBox.className = 'text-box';
                dependencyContainer.appendChild(dependencyTextBox);
                dependencyCard.appendChild(dependencyContainer);
                dependencyTextBox.textContent = de.comment;

                //create and prepare comment-box and cancel/save/edit buttons
                /*const dependencyForm = document.createElement('form');
                const dependencyButtons = document.createElement('div');
                dependencyButtons.className = 'buttons-row';
                const dependencyCancelBtn = document.createElement('button');
                dependencyCancelBtn.textContent = "Cancel";
                dependencyCancelBtn.className = "ghost";
                const dependencyEditBtn = document.createElement('button');
                dependencyEditBtn.textContent = "Edit";
                dependencyEditBtn.className = "edit-comment-button";
                const dependencySaveBtn = document.createElement('button');
                dependencySaveBtn.textContent = "Save";
                dependencySaveBtn.className = "ghost";

                dependencyEditBtn.addEventListener('click', () => {
                    //card disappears
                    dependencyCard.className = "ghost";
                    var prevDepCom = dcom;

                    //input text box for editing the comment appears
                    const input = document.createElement('textarea');
                    input.rows = 10;
                    input.textContent = de.comment;
                    dependencyForm?.appendChild(input);
                    input.addEventListener('change', (e) => {
                        const value = e.target.value;
                        dcom = value;
                    });

                    //edit button disappears and save and cancel buttons appear
                    dependencyCancelBtn.className = "cancel-button";
                    dependencyEditBtn.className = "ghost";
                    dependencySaveBtn.className = "edit-comment-button";

                    dependencyCancelBtn.addEventListener('click', () => {
                        dcom = prevDepCom;
                        cancelComment(dependencyEditBtn, dependencyCancelBtn, dependencySaveBtn, dependencyCard, input);
                    });

                    dependencySaveBtn.addEventListener('click', () => {
                        prevDepCom = dcom;
                        saveOtherComment(dependencyEditBtn, dependencyCancelBtn, dependencySaveBtn, dependencyTextBox, dependencyCard, input, "dependency", dcom, index, li);
                    });
                });

                dependencyButtons.appendChild(dependencyCancelBtn);
                dependencyButtons.appendChild(dependencyEditBtn);
                dependencyButtons.appendChild(dependencySaveBtn);*/

                //add everything to li
                comCard.appendChild(dependencyCard);
                //li.appendChild(dependencyForm);
                //li.appendChild(dependencyButtons);

                newdel?.appendChild(li);
            });
        }
        else {
            const dList = document.querySelector('#dependencies-list');
            const dlabel = document.querySelector('#dependencies-label');
            const del = document.querySelector('#del3');
            dList?.removeChild(del);
            del?.remove();
            const newdel = document.createElement('div');
            newdel.id = "del3";
            dList?.appendChild(newdel);
            dList.className = "ghost";
            dlabel.className = "ghost";
        }
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

    function saveOtherComment(editB, cancelB, saveB, textB, card, inp, t, newc, i, li) {
        //vscode.postMessage({ type: 'saveOtherComment', val: { type: t, newCom: newc, index: i } });
        vscode.postMessage({ type: 'saveComment', value: newc, index: i });
        var del;
        var slabel;
        if (t === "script") {
            del = document.querySelector('#del1');
            slabel = document.querySelector('#scripts-label');
        }
        else if (t === "file") {
            del = document.querySelector('#delfile');
            //slabel = document.querySelector('#files-label');
        }
        else if (t === "dependency") {
            del = document.querySelector('#del3');
            slabel = document.querySelector('#dependencies-label');
        }

        textB.textContent = comment;
        cancelB.className = "ghost";
        saveB.className = "ghost";
        if (newc !== "") {
            card.className = "card";
            editB.className = "edit-comment-button";
        }
        else {
            del.removeChild(li);
            li.remove();
        }
        /*if (!del.hasChildNodes()) {
            slabel.className = "ghost";
        }*/
        inp.className = "ghost";
    }
}());


