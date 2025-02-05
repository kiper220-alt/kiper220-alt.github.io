import React, {useEffect, useState} from 'react';
import {PackagesTable, PackageTable} from './packages';
import {Header} from "./header";
import {Configuration} from "./rdb";

export interface ConfigurationElement {
    name: string;
    branches: Array<string>;
    packages: Array<string>;
}

export class ACConfiguration {
    pickedConfiguration: number = 0;
    configurations: Array<ConfigurationElement> = new Array<ConfigurationElement>();
}

export const PackageContext = React.createContext({
    configuration: new ACConfiguration(),
    updateConfiguration: (configuration: ACConfiguration) => {}
});

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
function jsonToConfiguration(json: any): ACConfiguration {
    let configuration = new ACConfiguration();

    configuration.configurations = json.configurations;
    console.log(configuration);

    return configuration;
}

async function getConfiguration(): Promise<ACConfiguration> {
    let configurationsJson = localStorage.getItem('ac_config');
    let configurations: ACConfiguration;

    if (configurationsJson !== null) {
        configurations = jsonToConfiguration(JSON.parse(configurationsJson));
    }
    else {
        let configurationsResponse = await fetch ("/settings.json", {cache: "no-cache"});
        configurations = await checkAndParseJson<ACConfiguration>(configurationsResponse, "/settings.json", jsonToConfiguration);
        localStorage.setItem("ac_config", JSON.stringify(configurations));
    }

    return configurations;
}

let defaultConfiguration: ACConfiguration | null = null;

function App() {
    const [configuration, setConfiguration] = React.useState<ACConfiguration | null>(null);

    useEffect(() => {
        async function getConfEffect() {
            setConfiguration(null);
            defaultConfiguration = await getConfiguration();
            setConfiguration(defaultConfiguration);
        }
        getConfEffect();
    }, []);

    return configuration === null ? <div></div>: <AppFetched/>;
}
function AppFetched() {
    const [context, setContext] = React.useState(defaultConfiguration);

    let updateConfiguration = (configuration: ACConfiguration) => {
        localStorage.setItem("ac_config", JSON.stringify(configuration));
        setContext(configuration);
    };

    if (!context) {
        return <div></div>;
    }

    return <div className="App flex flex-col overflow-hidden h-screen w-full bg-slate-100 text-slate-800 dark:bg-gray-950 dark:text-gray-300">
        <PackageContext.Provider value={{configuration: context, updateConfiguration: updateConfiguration}}>
            <Header/>
            <PackageTable/>
        </PackageContext.Provider>
    </div>;
}


export default App;
