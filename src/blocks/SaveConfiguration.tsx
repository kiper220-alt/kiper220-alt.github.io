import {loadConfig, saveAs} from "../utils/config";

export function SaveConfigurationButton() {
    return <div onClick={(e) => {
        e.preventDefault();
        saveAs(JSON.stringify(loadConfig()), "config.json");
    }}
                className={"block appearance-none rounded-lg select-none cursor-pointer bg-green-500/10 sm:ml-1 p-1.5 px-3 ml-0"}>Save</div>;
}