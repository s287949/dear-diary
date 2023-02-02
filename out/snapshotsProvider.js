"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotItem = exports.DiaryItem = exports.SnapshotsProvider = void 0;
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
        if (element instanceof DiaryItem) {
            return Promise.resolve(this.getSnapshots(element.snapshots, element));
        }
        else if (element instanceof SnapshotItem) {
            return Promise.resolve([]);
        }
        else {
            return Promise.resolve(this.getDiaries(this.context.globalState.get("snaps")));
        }
    }
    getDiaries(diar) {
        if (!diar) {
            return [];
        }
        const toDiary = (diary) => {
            return new DiaryItem(diary, diary.title, diary.snapshots, diary.type, vscode.TreeItemCollapsibleState.Collapsed);
        };
        const diaries = diar
            ? diar.map(snap => toDiary(snap))
            : [];
        return diaries;
    }
    getSnapshots(snapshots, diary) {
        if (!snapshots) {
            return [];
        }
        const toSnapshot = (snap, index) => {
            return new SnapshotItem(snap.title, snap.code, snap.comment, index, snap, diary.title, vscode.TreeItemCollapsibleState.None, {
                command: 'extension.openSnapshot',
                title: '',
                arguments: [snap, diary]
            });
        };
        const s = snapshots
            ? snapshots.map((snap, index) => toSnapshot(snap, index))
            : [];
        return s;
    }
}
exports.SnapshotsProvider = SnapshotsProvider;
class DiaryItem extends vscode.TreeItem {
    constructor(ref, title, snapshots, type, collapsibleState) {
        super(title, collapsibleState);
        this.ref = ref;
        this.title = title;
        this.snapshots = snapshots;
        this.type = type;
        this.collapsibleState = collapsibleState;
        this.iconPath = checkType(this.type);
        this.contextValue = type + "Diary";
    }
}
exports.DiaryItem = DiaryItem;
function checkType(type) {
    if (type === "code") {
        return {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'code.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'code.svg')
        };
    }
    else if (type === "file") {
        return {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'file-code.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'file-code.svg')
        };
    }
    else if (type === "project") {
        return {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg')
        };
    }
}
class SnapshotItem extends vscode.TreeItem {
    constructor(title, code, comment, phaseno, snap, diaryTitle, collapsibleState, command) {
        super(title, collapsibleState);
        this.title = title;
        this.code = code;
        this.comment = comment;
        this.phaseno = phaseno;
        this.snap = snap;
        this.diaryTitle = diaryTitle;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.iconPath = {
            light: path.join(__filename, '..', '..', 'resources', 'light', 'layers.svg'),
            dark: path.join(__filename, '..', '..', 'resources', 'dark', 'layers.svg')
        };
        this.contextValue = "snapshot";
        if (comment !== "" || snap.nComments > 0) {
            this.description = (phaseno + 1).toString() + " - commented";
        }
        else {
            this.description = (phaseno + 1).toString();
        }
    }
}
exports.SnapshotItem = SnapshotItem;
//# sourceMappingURL=snapshotsProvider.js.map