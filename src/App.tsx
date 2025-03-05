import React, {useState} from 'react';
import './App.css';
import {TableContent, TableContext, VersionTable} from "./blocks/VersionTable";
import SearchField, {SearchFieldContext, SearchFieldContextData} from "./blocks/SearchField";
import ThemeButton from "./blocks/ThemeButton";

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
    const [tableContent, setTableContent] = useState(testContent);
    let fieldContext = new SearchFieldContextData();

    function addPackage(package_name: string) {
        setTableContent({
            package_names: [package_name, ...tableContent.package_names],
            package_branches: tableContent.package_branches,
            iteration: tableContent.iteration + 1
        });
    }

    fieldContext.addPackage = addPackage;
    fieldContext.removePackages = tableContent.package_names;

    return (
        <div className="App h-screen w-screen flex flex-col justify-start overflow-hidden">
            <div
                className="w-full p-2">
                <div
                    className="flex justify-between w-full p-5 rounded-lg md:rounded-2xl bg-slate-200 dark:bg-gray-900 text-slate-800 dark:text-gray-300">
                    <ThemeButton/>
                    <SearchFieldContext.Provider value={fieldContext}>
                        <SearchField/>
                    </SearchFieldContext.Provider>
                </div>
            </div>
            <div className="box-border overflow-auto">
                <TableContext value={{tableContent, setTableContent}}>
                    <VersionTable/>
                </TableContext>
            </div>
        </div>
    );
}

export default App;
