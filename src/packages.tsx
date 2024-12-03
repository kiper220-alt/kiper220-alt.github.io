// import generated OpenAPI from `swagger.json` https://rdb.altlinux.org/api/swagger.json
import {
    Configuration,
    SiteApi,
    PackageApi,
    SiteAllPackagasetsModel,
    SiteSourcePackagesVersionsModel, SiteFingPackagesModel, SitePackageVersionsElementModel
} from "./rdb";
import {ReactElement} from "react";

let configuration: Configuration = new Configuration({basePath: "https://rdb.altlinux.org/api"});
let siteApiInstance: SiteApi = new SiteApi(configuration);
let packageApiInstance: PackageApi = new PackageApi(configuration);

export async function allPkgsets() : Promise<SiteAllPackagasetsModel> {
    let packageSetsResponse = await siteApiInstance.getRouteAllPackagesetsSiteAllPkgsets();

    if (packageSetsResponse.status !== 200 || packageSetsResponse.data.branches === undefined)
    {
        throw new Error(`Failed to get pkgset for ${packageSetsResponse.status}: ${packageSetsResponse.statusText}`);
    }

    return packageSetsResponse.data;
}

export async function sourcePackageVersions(name : string) : Promise<SiteSourcePackagesVersionsModel> {
    let sourcePackageResponse = await siteApiInstance.getRouteSourcePackageVersionsSiteSourcePackageVersions(name);

    if (sourcePackageResponse.status !== 200 || sourcePackageResponse.data.versions === undefined)
    {
        throw new Error(`Failed to get source package versions for ${name}`);
    }

    return sourcePackageResponse.data;
}

export async function fetchAllSourcePackages(packages: string[]) : Promise<Map<string, SiteSourcePackagesVersionsModel>> {
    let models: Map<string, SiteSourcePackagesVersionsModel>;
    let findPackageSetResponse = await packageApiInstance.getRouteFindPackagesetPackageFindPackageset(packages);

    if (findPackageSetResponse.status !== 200 || findPackageSetResponse.data.packages === undefined)
    {
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

        if (package_version === undefined)
        {
            throw new Error("Unexpected error while fetching data.");
        }
        return [a , new class implements SiteSourcePackagesVersionsModel {
            request_args: object = {};
            versions: Array<SitePackageVersionsElementModel> | undefined = package_version;
        }()];
    }));

    return models;
}

export async function findPackage(name: string[], branch? : string, arch? : string) : Promise<SiteFingPackagesModel> {
    let findResult = await siteApiInstance.getRoutePackagesetFindPackagesSiteFindPackages(name, branch, arch);

    if (findResult.status !== 200 || findResult.data.packages === undefined)
    {
        throw new Error(`Failed to find package versions for ${name.join(' ')}`);
    }

    return findResult.data;
}

function makeEmptyVersions(): SiteSourcePackagesVersionsModel
{
    return new class implements SiteSourcePackagesVersionsModel {
        request_args: object = {};
        versions: Array<SitePackageVersionsElementModel> = [];
    }();
}

function makeRow(name: string, id: string, packageSets: string[], packageVersions: SiteSourcePackagesVersionsModel)
{
    return <tr className="w-full hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]" id={id}>
        {
            [
                <td className="text-center w-min text-1xl font-bold p-2 transition-shadow hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]"><a className="block" href={"https://packages.altlinux.org/ru/sisyphus/srpms/" + name} target="_blank" rel="noreferrer">{name}</a></td>,
                ...packageSets.map((packageSet: string) => {
                    let packageVersion = packageVersions.versions?.find((a) => {
                        return a.branch === packageSet;
                    })
                    if (!packageVersion) {
                        return <td className="font-light text-center text-xl p-2">-</td>;
                    }
                    return <td className="text-center text-1xl transition-shadow hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]">
                        <a className="p-2 block" href={"https://packages.altlinux.org/ru/" + packageSet + "/srpms/" +name} target="_blank" rel="noreferrer">
                            {packageVersion.version + '-' + packageVersion.release}
                        </a>
                    </td>;
                })
            ]
        }
    </tr>;
}

export class PackageRow
{
    constructor(name: string, packageSets: string[], packageVersions: SiteSourcePackagesVersionsModel) {
        this.name = name;
        this.id = "row_" + name;
        this.packageSets = packageSets;

        this.rowElement = makeRow(this.name, this.id, this.packageSets, packageVersions);
    }

    fetch(packageVersions: SiteSourcePackagesVersionsModel)
    {
        this.rowElement = makeRow(this.name, this.id, this.packageSets, packageVersions);
    }

    name: string;
    packageSets: string[];
    id: string;
    rowElement: ReactElement<any, any>;
}

export class PackagesTable
{
    constructor(packageSets: string[], packages?: string[])
    {
        this.packageSets = packageSets;
        if (packages)
        {
            this.packages = packages;
        }
        else
        {
            this.packages = [];
        }

        this.packageRows = [];
        if (packages !== undefined)
        {
            packages.forEach((a) => {
                let versions = this.versions.get(a);

                if (!versions)
                {
                    versions = makeEmptyVersions();
                }
                this.packageRows.push(new PackageRow(a, this.packageSets, versions));
            });
        }
    }

    addPackage(name: string) {
        let versions = this.versions.get(name);
        this.packages.push(name);

        if (!versions)
        {
            versions = makeEmptyVersions();
        }
        this.packageRows.push(new PackageRow(name, this.packageSets, versions));
    }

    async fetch() {
        this.versions = await fetchAllSourcePackages(this.packages);

        for (let row of this.packageRows)
        {
            let versions = this.versions.get(row.name);
            if (versions === undefined) {
                console.log(this.versions);
                continue;
            }
            row.fetch(versions);
        }
    }

    render() {
        return <div className="block p-5">
            <table className="bg-slate-200 dark:bg-gray-900 table-auto w-full rounded-2xl">
                <thead>
                <tr>
                    <th scope="col"></th>
                    {
                        this.packageSets.map((a) => {
                            return <th scope="col" className="text-center text-xl p-2">{a.charAt(0).toUpperCase() + a.slice(1)}</th>;
                        })
                    }
                </tr>
                </thead>
                <tbody>
                    {
                        this.packageRows.map((a) => {
                            return a.rowElement;
                        })
                    }
                </tbody>
            </table>
        </div>
    }

    packageSets: string[];
    packages: string[];
    versions = new Map<string, SiteSourcePackagesVersionsModel>();
    packageRows: PackageRow[];
}
