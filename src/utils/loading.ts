import {
    Configuration,
    PackageApi,
    SiteApi,
    SitePackageVersionsElementModel,
    SiteSourcePackagesVersionsModel
} from "../rdb";
import {TableGroupConfig} from "../blocks/TableGroup";

let configuration: Configuration = new Configuration({basePath: "https://rdb.altlinux.org/api"});
let packageApiInstance: PackageApi = new PackageApi(configuration);
let siteApiInstance: SiteApi = new SiteApi(configuration);

export class SearchResultElement {
    name: string = "";
    sisyphus: string = "";
}

export type LoadingState = void;

export async function findPackage(packageName: string, neededBranches?: Set<string>): Promise<SearchResultElement[]> {
    let name = packageName.split(" ").filter(a => a.length > 0);
    let findPackageResponse;
    try {
        findPackageResponse = await siteApiInstance.getRoutePackagesetFindPackagesSiteFindPackages(name);
    } catch (error) {
        console.error(error);
        console.error(`Failed to find package "${packageName}" with prompt "${name}"`);
        return [];
    }

    if (findPackageResponse.status !== 200 || findPackageResponse.data.packages === undefined) {
        return [];
    }

    let packages = findPackageResponse.data.packages;

    if (neededBranches !== undefined) {
        packages = packages.filter(a => {
            if (a.versions === undefined) {
                return false;
            }

            for (const branch of a.versions) {
                // @ts-ignore
                if (neededBranches.has(branch.branch)) {
                    return true;
                }
            }
            return false;
        });
    }

    return packages.map(a => {
        let result = new SearchResultElement();
        let sisyphus: SitePackageVersionsElementModel | undefined;
        if (a.name === undefined) {
            throw new Error(`Failed to find package with next prompt "${packageName}"`);
        }
        result.name = a.name;

        if (a.versions !== undefined) {
            sisyphus = a.versions.find(b =>
                b.branch === "sisyphus"
            );
            if (sisyphus !== undefined && sisyphus.version !== undefined) {
                result.sisyphus = sisyphus.version;
                if (sisyphus.release !== undefined) {
                    result.sisyphus += "-" + sisyphus.release;
                }
            }
        }
        return result;
    });
}

export async function fetchAllSourcePackages(packages: string[], branches: string[]): Promise<Map<string, SiteSourcePackagesVersionsModel>> {
    let models: Map<string, SiteSourcePackagesVersionsModel>;
    let findPackageSetResponse = await packageApiInstance.getRouteFindPackagesetPackageFindPackageset(packages, branches);

    if (findPackageSetResponse.status !== 200 || findPackageSetResponse.data.packages === undefined) {
        throw new Error(`Failed to get source packages versions for ${packages}`);
    }

    models = new Map<string, SiteSourcePackagesVersionsModel>(packages.map(a => {
        let package_version: Array<SitePackageVersionsElementModel> | undefined = findPackageSetResponse.data.packages?.filter(b => {
            return b.sourcepkgname === a;
        }).map(b => {
            return new class implements SitePackageVersionsElementModel {
                branch?: string = b.branch;
                version?: string = b.version;
                release?: string = b.release;
                pkghash?: string = "";
                deleted?: boolean = false;
            }();
        });

        if (package_version === undefined) {
            throw new Error("Unexpected error while fetching data.");
        }
        return [a, new class implements SiteSourcePackagesVersionsModel {
            request_args: object = {};
            versions: Array<SitePackageVersionsElementModel> | undefined = package_version;
        }()];
    }));

    return models;
}

export function saveAs(text: string, filename: string) {
    const blob = new Blob([text], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);
}

export function loadConfig(): TableGroupConfig {
    let config = new TableGroupConfig(() => {
    }, () => {
    }, () => {
    }, () => {
    });
    let str = localStorage.getItem("config");

    if (!str) {
        return config;
    }

    let json = JSON.parse(str);

    config.packages = json.packages;
    config.tab = json.tab;

    return config;
}