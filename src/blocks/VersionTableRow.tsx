import {createContext, DragEvent} from "react";
import {versionUpdater} from "../utils/loading";
import {VersionTableCell} from "./VersionTableCell";

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


class RowProperties {
    package_name: string;
    package_branches: string[];
    swap: SwapEvent;
    remove: RemoveEvent;

    constructor(package_name: string, package_branches: string[], swap: SwapEvent, remove: RemoveEvent) {
        this.package_name = package_name;
        this.package_branches = package_branches;
        this.swap = swap;
        this.remove = remove;
    }
}

function onDragOver(event: DragEvent<HTMLTableRowElement>) {
    event.preventDefault();
}

function onDragEnter(event: DragEvent<HTMLTableRowElement>) {
    let leaved = event.relatedTarget;
    let entered = event.target;

    if (!(leaved instanceof HTMLElement) || !(entered instanceof HTMLElement)) {
        return;
    }

    while ((leaved !== null) && !(leaved instanceof HTMLTableRowElement)) {
        // @ts-ignore
        leaved = leaved.parentElement;
    }
    while ((entered !== null) && !(entered instanceof HTMLTableRowElement)) {
        // @ts-ignore
        entered = entered.parentElement;
    }
    if (leaved === entered) {
        return;
    }

    if (leaved !== null) {
        leaved.classList.remove("grab_hover");
    }
    if (entered !== null) {
        entered.classList.add("grab_hover");
    }
}

function dragStart(package_name: string, event: DragEvent<HTMLTableRowElement>) {
    if (!(event.target instanceof HTMLTableRowElement)) {
        event.preventDefault();
        return;
    }
    event.dataTransfer.dropEffect = "move";
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", package_name);
}

function onDrop(package_name: string, swap: SwapEvent, event: DragEvent<HTMLTableRowElement>) {
    let target = event.target;
    while ((target !== null) && !(target instanceof HTMLTableRowElement)) {
        // @ts-ignore
        target = target.parentElement;
    }
    if (!(target instanceof HTMLTableRowElement)) {
        event.preventDefault();
        return;
    }
    target.classList.remove("grab_hover");
    swap(event.dataTransfer.getData("text/plain"), package_name);
}

export function VersionTableRow(rowProps: RowProperties) {

    let package_branches = versionUpdater.versions.get(rowProps.package_name);
    if (!package_branches) {
        return null;
    }

    return <tr draggable={true}
               onDragStart={a => dragStart(rowProps.package_name, a)}
               onDrop={a => onDrop(rowProps.package_name, rowProps.swap, a)}
               onDragOver={onDragOver}
               onDragEnter={onDragEnter}
               className={"w-full object cursor-grab active:cursor-grabbing active:shadow-none dark:active:shadow-none hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)]" +
                   " dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]"}>
        <td key={"tbody-" + rowProps.package_name}
            className={"text-left sticky w-full bg-slate-200 backdrop-blur-[4px] dark:bg-[rgba(17,24,39,0.7)] left-0 drag_field flex items-center text-1xl font-bold p-2 transition-shadow" +
                "hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)]"}>
            <span onClick={a => {
                a.stopPropagation();
                rowProps.remove(rowProps.package_name);
            }}
                  className={"rounded-full text-center flex justify-center items-center text-[12px] box-border min-w-[16px] min-h-[16px] h-[16px] w-[16px] p-0 m-0 mr-5 overflow-hidden bg-red-500/50 hover:bg-red-500/80 cursor-pointer select-none"}>⨯</span>
            {rowProps.package_name}</td>
        {
            rowProps.package_branches.map((branch: string, i) => {

                if (!package_branches) {
                    package_branches = new Map<string, string>();
                }
                let prev_branch = rowProps.package_branches[i - 1];

                return <VersionTableCell key={"tbody-" + rowProps.package_name + "-" + branch}
                                         package_name={rowProps.package_name} package_prev_branch={prev_branch}
                                         package_branch={branch}/>
            })
        }
    </tr>
}