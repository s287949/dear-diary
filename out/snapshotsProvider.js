"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotItem = exports.SnapshotsProvider = void 0;
const vscode = require("vscode");
const path = require("path");
class SnapshotsProvider {
    constructor(context) {
        this.context = context;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (element instanceof SnapshotItem) {
            return Promise.resolve(this.getPhases(element.phases));
        }
        else if (element instanceof PhaseItem) {
            return Promise.resolve([]);
        }
        else {
            return Promise.resolve(this.getSnapshots(this.context.globalState.get("snaps")));
        }
    }
    getSnapshots(snaps) {
        if (!snaps) {
            return [];
        }
        const toSnap = (snap) => {
            return new SnapshotItem(snap, snap.title, snap.phases, snap.type, vscode.TreeItemCollapsibleState.Collapsed);
        };
        const snapshots = snaps
            ? snaps.map(snap => toSnap(snap))
            : [];
        return snapshots;
    }
    getPhases(phases) {
        if (!phases) {
            return [];
        }
        const toPhase = (phase, index) => {
            return new PhaseItem(phase.title, phase.code, phase.comment, index, vscode.TreeItemCollapsibleState.None, {
                command: 'extension.openPhase',
                title: '',
                arguments: [phase]
            });
        };
        const ps = phases
            ? phases.map((phase, index) => toPhase(phase, index))
            : [];
        return ps;
    }
}
exports.SnapshotsProvider = SnapshotsProvider;
class SnapshotItem extends vscode.TreeItem {
    constructor(ref, title, phases, type, collapsibleState) {
        super(title, collapsibleState);
        this.ref = ref;
        this.title = title;
        this.phases = phases;
        this.type = type;
        this.collapsibleState = collapsibleState;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'code.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'code.svg')
        };
        this.contextValue = "snapshot";
    }
}
exports.SnapshotItem = SnapshotItem;
class PhaseItem extends vscode.TreeItem {
    constructor(title, code, comment, phaseno, collapsibleState, command) {
        super(title, collapsibleState);
        this.title = title;
        this.code = code;
        this.comment = comment;
        this.phaseno = phaseno;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'layers.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'layers.svg')
        };
        this.contextValue = "phase";
        this.description = (phaseno + 1).toString();
    }
}
//# sourceMappingURL=snapshotsProvider.js.map