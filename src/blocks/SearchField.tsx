import {createContext, useContext, useEffect, useState} from "react";
import {findPackage, SearchResultElement} from "../utils/loading";

export class SearchFieldContextData {
    removePackages: string[] = [];

    addPackage: (package_name: string) => void = (_: string) => {
    };
}

export const SearchFieldContext = createContext<SearchFieldContextData | undefined>(undefined);

let searchTimeout: NodeJS.Timeout | null = null;

function printResult(addPackage: (package_name: string) => void, result: SearchResultElement[]) {
    return result.map((item) => {
        return <div key={"search-result-" + item.name} className={"contents cursor-pointer group"}
                    onClick={_ => addPackage(item.name)}>
            <span
                className={"select-none p-2 w-full group-hover:bg-black/5 group-hover:dark:bg-white/5"}>{item.name}</span>
            <span
                className={"bg-orange-500/80 group-hover:bg-orange-500/65 cursor-pointer p-2 text-white"}>{item.sisyphus}</span>
        </div>;
    });
}

export function SearchField() {
    const [search, setSearch] = useState<string>("");
    const [result, setResult] = useState<SearchResultElement[]>([]);
    const context = useContext(SearchFieldContext);

    useEffect(() => {
        if (searchTimeout !== null) {
            clearTimeout(searchTimeout);
        }

        if (!search || search.length < 2) {
            if (result && result.length) {
                setResult([]);
            }
            return;
        }

        function handleSearch() {
            findPackage(search).then(arr => {
                arr = arr.filter((item) => context?.removePackages.findIndex(a => item.name === a) === -1)
                arr.length = Math.min(arr.length, 5);
                setResult(arr);
            });
        }

        searchTimeout = setTimeout(handleSearch, 500);
    }, [search]); // eslint-disable-line

    useEffect(() => {
        if (!search || !search.length) {
            if (result && result.length) {
                setResult([]);
            }
            return;
        }
    }, [result]); // eslint-disable-line

    function handleAddPackage(package_name: string) {
        setSearch("");
        if (context) {
            context.addPackage(package_name);
        }
    }

    return <div className={"max-w-min"}>
        <div className={
            "flex flex-row items-center justify-stretch w-96 rounded-[0.6em] border-none bg-red-500 px-3text-sm/6 " +
            "dark:text-white"
        }>
            <input
                onInput={a => {
                    if (a.target instanceof HTMLInputElement) {
                        let regexp = /^([\w.+-]* ?)+$/;
                        if (!regexp.test(a.target.value)) {
                            a.target.value = search;
                            return;
                        }
                    }
                }}
                onKeyDown={a => {
                    if (a.keyCode === 27) {
                        setSearch("");
                    }
                }}
                className={
                    "block appearance-none rounded-lg w-full border-none bg-[#D6DCE4] dark:bg-[#10141E] p-1.5 px-3text-sm/6 " +
                    "dark:text-white focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25"
                }
                onChange={e => {
                    setSearch(e.target.value);
                }} value={search}/>
            {(search && search.length) ?
                <span onClick={_ => setSearch("")}
                      className={"pb-1.5 pt-1.5 pr-2 pl-2 cursor-pointer select-none text-white"}>⨯</span> : null}
        </div>
        {(result && result.length) ? <div className={"h-0 w-full box-border"}>
            <div className={"pt-2"}>
                <div
                    className={"relative z-50 w-full grid grid-cols-[1fr,auto] box-border overflow-hidden bg-[#D6DCE4] dark:text-white dark:bg-[#10141E] rounded-lg"}>
                    {
                        (context) ? printResult(handleAddPackage, result) : null
                    }
                </div>
            </div>
        </div> : null
        }
    </div>;
}

export default SearchField;