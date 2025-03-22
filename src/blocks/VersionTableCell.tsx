import {MouseEvent} from "react";
import {versionUpdater} from "../utils/loading";
import {compareVersionsString} from "../utils/versioning";

class CellProperties {
    package_name: string;
    package_prev_branch: string | undefined;
    package_branch: string;

    constructor(package_name: string, package_prev_brach: string | undefined, package_branch: string) {
        this.package_name = package_name;
        this.package_prev_branch = package_prev_brach;
        this.package_branch = package_branch;
    }
}

function compareVersionsIndicatior(version1: string | undefined, version2: string | undefined): string {
    console.log(version1, version2);
    if (version1 === undefined || version2 === undefined) {
        return "";
    }

    let comparison = compareVersionsString(version1, version2);
    if (comparison === undefined || comparison === 0) {
        return "";
    }
    if (comparison < 0) {
        return "bg-red-300/30 dark:bg-red-300/10";
    }
    return "bg-green-300/30 dark:bg-green-300/10";
}


export function VersionTableCell(cellProps: CellProperties) {
    let branches = versionUpdater.versions.get(cellProps.package_name);
    if (!branches) {
        return <td key={"tbody-" + cellProps.package_name + "-" + cellProps.package_branch}
                   className="font-light text-center text-xl p-2">-</td>;
    }

    let version = branches.get(cellProps.package_branch);

    if (!version) {
        return <td key={"tbody-" + cellProps.package_name + "-" + cellProps.package_branch}
                   className="font-light text-center text-xl p-2">-</td>;
    }

    function openPackage(_: MouseEvent<HTMLTableCellElement>) {
        window.open("https://packages.altlinux.org/ru/" + cellProps.package_branch + "/srpms/" + cellProps.package_name, "_blank");
    }

    return <td draggable={true}
               onDragStart={a => {
                   a.preventDefault();
                   a.stopPropagation();
               }}
               className={
                   "text-center h-full text-1xl p-0 transition-shadow hover:shadow-[0px_0px_5px_2px_rgba(0,_0,_0,_0.10)] " +
                   "dark:hover:shadow-[0px_0px_5px_2px_rgba(255,_255,_255,_0.10)] cursor-pointer text-nowrap " +
                   cellProps.package_prev_branch === undefined ?
                       "" : // @ts-ignore checked in previous line
                       compareVersionsIndicatior(version, versionUpdater.versions.get(cellProps.package_name)?.get(cellProps.package_prev_branch))
               } onClick={openPackage}>
        {version}
    </td>;
}