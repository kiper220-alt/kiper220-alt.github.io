var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Settings {
    constructor() {
        this.branches = [];
        this.packages = [];
    }
}
class SettingsFile {
    constructor() {
        this.default = "";
        this.configurations = new Map;
    }
}
class RDBVersion {
    constructor() {
        this.name = "noname";
        this.version = "0.0.0";
        this.description = "version";
    }
}
// @ts-ignore
class Package {
    constructor() {
        this.branch = "-";
        this.pkgset_datetime = "-";
        this.sourcepkgname = "-";
        this.packages = [];
        this.version = "-";
        this.release = "-";
        this.disttag = "-";
        this.packager_email = "-";
        this.buildtime = "-";
        this.archs = [];
    }
}
class PackageSet {
    constructor() {
        this.length = 0;
        this.packages = [];
    }
}
const apiVersion = "1.19.12";
const apiVersionMax = "2.0.0"; // Write support in future
const apiVersionMin = "1.19.12";
const packageFilePath = "/settings.json";
const apiVersionJsonFilePath = "https://rdb.altlinux.org/api/version";
const apiGetPackageInfo = "https://rdb.altlinux.org/api/package/package_info";
const apiGetPackages = "https://rdb.altlinux.org/api/package/find_packageset";
const currentConfig = (new URLSearchParams(document.location.search)).get("cur_conf");
let settings;
function checkAndParseJson(responseJson, url) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!responseJson.ok) {
            throw new URIError(`Cannot fetch \`${url}\`(${responseJson.status}: ${responseJson.statusText})`);
        }
        const contentType = responseJson.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            throw new TypeError(`Invalid \`${url}\`.`);
        }
        return yield responseJson.json();
    });
}
function fetchSettingsJson() {
    return __awaiter(this, void 0, void 0, function* () {
        const settings = yield fetch(packageFilePath, { cache: "no-cache" });
        let file = yield checkAndParseJson(settings, packageFilePath);
        let result = undefined;
        if (currentConfig !== undefined) {
            result = file.configurations[currentConfig];
        }
        if (result === undefined) {
            result = file.configurations[file.default];
            if (result === undefined) {
                throw new EvalError("cannot get `default` configuration. Invalid `settings.json`");
            }
        }
        result.packages = result.packages.sort((a, b) => {
            return -a.localeCompare(b);
        });
        return result;
    });
}
function getApiVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        const version = yield fetch(apiVersionJsonFilePath, { cache: "no-cache" });
        return (yield checkAndParseJson(version, packageFilePath)).version;
    });
}
function getPackages(packages, branches) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = apiGetPackages;
        let packageSet;
        if (packages.length === 0) {
            return [];
        }
        url += "?packages=" + packages.join(",");
        if (branches.length !== 0) {
            url += "&branches=" + branches.join(",");
        }
        packageSet = yield fetch(url, { cache: "no-cache" });
        return (yield checkAndParseJson(packageSet, url)).packages;
    });
}
function packageByBranch(packages) {
    let map = new Map();
    for (let packageEl of packages) {
        let curr = map.get(packageEl.branch);
        if (!curr) {
            map.set(packageEl.branch, [packageEl]);
        }
        else {
            map.set(packageEl.branch, [...curr, packageEl]);
        }
    }
    return map;
}
function fillMissingPackages(target) {
    let result = [];
    console.log(settings);
    for (let branch of settings.branches) {
        for (let packageEl of settings.packages) {
            let config = target.find(a => {
                return a.sourcepkgname == packageEl && a.branch == branch;
            });
            if (!config) {
                config = new Package();
                config.sourcepkgname = packageEl;
                config.branch = branch;
            }
            result = [config, ...result];
        }
    }
    return result;
}
function genTable(packages) {
    let packagesDOM = document.getElementsByClassName("packages");
    for (let packageDOM of packagesDOM) {
        for (let branch of settings.branches) {
            let tmp = genRow(packages.get(branch), branch);
            packageDOM.append(tmp);
        }
    }
    return packages;
}
function genCheckboxes(branches) {
    let navbarDOM = document.getElementsByClassName("navbar-brand")[0];
    for (let branch of branches.slice().reverse()) {
        let label = document.createElement("label");
        label.classList.add("checkbox-btn");
        label.innerHTML =
            `<input type="checkbox" value="false" onchange="branchVisible(this.checked, '${branch}')" checked/>` +
                `<span>${branch}</span>`;
        navbarDOM.append(label);
    }
}
function branchVisible(visibility, branch) {
    let packageDOM = document.getElementById("branch-" + branch);
    if (!packageDOM) {
        console.error(`Iternal Error. Unknown branch with name \`${branch}\``);
        return;
    }
    if (visibility) {
        packageDOM.classList.remove("hidden");
        return;
    }
    packageDOM.classList.add("hidden");
}
fetchSettingsJson()
    .then(a => settings = a)
    .then(a => getPackages(a.packages, a.branches))
    .then(fillMissingPackages)
    .then(a => genTable(packageByBranch(a)))
    .then(a => genCheckboxes(Array.from(a.keys())));
//# sourceMappingURL=main.js.map