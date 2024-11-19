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
        this.branch = "";
        this.pkgset_datetime = "";
        this.sourcepkgname = "";
        this.packages = [];
        this.version = "";
        this.release = "";
        this.disttag = "";
        this.packager_email = "";
        this.buildtime = "";
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
        return yield checkAndParseJson(settings, packageFilePath);
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
            map.set(packageEl.branch, [...curr, packageEl].sort((a, b) => {
                return a.sourcepkgname.localeCompare(b.sourcepkgname);
            }));
        }
    }
    return map;
}
function genTable(packages) {
    let packagesDOM = document.getElementsByClassName("packages");
    for (let packageDOM of packagesDOM) {
        packages.forEach((packages, branch) => {
            let tmp = genRow(packages, branch);
            packageDOM.append(tmp);
        });
    }
    return packages;
}
function genCheckboxes(branches) {
    let navbarDOM = document.getElementsByClassName("navbar-brand")[0];
    for (let branch of branches) {
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
    .then(a => getPackages(a.packages, a.branches))
    .then(a => genTable(packageByBranch(a)))
    .then(a => genCheckboxes(Array.from(a.keys())));
//# sourceMappingURL=main.js.map