"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.newCodeSnapshot = void 0;
const vscode_1 = require("vscode");
/**
 * A multi-step input using window.createQuickPick() and window.createInputBox().
 *
 * This first part uses the helper class `MultiStepInput` that wraps the API for the multi-step case.
 */
async function newCodeSnapshot(context) {
    async function collectInputs() {
        const state = {};
        await MultiStepInput.run(input => inputSnapshotTitle(input, state));
        return state;
    }
    const title = 'Create New Snapshot';
    async function inputSnapshotTitle(input, state) {
        state.name = await input.showInputBox({
            title,
            step: 1,
            totalSteps: 2,
            value: state.name || '',
            prompt: 'Choose a unique title for the Snapshot',
            validate: validateTitleIsUnique,
            shouldResume: shouldResume
        });
        return (input) => inputPhaseTitle(input, state);
    }
    async function inputPhaseTitle(input, state) {
        state.phase = await input.showInputBox({
            title,
            step: 2,
            totalSteps: 2,
            value: state.phase || '',
            prompt: 'Choose a phase title (optional)',
            validate: validatePhaseTitle,
            shouldResume: shouldResume
        });
    }
    function shouldResume() {
        // Could show a notification with the option to resume.
        return new Promise((resolve, reject) => {
            // noop
        });
    }
    async function validateTitleIsUnique(name) {
        // ...validate...
        await new Promise(resolve => setTimeout(resolve, 1000));
        return name === 'vscode' ? 'Name not unique' : undefined;
    }
    async function validatePhaseTitle(name) {
        return undefined;
    }
    const state = await collectInputs();
    return state;
}
exports.newCodeSnapshot = newCodeSnapshot;
// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------
class InputFlowAction {
}
InputFlowAction.back = new InputFlowAction();
InputFlowAction.cancel = new InputFlowAction();
InputFlowAction.resume = new InputFlowAction();
class MultiStepInput {
    constructor() {
        this.steps = [];
    }
    static async run(start) {
        const input = new MultiStepInput();
        return input.stepThrough(start);
    }
    async stepThrough(start) {
        let step = start;
        while (step) {
            this.steps.push(step);
            if (this.current) {
                this.current.enabled = false;
                this.current.busy = true;
            }
            try {
                step = await step(this);
            }
            catch (err) {
                if (err === InputFlowAction.back) {
                    this.steps.pop();
                    step = this.steps.pop();
                }
                else if (err === InputFlowAction.resume) {
                    step = this.steps.pop();
                }
                else if (err === InputFlowAction.cancel) {
                    step = undefined;
                }
                else {
                    throw err;
                }
            }
        }
        if (this.current) {
            this.current.dispose();
        }
    }
    async showQuickPick({ title, step, totalSteps, items, activeItem, placeholder, buttons, shouldResume }) {
        const disposables = [];
        try {
            return await new Promise((resolve, reject) => {
                const input = vscode_1.window.createQuickPick();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.placeholder = placeholder;
                input.items = items;
                if (activeItem) {
                    input.activeItems = [activeItem];
                }
                input.buttons = [
                    ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                disposables.push(input.onDidTriggerButton(item => {
                    if (item === vscode_1.QuickInputButtons.Back) {
                        reject(InputFlowAction.back);
                    }
                    else {
                        resolve(item);
                    }
                }), input.onDidChangeSelection(items => resolve(items[0])), input.onDidHide(() => {
                    (async () => {
                        reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                    })()
                        .catch(reject);
                }));
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }
    async showInputBox({ title, step, totalSteps, value, prompt, validate, buttons, shouldResume }) {
        const disposables = [];
        try {
            return await new Promise((resolve, reject) => {
                const input = vscode_1.window.createInputBox();
                input.title = title;
                input.step = step;
                input.totalSteps = totalSteps;
                input.value = value || '';
                input.prompt = prompt;
                input.buttons = [
                    ...(this.steps.length > 1 ? [vscode_1.QuickInputButtons.Back] : []),
                    ...(buttons || [])
                ];
                let validating = validate('');
                disposables.push(input.onDidTriggerButton(item => {
                    if (item === vscode_1.QuickInputButtons.Back) {
                        reject(InputFlowAction.back);
                    }
                    else {
                        resolve(item);
                    }
                }), input.onDidAccept(async () => {
                    const value = input.value;
                    input.enabled = false;
                    input.busy = true;
                    if (!(await validate(value))) {
                        resolve(value);
                    }
                    input.enabled = true;
                    input.busy = false;
                }), input.onDidChangeValue(async (text) => {
                    const current = validate(text);
                    validating = current;
                    const validationMessage = await current;
                    if (current === validating) {
                        input.validationMessage = validationMessage;
                    }
                }), input.onDidHide(() => {
                    (async () => {
                        reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
                    })()
                        .catch(reject);
                }));
                if (this.current) {
                    this.current.dispose();
                }
                this.current = input;
                this.current.show();
            });
        }
        finally {
            disposables.forEach(d => d.dispose());
        }
    }
}
//# sourceMappingURL=multiStepInput.js.map