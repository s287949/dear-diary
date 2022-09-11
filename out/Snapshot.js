"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.Phase = exports.Snapshot = void 0;
class Snapshot {
    constructor(title, phases, type) {
        this.title = title;
        this.phases = phases;
        this.type = type;
    }
}
exports.Snapshot = Snapshot;
class Phase {
    constructor(title, code, comment, files, dependencies) {
        this.title = title;
        this.code = code;
        this.comment = comment;
        this.files = files;
        this.dependencies = dependencies;
    }
}
exports.Phase = Phase;
class Dependency {
    constructor(module, version) {
        this.module = module;
        this.version = version;
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=Snapshot.js.map