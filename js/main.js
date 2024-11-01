const apiVersion = "1.19.12";
const apiVersionMax = "2.0.0"; // Write support in future
const apiVersionMin = "1.19.12";

const packageFilePath = "/settings.json";
const apiVersionJsonFilePath = "https://rdb.altlinux.org/api/version";
const apiGetPackageInfo = "https://rdb.altlinux.org/api/package/package_info";
const apiGetPackages = "https://rdb.altlinux.org/api/package/find_packageset"

let settings;

async function checkAndParseJson(responseJson, url)
{
    if (!responseJson.ok) {
        throw new TypeError(`Cannot fetch \`${url}\`(${responseJson.status}: ${responseJson.statusText})`);
    }

    const contentType = responseJson.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError(`Invalid \`${url}\`.`);
    }

    return JSON.parse(await responseJson.text());
}

async function fetchSettingsJson() {
    const packageList = await fetch(packageFilePath);
    return await checkAndParseJson(packageList, packageFilePath);
}

async function getApiVersion(){
    const version = await fetch(apiVersionJsonFilePath);
    return (await checkAndParseJson(version, apiVersionJsonFilePath)).version;
}

async function getPackages(settings) {
    let request;
    let packageList;

    if(settings.packages.length === 0){
        return [];
    }

    request = `${apiGetPackages}?packages=${settings.packages[0]}`;

    for (let i = 0; i < settings.packages.length; ++i) {
        request += `,${settings.packages[i]}`;
    }

    if (settings.branches.length !== 0)
    {
        request = `${request}&branches=${settings.branches[0]}`;

        for (let i = 0; i < settings.branches.length; ++i) {
            request += `,${settings.branches[i]}`;
        }
    }

    packageList = await fetch(request);
    return (await checkAndParseJson(packageList, packageFilePath)).packages;
}

function arrayAsString(array){
    if(!array || array.length === 0){
        return "";
    }

    let output = array[0].toString();

    for (let i = 1; i < array.length ; i++){
        output += `, ${array[i]}`;
    }
    return output;
}
function compareBranches(a, b)
{
    if (a.branch === 'sisyphus')
    {
        return -1;
    }
    if (b.branch === 'sisyphus')
    {
        return 1;
    }
    if(a.branch[0] === 'p' && b.branch[0] === 'p')
    {
        let cmp = parseInt(b.branch.slice(1)) - parseInt(a.branch.slice(1));
        if (!isNaN(cmp))
        {
            return cmp;
        }
    }
    return a.branch.localeCompare(b.branch);
}

function addToTable(packages)
{
    let packagesDOMs = document.getElementsByClassName("packages");
    let packagesSettings = [...new Set(settings.packages)];

    for (const packageEl of packagesSettings) {
        const tmp = genRow(packages, packageEl);

        for (let packagesDOM of packagesDOMs) {

            packagesDOM.appendChild(tmp);
        }
    }
    return packages;
}

fetchSettingsJson().then(a => settings = a).then(getPackages).then(addToTable);