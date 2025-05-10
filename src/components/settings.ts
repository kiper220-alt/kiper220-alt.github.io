export interface BranchSettings {
    branches?: Record<string, { checked: boolean; disabled?: boolean }>;
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