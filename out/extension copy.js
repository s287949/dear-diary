"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode_1 = require("vscode");
const basicInput_1 = require("./basicInput");
const multiStepInput_1 = require("./multiStepInput");
const quickOpen_1 = require("./quickOpen");
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('samples.quickInput', async () => {
        const options = {
            showQuickPick: basicInput_1.showQuickPick,
            showInputBox: basicInput_1.showInputBox,
            multiStepInput: multiStepInput_1.multiStepInput,
            quickOpen: quickOpen_1.quickOpen,
        };
        const quickPick = vscode_1.window.createQuickPick();
        quickPick.items = Object.keys(options).map(label => ({ label }));
        quickPick.onDidChangeSelection(selection => {
            if (selection[0]) {
                options[selection[0].label](context)
                    .catch(console.error);
            }
        });
        quickPick.onDidHide(() => quickPick.dispose());
        quickPick.show();
    }));
}
exports.activate = activate;
//# sourceMappingURL=extension%20copy.js.map