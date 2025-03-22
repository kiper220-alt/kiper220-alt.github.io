import {createContext, useContext, useEffect, useState} from "react";
import {versionUpdater} from "../utils/loading";
import {VersionTableRow} from "./VersionTableRow";

export class TableContent {
    package_names: string[] = [];
    package_branches: string[] = [];
    iteration: number = 0;
}

export class TableContextData {
    tableContent: TableContent | undefined = undefined;
    setTableContent: ((tableContent: TableContent) => void) | undefined = undefined;
}

export type SwapEvent = (package1: string, package2: string) => void;
export type RemoveEvent = (package_name: string) => void;

export const TableContext = createContext<TableContextData | undefined>(undefined);

export function VersionTable() {
    const [iteration, setIteration] = useState<number>(0);
    const context = useContext(TableContext);

    function swapEvent(package1: string, package2: string) {
        if (context === undefined || context.tableContent === undefined || context.setTableContent === undefined) {
            return;
        }
        if (package1 === package2) {
            return;
        }

        let package_names = context.tableContent.package_names;
        const packageIndex1 = package_names.findIndex((a) => a === package1);
        const packageIndex2 = package_names.findIndex((a) => a === package2);
        const tmp = package_names[packageIndex1];

        if (packageIndex1 === -1 || packageIndex2 === -1) {
            return;
        }

        if (packageIndex1 > packageIndex2) {
            for (let i = packageIndex1 - 1; i >= packageIndex2; i--) {
                package_names[i + 1] = package_names[i];
            }
        } else {
            for (let i = packageIndex1; i < packageIndex2; i++) {
                package_names[i] = package_names[i + 1];
            }
        }
        package_names[packageIndex2] = tmp;

        context.setTableContent({
            package_names: package_names,
            package_branches: context.tableContent.package_branches,
            iteration: context.tableContent.iteration,
        });
    }

    function removeEvent(package_name: string) {
        if (context === undefined || context.tableContent === undefined || context.setTableContent === undefined) {
            return;
        }
        let package_names = context.tableContent.package_names;
        const packageIndex = package_names.findIndex((a) => a === package_name);
        package_names = [...package_names.slice(0, packageIndex), ...package_names.slice(packageIndex + 1)];

        context.setTableContent({
            package_names: package_names,
            package_branches: context.tableContent.package_branches,
            iteration: context.tableContent.iteration,
        });
    }

    useEffect(() => {
        if (context === undefined || context.tableContent === undefined || context.setTableContent === undefined) {
            return;
        }

        if (context.tableContent.package_names.length === 0 || context.tableContent.package_branches.length === 0) {
            return;
        }

        // TODO: Separate fetch and table. Use table only for displaying data.
        versionUpdater.addPackages(context.tableContent.package_names);
        versionUpdater.addBranches(context.tableContent.package_branches);
        versionUpdater.fetch().then(a => {
            if (a) {
                setIteration(iteration + 1);
            }
        })

        return;
    }, [context]); // eslint-disable-line

    if (context === undefined || context.tableContent === undefined || context.tableContent.package_branches === undefined || context.setTableContent === undefined) {
        return <div></div>;
    }

    return <table
        className="table-auto w-full md:rounded-2xl bg-slate-200 dark:bg-gray-900 text-slate-800 dark:text-gray-300">
        <thead key="thead">
        <tr key="thead-tr">
            <th key="thead-tr-empty"
                className="sticky top-0 bg-slate-[rgba(226,232,240,0.7))] dark:bg-[rgba(17,24,39,0.7)] z-10 backdrop-blur-[4px]"></th>
            {
                context.tableContent.package_branches.map((a) => {
                    return <th key={"thead-tr-" + a} scope="col"
                               className="sticky top-0 text-center text-xl p-2 bg-slate-[rgba(226,232,240,0.7))] z-10 dark:bg-[rgba(17,24,39,0.7)] backdrop-blur-[4px]">{a.charAt(0).toUpperCase() + a.slice(1)}</th>;
                })
            }
        </tr>
        </thead>
        <tbody key="tbody" className="overflow-y-auto">
        {
            context.tableContent.package_names.map((a) => {
                return <VersionTableRow key={"tbody-" + a} package_name={a} // @ts-ignore already checked
                                        package_branches={context.tableContent.package_branches}
                                        swap={swapEvent} remove={removeEvent}/>;
            })
        }
        </tbody>
    </table>
}

export default VersionTable;