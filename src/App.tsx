import './App.css';
import {TableContent} from "./blocks/VersionTable";
import {TableGroup, TableGroupContext} from "./blocks/TableGroup";
import {useEffect, useState} from "react";
import ThemeButton from "./blocks/ThemeButton";
import {SearchField, SearchFieldContext, SearchFieldContextData} from "./blocks/SearchField";
import {SaveConfigurationButton} from "./blocks/SaveConfiguration";
import {loadConfig} from "./utils/loading";
import {LoadConfigurationButton} from "./blocks/LoadConfiguration";

let testContent = new TableContent();
testContent.package_branches = [
    "sisyphus",
    "sisyphus_e2k",
    "sisyphus_riscv64",
    "sisyphus_loongarch64",
    "p11",
    "p10",
    "p9",
    "p10_e2k",
    "p9_e2k",
    "c10f2",
    "c10f1",
    "c9f2",
];
testContent.package_names = [];


function App() {
    const [groupContext, setContext] = useState(loadConfig());
    let fieldContext = new SearchFieldContextData();

    useEffect(() => {
        localStorage.setItem("config", JSON.stringify({packages: groupContext.packages, tab: groupContext.tab}));
    }, [groupContext]);

    function getNewName(base: string): string {
        let new_name = base;
        let iteration = 0;
        let index = -1;

        while (true) {
            // eslint-disable-next-line no-loop-func
            index = groupContext.packages.findIndex(a => a[0] === new_name);
            if (index === -1) {
                break;
            }
            new_name = base + ++iteration;
        }

        return new_name;
    }

    function setPackages(packages: string[]) {
        let context = {...groupContext};
        if (context.packages.length === 0) {
            context.packages.push(["group", packages]);
            setContext(context);
            return;
        }
        context.packages[context.tab][1] = packages;
        setContext(context);
        return;
    }

    function addPackage(package_name: string) {
        let context = {...groupContext};
        if (context.packages.length === 0) {
            context.packages.push(["group", [package_name]]);
            setContext(context);
            return;
        }
        context.packages[context.tab][1].push(package_name);
        setContext(context);
        return;
    }

    function addConfiguration(): string {
        let context = {...groupContext};
        let new_name = getNewName("group");

        context.packages.push([new_name, []]);
        context.tab = context.packages.length - 1;
        setContext(context);
        return new_name;
    }

    function changeTab(tab: number): number {
        let context = {...groupContext};
        if (tab >= context.packages.length) {
            if (tab === 0) {
                return 0;
            }
            if (context.packages.length === 0) {
                tab = 0;
            } else {
                tab = context.packages.length - 1;
            }
        }
        context.tab = tab;
        setContext(context);
        return 0;
    }

    function removeConfiguration(tab: number): boolean {
        let context = {...groupContext};

        if (tab >= context.packages.length || tab < 0) {
            return false;
        }
        if (tab <= context.tab && context.tab !== 0) {
            context.tab = context.tab - 1;
        }

        context.packages = [...context.packages.slice(0, tab), ...context.packages.slice(tab + 1)];
        setContext(context);
        return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    function renameConfiguration(tab: number, new_name: string) {
        let context = {...groupContext};

        if (tab >= context.packages.length || tab < 0) {
            return;
        }

        context.packages[tab][0] = new_name;
        setContext(context);
    }

    // update delegates.
    groupContext.setPackages = setPackages;
    groupContext.changeTab = changeTab;
    groupContext.addConfiguration = addConfiguration;
    groupContext.removeConfiguration = removeConfiguration;
    fieldContext.addPackage = addPackage;
    fieldContext.neededBranches = new Set(groupContext.branches);

    // update package list for searching.
    if (groupContext.packages.length > 0) {
        fieldContext.removePackages = groupContext.packages[groupContext.tab][1];
    } else {
        fieldContext.removePackages = [];
    }

    return (
        <div className="App h-screen w-screen flex flex-col justify-start overflow-hidden">
            <div
                className="w-full p-2">
                <div
                    className="flex justify-between w-full p-5 rounded-lg md:rounded-2xl bg-slate-200 dark:bg-gray-900 text-slate-800 dark:text-gray-300">
                    <div className="flex">
                        <ThemeButton/>
                        <SaveConfigurationButton/>
                        <LoadConfigurationButton configuration={groupContext} setConfiguration={setContext}/>
                    </div>
                    <SearchFieldContext.Provider value={fieldContext}>
                        <SearchField/>
                    </SearchFieldContext.Provider>
                </div>
            </div>
            <div className="box-border overflow-auto">
                <TableGroupContext value={groupContext}>
                    <TableGroup/>
                </TableGroupContext>
            </div>
        </div>
    );

}

export default App;
