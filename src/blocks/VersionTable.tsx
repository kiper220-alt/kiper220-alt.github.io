import {createContext, DragEvent, useContext, useEffect, useState} from "react";
import {fetchAllSourcePackages} from "../utils/loading";

export class TableContent {
    package_names: string[] = [];
    package_branches: string[] = [];
    iteration: number = 0;
}

export class TableContextData {
    tableContent: TableContent | undefined = undefined;
    setTableContent: ((tableContent: TableContent) => void) | undefined = undefined;
}

export type PackageTableRow = Map<string, string>; // version by branch
export type PackageTable = Map<string, PackageTableRow>;  // branch:version by package.
export type SwapEvent = (package1: string, package2: string) => void;
export type RemoveEvent = (package_name: string) => void;

export const TableContext = createContext<TableContextData | undefined>(undefined);

function TableMakeRow(name: string, package_names: string[], package_branches: string[], row: PackageTableRow, swap: SwapEvent, remove: RemoveEvent) {

    function dragStart(event: DragEvent<HTMLTableRowElement>) {
        if (!(event.target instanceof HTMLTableRowElement)) {
            event.preventDefault();
            return;
        }
        event.dataTransfer.dropEffect = "move";
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", name);
    }

    function onDragOver(event: DragEvent<HTMLTableRowElement>) {
        event.preventDefault();
    }

    function onDrop(event: DragEvent<HTMLTableRowElement>) {
        swap(event.dataTransfer.getData("text/plain"), name);
    }

    function onDragEnter(event: DragEvent<HTMLTableRowElement>) {
        // @ts-ignore
        let target: Element | null = event.target;
        while ((target !== null) && !(target instanceof HTMLTableRowElement)) {
            target = target.parentElement;
        }
        if (!target) {
            return;
        }
        target.classList.add("grab_hover");
    }

    function onDragLeave(event: DragEvent<HTMLTableRowElement>) {
        // @ts-ignore
        let target: Element | null = event.target;
        while ((target !== null) && !(target instanceof HTMLTableRowElement)) {
            target = target.parentElement;
        }
        if (!target) {
            return;
        }
        target.classList.remove("grab_hover");
    }

    function onDragEnd(_: DragEvent<HTMLTableRowElement>) {
        for (let grab of document.getElementsByClassName("grab_hover")) {
            grab.classList.remove("grab_hover");
        }
    }

    return <tr key={"tbody-" + name} draggable={true} onDragStart={dragStart} onDrop={onDrop} onDragOver={onDragOver}
               onDragEnter={onDragEnter} onDragLeave={onDragLeave} onDragEnd={onDragEnd}
               className={"w-full object cursor-grab active:cursor-grabbing active:shadow-none dark:active:shadow-none hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)]" +
                   " dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]"}>
        <td key={"tbody-" + name + "-name"}
            className={"text-center flex w-min items-center text-1xl font-bold p-2 transition-shadow" +
                "hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]"}>
            <span onClick={a => {
                a.stopPropagation();
                remove(name);
            }}
                  className={"rounded-full text-center flex justify-center items-center text-[12px] h-4 w-4 p-0 m-0 mr-5 overflow-hidden bg-red-500/50 hover:bg-red-500/80 cursor-pointer select-none"}>⨯</span>
            {name}</td>
        {
            package_branches.map((branch: string) => {
                let version = row.get(branch);

                if (!version) {
                    return <td key={"tbody-" + name + "-" + branch}
                               className="font-light text-center text-xl p-2">-</td>;
                }

                return <td key={"tbody-" + name + "-" + branch}
                           className="text-center text-1xl transition-shadow hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]">
                    <a className="p-2 block text-nowrap"
                       href={"https://packages.altlinux.org/ru/" + branch + "/srpms/" + name} target="_blank"
                       rel="noreferrer">
                        {version}
                    </a>
                </td>;
            })
        }
    </tr>;
}

export function VersionTable() {
    const [table, setTable] = useState<null | PackageTable>(null);
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
        fetchAllSourcePackages(context.tableContent.package_names, context.tableContent.package_branches).then((versions) => {
            let data: PackageTable = new Map<string, PackageTableRow>();
            versions.forEach((package_info, package_name) => {
                let map = new Map<string, string>(package_info.versions?.map((version) => {
                    if (!version.branch) {
                        throw new Error("Unable to get branch of `" + package_name);
                    }
                    if (!version.version) {
                        throw new Error("Unable to get branch of `" + package_name + "` in branch `" + version.branch + "`");
                    }
                    if (!version.release) {
                        return [version.branch, version.version];
                    }
                    return [version.branch, version.version + "-" + version.release];
                }));

                if (!map) {
                    throw new Error("Error while retrieving versions of `" + package_name + "`");
                }

                data.set(package_name, map);
            })
            return data;
        }).then(data => {
            setTable(data);
        });

        return;
    }, [context]); // eslint-disable-line

    if (context === undefined || table === null || context.tableContent === undefined || context.setTableContent === undefined) {
        return <div></div>;
    }

    return <table
        className="table-auto w-full md:rounded-2xl bg-slate-200 dark:bg-gray-900 text-slate-800 dark:text-gray-300 overflow-x-auto">
        <thead key="thead">
        <tr key="thead-tr">
            <th key="thead-tr-empty"
                className="sticky top-0 bg-slate-200 dark:bg-[rgba(17,24,39,0.7)] backdrop-blur-[4px]"></th>
            {
                context.tableContent.package_branches.map((a) => {
                    return <th key={"thead-tr-" + a} scope="col"
                               className="sticky top-0 text-center text-xl p-2 bg-slate-200 dark:bg-[rgba(17,24,39,0.7)] backdrop-blur-[4px]">{a.charAt(0).toUpperCase() + a.slice(1)}</th>;
                })
            }
        </tr>
        </thead>
        <tbody key="tbody" className="overflow-y-auto">
        {
            context.tableContent.package_names.map((a) => {
                let row = table.get(a);
                if (!row) {
                    row = new Map<string, string>();
                }
                // @ts-ignore
                return TableMakeRow(a, context.tableContent.package_names, context.tableContent.package_branches, row, swapEvent, removeEvent);
            })
        }
        </tbody>
    </table>
}

export default VersionTable;