import type {SiteFingPackagesModel, SiteFingPackagesPackageModel} from "$rdb/";
import { siteApiInstance } from "./api.ts";

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

    let packages: SiteFingPackagesPackageModel[] = findPackageResponse.packages;
    return packages.map(a => {
        if (!a.name || !a.versions) {
            throw new Error(`Error while fetching data for "${packageName}"`);
        }
        let tmp = new FindResultElement();
        const index = a.versions.findIndex(a => a.branch == "sisyphus");

        let sisyphus = "";
        let description: string = "";
        let deleted = false;

        if (index === -1) {
            sisyphus = "-";
            deleted = true;
        } else {
            const version = a.versions[index].version;
            const release = a.versions[index].release;

            if (version && release) {
                sisyphus = version + "-" + release;
            } else if (version || release) {
                // @ts-ignore
                sisyphus = (version ? version : release);
            }

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
        return tmp;
    });
}
