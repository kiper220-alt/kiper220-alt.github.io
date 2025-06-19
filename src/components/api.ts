import * as rdb from "$rdb/";

export let configuration: rdb.Configuration = new rdb.Configuration({basePath: "https://rdb.altlinux.org/api"});
export let packageApiInstance: rdb.PackageApi = new rdb.PackageApi(configuration);
export let siteApiInstance: rdb.SiteApi = new rdb.SiteApi(configuration);
