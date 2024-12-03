import React from 'react';
import {PackagesTable} from './packages';
import {makeHeader} from "./header";

const currentConfig: string | null = (new URLSearchParams(document.location.search)).get("cur_conf");

interface ConfigurationElement {
    branches: Array<string>;
    packages: Array<string>;
}
class Configuration {
    default: string = "default";
    configurations: Map<string, ConfigurationElement> = new Map<string, ConfigurationElement>();
}

async function checkAndParseJson<Target>(responseJson : Response, url : string, converter: (json:any) => Target) : Promise<Target>
{
    if (!responseJson.ok) {
        throw new URIError(`Cannot fetch \`${url}\`(${responseJson.status}: ${responseJson.statusText})`);
    }

    const contentType = responseJson.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
        throw new TypeError(`Invalid \`${url}\`.`);
    }

    return converter(await responseJson.json());
}
function jsonToConfiguration(json: any): Configuration {
    let configuration = new Configuration();

    configuration.default = json.default;
    configuration.configurations = new Map(Object.entries(json.configurations));

    return configuration;
}

async function App() {
    let configurationsResponse: Response = await fetch ("/settings.json", {cache: "no-cache"});
    let configurations = await checkAndParseJson<Configuration>(configurationsResponse, "/settings.json", jsonToConfiguration);
    let configuration: ConfigurationElement | undefined = undefined;

    if (currentConfig !== null) {
        configuration = configurations.configurations.get(currentConfig);
    }
    if (configuration === undefined)
    {
        configuration = configurations.configurations.get(configurations.default);
    }
    if (configuration === undefined)
    {
        throw new Error("Invalid configurations.");
    }

    let table = new PackagesTable(configuration.branches, configuration.packages);

    await table.fetch();

    return (
        <div className="App w-full bg-slate-100 text-slate-800 dark:bg-gray-950 dark:text-gray-300">
            { makeHeader() }
            { table.render() }
        </div>
    );
}

export default App;
