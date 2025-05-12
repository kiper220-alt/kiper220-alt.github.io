import * as rdb from "$rdb/";

let configuration: rdb.Configuration = new rdb.Configuration({basePath: "https://rdb.altlinux.org/api"});
let packageApiInstance: rdb.PackageApi = new rdb.PackageApi(configuration);
let siteApiInstance: rdb.SiteApi = new rdb.SiteApi(configuration);

export class FindResultElement {
    name: string | null = null;
    version: string | null = null;
    description: string | null = null;
    deleted: boolean | null = null;
}

export async function findPackage(packageName: string): Promise<FindResultElement[]> {
    let name = packageName.split(" ").filter(a => a.length > 0);
    let findPackageResponse: SiteFingPackagesModel;

    findPackageResponse = await siteApiInstance.getRoutePackagesetFindPackagesSiteFindPackages({name: name});

    if (!findPackageResponse.packages || !findPackageResponse.length || findPackageResponse.packages.length === 0) {
        return [];
    }

    let packages = findPackageResponse.packages;
    let result: FindResultElement[] = [];

    for (let a of packages) {
        if (result.length === 5) {
            break;
        }
        if (!a.name || !a.versions) {
            throw new Error(`Error while fetching data for "${packageName}"`);
        }
        let tmp = new FindResultElement();
        const index = a.versions.findIndex(a => a.branch == "sisyphus");

        let version;
        let release;
        let sisyphus;
        let description: string = "";
        let deleted = false;

        if (index === -1) {
            version = "-";
            release = "";
            sisyphus = "-";
            deleted = true;
        } else {
            version = a.versions[index].version;
            release = a.versions[index].release;
            sisyphus = version + "-" + release;
            if (a.versions[index].deleted !== undefined) {
                deleted = a.versions[index].deleted;
            }
            if (a.summary) {
                description = a.summary;
            }
        }

        tmp.name = a.name;
        tmp.version = sisyphus ? sisyphus : null;
        tmp.description = description;
        tmp.deleted = deleted;
        result.push(tmp);
    }

    return result;
}
