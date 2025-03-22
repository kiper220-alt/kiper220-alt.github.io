import {TableGroupConfig} from "../blocks/TableGroup";

export function saveAs(text: string, filename: string) {
    const blob = new Blob([text], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    a.click();

    URL.revokeObjectURL(url);
}

export function loadConfig(): TableGroupConfig {
    let config = new TableGroupConfig(() => {
    }, () => {
    }, () => {
    }, () => {
    });
    let str = localStorage.getItem("config");

    if (!str) {
        return config;
    }

    let json = JSON.parse(str);

    config.packages = json.packages;
    config.tab = json.tab;

    return config;
}