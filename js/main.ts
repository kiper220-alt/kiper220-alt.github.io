class Settings {
    branches: string[] = [];
    packages: string[] = [];

    constructor() {
    }
}

class RDBVersion {
    name: string = "noname";
    version: string = "0.0.0";
    description: string = "version";

    constructor() {
    }
}

// @ts-ignore
class Package {
    branch: string = "-";
    pkgset_datetime: string = "-";
    sourcepkgname: string = "-";
    packages: string[] = [];
    version: string = "-";
    release: string = "-";
    disttag: string = "-";
    packager_email: string = "-";
    buildtime: string = "-";
    archs: string[] = [];

    constructor() {
    }
}

class PackageSet {
    request_args: any;
    length: number = 0;
    packages: Package[] = [];

    constructor() {
    }
}

const apiVersion: string = "1.19.12";
const apiVersionMax: string = "2.0.0"; // Write support in future
const apiVersionMin: string = "1.19.12";

const packageFilePath: string = "/settings.json";
const apiVersionJsonFilePath: string = "https://rdb.altlinux.org/api/version";
const apiGetPackageInfo: string = "https://rdb.altlinux.org/api/package/package_info";
const apiGetPackages: string = "https://rdb.altlinux.org/api/package/find_packageset"

let settings: Settings;

async function checkAndParseJson<Target>(responseJson : Response, url : string) : Promise<Target>
{
    if (!responseJson.ok) {
        throw new URIError(`Cannot fetch \`${url}\`(${responseJson.status}: ${responseJson.statusText})`);
    }

    const contentType = responseJson.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError(`Invalid \`${url}\`.`);
    }

    return await responseJson.json();
}

async function fetchSettingsJson() : Promise<Settings> {
    const settings : Response = await fetch(packageFilePath, {cache: "no-cache"});
    let result = await checkAndParseJson<Settings>(settings, packageFilePath);

    result.packages = result.packages.sort((a: string,b : string) => {
        return a.localeCompare(b);
    });

    return result;
}

async function getApiVersion() : Promise<string> {
    const version : Response = await fetch(apiVersionJsonFilePath, {cache: "no-cache"});
    return (await checkAndParseJson<RDBVersion>(version, packageFilePath)).version;
}

async function getPackages(packages: string[], branches: string[]) : Promise<Package[]> {
    let url: string = apiGetPackages;
    let packageSet: Response;

    if (packages.length === 0) {
        return [];
    }

    url += "?packages=" + packages.join(",");
    if (branches.length !== 0)
    {
        url += "&branches=" + branches.join(",");
    }

    packageSet = await fetch(url, {cache: "no-cache"});
    return (await checkAndParseJson<PackageSet>(packageSet, url)).packages;
}

function packageByBranch(packages: Package[]) : Map<string, Package[]>
{
    let map = new Map<string, Package[]>();

    for (let packageEl of packages) {
        let curr = map.get(packageEl.branch);
        if (!curr) {
            map.set(packageEl.branch, [packageEl]);
        }
        else
        {
            map.set(packageEl.branch, [...curr, packageEl]);
        }
    }

    return map;
}
function fillMissingPackages(target: Package[]): Package[]
{
    let result: Package[] = [];
    console.log(settings);
    for (let branch of settings.branches)
    {
        for (let packageEl of settings.packages)
        {
            let config: Package = target.find(a => {
                return a.sourcepkgname == packageEl && a.branch == branch;
            });

            if (!config)
            {
                config = new Package();
                config.sourcepkgname = packageEl;
                config.branch = branch;
            }
            result = [config, ...result];
        }
    }
    return result;
}

function genTable(packages: Map<string, Package[]>)
{
    let packagesDOM = document.getElementsByClassName("packages");

    for (let packageDOM of packagesDOM) {
        for (let branch of settings.branches)
        {
            let tmp = genRow(packages.get(branch), branch);
            packageDOM.append(tmp);
        }
    }

    return packages;
}

function genCheckboxes(branches : string[])
{
    let navbarDOM = document.getElementsByClassName("navbar-brand")[0];

    for (let branch of branches.slice().reverse())
    {
        let label = document.createElement("label");
        label.classList.add("checkbox-btn");
        label.innerHTML =
            `<input type="checkbox" value="false" onchange="branchVisible(this.checked, '${branch}')" checked/>` +
            `<span>${branch}</span>`;
        navbarDOM.append(label);
    }
}

function branchVisible(visibility : boolean, branch : string)
{
    let packageDOM = document.getElementById("branch-" + branch);
    if (!packageDOM)
    {
        console.error(`Iternal Error. Unknown branch with name \`${branch}\`` );
        return;
    }
    if (visibility)
    {
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