"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FSInstance = exports.Resource = exports.Snapshot = exports.Diary = void 0;
class Diary {
    constructor(title, phases, type) {
        this.title = title;
        this.snapshots = phases;
        this.type = type;
    }
}
exports.Diary = Diary;
class Snapshot {
    constructor(title, code, comment, scripts, files, dependencies) {
        this.title = title;
        this.code = code;
        this.comment = comment;
        this.scripts = scripts;
        this.files = files;
        this.dependencies = dependencies;
    }
}
exports.Snapshot = Snapshot;
class Resource {
    constructor(module, version, type) {
        this.moduleOrCommand = module;
        this.versionOrOutput = version;
        this.type = type;
    }
}
exports.Resource = Resource;
class FSInstance {
    constructor(name, type, fileSnapped, snap, subI) {
        this.name = name;
        this.type = type;
        this.fileSnapshoted = fileSnapped;
        this.snap = snap;
        this.subInstances = subI;
    }
}
exports.FSInstance = FSInstance;
//# sourceMappingURL=Snapshot.js.map