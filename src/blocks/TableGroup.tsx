import {createContext, useContext} from "react";
import {TableContent, TableContext, VersionTable} from "./VersionTable";

export class TableGroupConfig {
    branches: string[] = ["sisyphus", "sisyphus_e2k", "sisyphus_riscv64", "sisyphus_loongarch64", "p11", "p10", "p10_e2k", "c10f2"];
    packages: Array<[string, string[]]> = new Array<[string, string[]]>();
    tab: number = 0;
    changeTab: (tab: number) => void;
    setPackages: ((packages: string[]) => void);
    addConfiguration: (() => void);
    removeConfiguration: ((tab: number) => void);

    constructor(changeTab: ((tab: number) => void), setPackages: ((packages: string[]) => void), addConfiguration: (() => void), removeConfiguration: ((tab: number) => void)) {
        this.changeTab = changeTab;
        this.setPackages = setPackages;
        this.addConfiguration = addConfiguration;
        this.removeConfiguration = removeConfiguration;
    }
}

export const TableGroupContext = createContext<TableGroupConfig | undefined>(undefined);

function addTabs(context: TableGroupConfig, tab: number, setTab: ((page: number) => void)) {
    return Array.from(context.packages).map((config, n) => {
        return <div key={`table-group-tabs-${n}`} onClick={() => setTab(n)}
                    className={"flex select-none items-center p-2 max-w-max rounded-sm "
                        + (tab === n ? " bg-black/10 cursor-auto transition-colors dark:bg-white/10" : "cursor-pointer bg-black/5 dark:bg-white/5")}>
            <p className={tab === n ? "cursor-auto" : "cursor-pointer"}>{config[0]}</p>
            <span onClick={a => {
                a.stopPropagation();
                context.removeConfiguration(n);
            }}
                  className={"rounded-full text-center flex justify-center items-center text-[12px] h-4 w-4 p-0 m-0 ml-5 overflow-hidden bg-red-500/40 hover:bg-red-500/50 active:bg-red-500/70 cursor-pointer select-none"}>⨯</span>
        </div>;
    });
}

export function TableGroup() {
    const groupContext = useContext(TableGroupContext);
    let table = new TableContent();

    if (groupContext && groupContext.packages.length !== 0) {
        table.package_names = groupContext.packages[groupContext.tab][1];

        if (table.iteration !== undefined) {
            table.iteration = table.iteration + 1;
        } else {
            table.iteration = 0;
        }
        table.package_branches = groupContext.branches;
    }

    if (!groupContext || !groupContext.setPackages || !groupContext.addConfiguration || !groupContext.removeConfiguration) {
        return null;
    }
    return <div key="table-group" className={"dark:text-white"}>
        <div key="table-group-tabs"
             className={"flex items-center *:mr-2 bg-black/5 dark:bg-gray-900 overflow-y-hidden"}>
            {
                addTabs(groupContext, groupContext.tab, groupContext.changeTab)
            }
            <div onClick={_ => {
                groupContext.addConfiguration();
            }}
                 className={"w-5 h-5 box-border flex select-none cursor-pointer items-center justify-center transition-colors bg-green-500/40 hover:bg-green-500/50 active:bg-green-500/70"}>
                +
            </div>
        </div>
        <div className={"box-border overflow-auto"}>
            {
                groupContext.packages.length > 0 ?
                    <TableContext value={{
                        // @ts-ignore
                        tableContent: table, setTableContent: a => {
                            groupContext.setPackages(a.package_names);
                        }
                    }}>
                        <VersionTable/>
                    </TableContext>
                    : null
            }
        </div>
    </div>
}

export default TableGroup;