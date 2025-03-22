import {TableGroupConfig} from "./TableGroup";

type LoadConfig = { configuration: TableGroupConfig, setConfiguration: ((newConfiguration: TableGroupConfig) => void) };

export function LoadConfigurationButton(loadConfig: LoadConfig) {
    return <div onClick={(_) => {
        const fileInput = document.getElementById("fileInput") as HTMLInputElement;
        fileInput.click();
    }}
                className={"block appearance-none rounded-lg select-none cursor-pointer bg-yellow-500/10 sm:ml-1 p-1.5 px-3 ml-0"}>
        <input onChange={(a) => {
            const file = a.target.files?.[0];
            if (file) {
                const reader = new FileReader();

                reader.onload = (e) => {
                    const contents = e.target?.result as string;
                    try {
                        const json = JSON.parse(contents);
                        if (!(json.packages === undefined || json.tab === undefined)) {
                            let newConfiguration: TableGroupConfig = {...loadConfig.configuration};
                            newConfiguration.packages = json.packages;
                            newConfiguration.tab = json.tab;
                            newConfiguration.branches = json.branches;
                            loadConfig.setConfiguration(newConfiguration);
                        } else {
                            console.error('Error while parsing JSON file:', json);
                            alert("Error: file isn't valid JSON configuration.");
                        }
                    } catch (error) {
                        console.error('Error while parsing JSON file:', error);
                        alert("Error: file isn't valid JSON configuration.");
                    }
                    a.target.value = '';
                };
                reader.onerror = () => {
                    console.error('Error while reading JSON file: ', file);
                    alert('Error while reading JSON file: ' + file.name);
                };

                reader.readAsText(file);
            }
        }} id="fileInput" type="file" className={"hidden"}></input>
        Load
    </div>;
}