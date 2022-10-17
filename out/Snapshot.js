"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Script = exports.FSInstance = exports.Dependency = exports.Phase = exports.Snapshot = void 0;
class Snapshot {
    constructor(title, phases, type) {
        this.title = title;
        this.phases = phases;
        this.type = type;
    }
}
exports.Snapshot = Snapshot;
class Phase {
    constructor(title, code, comment, scripts, files, dependencies) {
        this.title = title;
        this.code = code;
        this.comment = comment;
        this.scripts = scripts;
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
class FSInstance {
    constructor(name, type, fileSnapped, subI) {
        this.name = name;
        this.type = type;
        this.fileSnapshoted = fileSnapped;
        this.subInstances = subI;
    }
}
exports.FSInstance = FSInstance;
class Script {
    constructor(script, output) {
        this.script = script;
        this.output = output;
    }
}
exports.Script = Script;
//# sourceMappingURL=Snapshot.js.map