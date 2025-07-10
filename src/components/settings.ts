export interface BranchSettings {
    branches: Record<string, { checked: boolean; disabled?: boolean }>;
}

export type PackageGroup = {
    name: string;
    packages: string[];
};

export type Settings = {
    version: number;
    groups: PackageGroup[];
    branches: string[];
    dndsort: boolean;
    tab: number;
}

type OldSettings = {
    packages: [string, string[]][];
    tab: number;
}

export const branchList = [
    {key: "sisyphus", title: "Sisyphus"},
    {key: "sisyphus_e2k", title: "Sisyphus E2K"},
    {key: "sisyphus_riscv64", title: "Sisyphus RiscV64"},
    {key: "sisyphus_loongarch64", title: "Sisyphus LoongArch64"},
    {key: "p11", title: "P11"},
    {key: "p10", title: "P10"},
    {key: "p10_e2k", title: "P10 E2K"},
    {key: "c10f2", title: "C10F2"},
];

export const defaultBranchSettings = {
    ...branchList.map((a) => a.key).reduce((acc, a) => ({...acc, [a]: {checked: true, disabled: a === "sisyphus"}}), {})
}

export const defaultSettings: Settings = {
    version: 1,
    groups: [],
    branches: branchList.map((a) => a.key),
    tab: 0,
    dndsort: true
};


export type DefaultsPackageGroups = {
    name: string;
    packages: string[];
};
export type DefaultsConfiguration = {
    version: number;
    groups: DefaultsPackageGroups[];
};

let fetchedConfiguration: Promise<DefaultsConfiguration> | undefined = undefined;

export async function fetchDefaultConfigration(): Promise<DefaultsConfiguration> {
    if (!fetchedConfiguration) {
        fetchedConfiguration = fetch("/default.json").then((r) => r.json());
    }
    return fetchedConfiguration;
}

export function branchSettingsFromList(branches: string[]): BranchSettings {
    let branchSettings: BranchSettings = {branches: defaultBranchSettings};
    for (let i in branchList) {
        const branch = branchList[i].key;
        branchSettings.branches[branch].checked = branches.findIndex(a => a === branch) !== -1;
    }
    return branchSettings;
}

export function listFromBranchSettings(branches: BranchSettings): string[] {
    let list: string[] = [];
    for (let i in branches.branches) {
        if (branches.branches[i].checked) {
            list.push(i);
        }
    }
    return list;
}

export function tabsFromPackages(packages: Record<string, string[]>): string[] {
    return Array.from(Object.keys(packages));
}

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
            groups: (config as OldSettings).packages.map((a) => ({name: a[0], packages: a[1]})),
            branches: defaultSettings.branches,
            dndsort: defaultSettings.dndsort,
            tab: (config as OldSettings).tab
        };
    }

    if ((config as Settings).version > 1) {
        return defaultSettings;
    }
    return {
        version: c_config.version,
        groups: c_config.groups,
        branches: c_config.branches,
        dndsort: c_config.dndsort,
        tab: c_config.tab
    };
}

function saveSettings(settings: Settings) {
    localStorage.setItem("config", JSON.stringify({
        version: settings.version,
        groups: settings.groups,
        branches: settings.branches,
        dndsort: settings.dndsort,
        tab: settings.tab
    }));
}


export function setGroups(groups: PackageGroup[]): void {
    if (groups === settings.groups) {
        return;
    }

    settings.groups = [...groups];
    saveSettings(settings);
}

export function changeBranches(branches: string[]): void {
    if (branches === settings.branches) {
        return;
    }

    settings.branches = [...branches];
    saveSettings(settings);
}

export function changeTab(tab: number): void {
    if (tab === settings.tab) {
        return;
    }

    settings.tab = tab;
    saveSettings(settings);
}

export function setDndSort(sort: boolean): void {
    if (sort === settings.dndsort) {
        return;
    }

    settings.dndsort = sort;
    saveSettings(settings);
}

export function saveAs(filename: string) {
    const blob = new Blob([JSON.stringify({
        version: settings.version,
        groups: settings.groups,
        branches: settings.branches,
        dndsort: settings.dndsort,
        tab: settings.tab
    })], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);
}

export function loadFrom(a: Event & { currentTarget: EventTarget & HTMLInputElement; }) {
    // @ts-ignore
    const file = a.target.files?.[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const contents = e.target?.result as string;
            try {
                const json = JSON.parse(contents);
                settings = {
                    version: json.version,
                    groups: json.groups,
                    branches: json.branches,
                    dndsort: json.dndsort,
                    tab: json.tab
                }
                saveSettings(settings);
                document.location.reload();
            } catch (error) {
                console.error('Error while parsing JSON file:', error);
            }
            // @ts-ignore
            a.target.value = '';
        };
        reader.onerror = () => {
            console.error('Error while reading JSON file: ', file);
        };

        reader.readAsText(file);
    }
}

export let settings: Settings = loadSettings();
