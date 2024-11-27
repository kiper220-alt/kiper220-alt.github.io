// import generated OpenAPI from `swagger.json` https://rdb.altlinux.org/api/swagger.json
import {
    Configuration,
    PackageApi,
    SiteApi,
    SiteAllPackagasetsModel,
    SiteSourcePackagesVersionsModel, SiteFingPackagesModel, SitePackageVersionsElementModel
} from "./rdb";
import {ReactElement} from "react";

let configuration: Configuration = new Configuration({basePath: "https://rdb.altlinux.org/api"});
let packageApiInstance: PackageApi = new PackageApi(configuration);
let siteApiInstance: SiteApi = new SiteApi(configuration);

export async function allPkgsets() : Promise<SiteAllPackagasetsModel> {
    let packageSetsResponse = await siteApiInstance.getRouteAllPackagesetsSiteAllPkgsets();

    if (packageSetsResponse.status !== 200 || packageSetsResponse.data.branches === undefined)
    {
        throw new Error(`Failed to get pkgset for ${packageSetsResponse.status}: ${packageSetsResponse.statusText}`);
    }

    return packageSetsResponse.data;
}

export async function sourcePackageVersions(name : string) : Promise<SiteSourcePackagesVersionsModel> {
    let pkghashResponse = await siteApiInstance.getRouteSourcePackageVersionsSiteSourcePackageVersions(name);

    if (pkghashResponse.status !== 200 || pkghashResponse.data.versions === undefined)
    {
        throw new Error(`Failed to get source package versions for ${name}`);
    }

    return pkghashResponse.data;
}

export async function findPackage(name: string[], branch? : string, arch? : string) : Promise<SiteFingPackagesModel> {
    let findResult = await siteApiInstance.getRoutePackagesetFindPackagesSiteFindPackages(name, branch, arch);

    if (findResult.status !== 200 || findResult.data.packages === undefined)
    {
        throw new Error(`Failed to find package versions for ${name.join(' ')}`);
    }

    return findResult.data;
}

async function validatePackageset(packageSets: string[]) {
    let fetchedPackageSet = await allPkgsets();

    for (let packageSet of packageSets)
    {
        if (!fetchedPackageSet.branches?.find((a) => {
            return a.branch == packageSet;
        }))
        {
            return false;
        }
    }
    return true;
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
    return <tr id={id}>
        {
            [
                <td><a href={"https://packages.altlinux.org/ru/sisyphus/srpms/" + name}>{name}</a></td>,
                ...packageSets.map((packageSet: string) => {
                    let packageVersion = packageVersions.versions?.find((a) => {
                        return a.branch === packageSet;
                    })
                    if (!packageVersion) {
                        return <td>-</td>;
                    }
                    return <td><a href={"https://packages.altlinux.org/ru/" + packageSet + "/srpms/" +name}>{packageVersion.version + '-' + packageVersion.release}</a></td>;
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

        if (!versions)
        {
            versions = makeEmptyVersions();
        }
        this.packageRows.push(new PackageRow(name, this.packageSets, versions));
    }

    async fetch() {
        if (! await validatePackageset(this.packageSets))
        {
            throw new Error('Internal Error "Application PackageSets are out of date"');
        }
        for (let row of this.packageRows)
        {
            let versions = await sourcePackageVersions(row.name);
            this.versions.set(row.name, versions);
            row.fetch(versions);
        }
    }

    render() {
        return <table>
            <thead>
            <tr>
                <th scope="col">Название</th>
                {
                    this.packageSets.map((a) => {
                        return <th scope="col">{a.charAt(0).toUpperCase() + a.slice(1)}</th>;
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
    }

    packageSets: string[];
    versions = new Map<string, SiteSourcePackagesVersionsModel>();
    packageRows: PackageRow[];
}
