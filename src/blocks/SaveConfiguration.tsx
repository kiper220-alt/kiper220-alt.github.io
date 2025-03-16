import {loadConfig, saveAs} from "../utils/loading";

export function SaveConfigurationButton() {
    return <div onClick={(e) => {
        e.preventDefault();
        saveAs(JSON.stringify(loadConfig()), "config.json");
    }}
                className={"block appearance-none rounded-lg select-none cursor-pointer bg-green-500/10 p-1.5 px-3 ml-1"}>Save</div>;
}