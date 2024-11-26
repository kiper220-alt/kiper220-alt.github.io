import {Configuration, ConfigurationParameters, PackageApi, SiteApi} from "./rdb";

let configuration: Configuration = new Configuration({basePath: "https://rdb.altlinux.org/api"});
let packageApiInstance: PackageApi = new PackageApi(configuration);
let siteApiInstance: SiteApi = new SiteApi(configuration);


function app_script() {
    // Testing example of typescript-axios generated with OpenAPI from `swagger.json` https://rdb.altlinux.org/api/swagger.json
    siteApiInstance.getRoutePackagesetFindPackagesSiteFindPackages(["gpupdate"]).then(a => console.log(a.data));
}

export default app_script;