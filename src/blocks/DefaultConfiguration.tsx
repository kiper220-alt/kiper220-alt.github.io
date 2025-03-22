import {TableGroupConfig} from "./TableGroup";

class DefaultConfigurationProperties {
    groupContext: TableGroupConfig;
    setContext: (newContext: TableGroupConfig) => void;

    constructor(groupContext: TableGroupConfig, setContext: (newContext: TableGroupConfig) => void) {
        this.groupContext = groupContext;
        this.setContext = setContext;
    }
}

export function DefaultConfigurationButton(defaultProps: DefaultConfigurationProperties) {
    return <div onClick={(e) => {
        e.preventDefault();
        let context = {...defaultProps.groupContext};
        let config = fetch("/default.json");
        config.then(response => response.json()).then(data => {
            context.packages = [["Default", data.data], ...context.packages.filter(a => a[0] !== "Default")];
            context.tab = 0;
            defaultProps.setContext(context);
        });
    }}
                className={"block appearance-none rounded-lg select-none cursor-pointer bg-orange-500/10 sm:ml-1 p-1.5 px-3 ml-0"}>
        Default
    </div>;
}