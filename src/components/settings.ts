export interface BranchSettings {
    branches: Record<string, { checked: boolean; disabled?: boolean }>;
}

export const branchList = [
    {key: "sisyphus", title: "Sisyphus"},
    {key: "sisyphus_e2k", title: "Sisyphus E2K"},
    {key: "sisyphus_loongarch", title: "Sisyphus LoongArch"},
    {key: "p11", title: "P11"},
    {key: "p10", title: "P10"},
    {key: "p10_e2k", title: "P10 E2K"},
    {key: "p9", title: "P9"},
    {key: "c10f2", title: "C10F2"},
];

export const defaultBranchSettings = {
    sisyphus: {checked: true, disabled: true},
    sisyphus_e2k: {checked: true},
    sisyphus_loongarch: {checked: true},
    p11: {checked: true},
    p10: {checked: true},
    p10_e2k: {checked: true},
    p9: {checked: true},
    c10f2: {checked: true},
    c9f2: {checked: true},
}

export type Settings = {
    version: number;
    packages: Record<string, string[]>;
    branches: string[];
    dndsort: boolean;
    tab: number;
}

export function branchListFromList(branches: string[]): BranchSettings {
    let branchSettings: BranchSettings = {branches: defaultBranchSettings};
    for (let i in branchList) {
        const branch = branchList[i].key;
        branchSettings.branches[branch].checked = branches.findIndex(a => a === branch) !== -1;
    }
    return branchSettings;
}

export function tabsFromPackages(packages: Record<string, string[]>): string[] {
    return Array.from(Object.keys(packages));
}

const defaultSettings: Settings = {
    version: 1,
    packages: {},
    branches: branchList.map((a) => a.key),
    tab: 0,
    dndsort: true
};

function loadSettings(): Settings {
    let str = localStorage.getItem("config");
    if (!str) {
        return defaultSettings;
    }

    let config: Object = JSON.parse(str);
    if (!config) {
        return defaultSettings;
    }

    const c_config = (config as Settings);

    if ((config as Settings).version === undefined) {
        return {
            version: 1,
            packages: c_config.packages,
            branches: defaultSettings.branches,
            dndsort: c_config.dndsort,
            tab: c_config.tab
        };
    }

    if ((config as Settings).version > 1) {
        return defaultSettings;
    }
    return {
        version: c_config.version,
        packages: c_config.packages,
        branches: c_config.branches,
        dndsort: c_config.dndsort,
        tab: c_config.tab
    };
}

function saveSettings(settings: Settings) {
    localStorage.setItem("config", JSON.stringify({
        version: settings.version,
        packages: settings.packages,
        branches: settings.branches,
        dndsort: settings.dndsort,
        tab: settings.tab
    }));
}


export function setPackages(group: string, packages: string[]): void {
    settings.packages[group] = packages;
    changed = true;
}

export function removeGroup(group: string): void {
    delete settings.packages[group];
    changed = true;
}

export function addGroup(group: string): void {
    console.log("addGroup", group);
    settings.packages[group] = [];
    changed = true;
}

export function changeBranches(branches: string[]): void {
    if (branches !== settings.branches) {
        settings.branches = branches;
        changed = true;
    }
}

export function changeTab(tab: number): void {
    if (tab !== settings.tab) {
        settings.tab = tab;
        changed = true;
    }
}

export function setDndSort(sort: boolean): void {
    if (sort !== settings.dndsort) {
        settings.dndsort = sort;
        changed = true;
    }
}

function saveInterval(): void {
    if (changed) {
        changed = false;
        saveSettings(settings);
    }
}

export let settings: Settings = loadSettings();
let changed: boolean = false;

setInterval(saveInterval, 2000);
