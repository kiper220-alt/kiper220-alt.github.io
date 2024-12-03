import { Disclosure, Select } from '@headlessui/react'
import {ChangeEvent} from "react";

document.documentElement.classList.toggle(
    'dark',
    localStorage.theme === 'dark'
)

document.documentElement.classList.toggle(
    'light',
    localStorage.theme === 'light'
)

export function onChangeTheme(theme: ChangeEvent<HTMLSelectElement>) {
    if (theme.target.value === 'system')
    {
        localStorage.removeItem('theme')
    }
    console.log(theme.target.value);
    localStorage.theme = theme.target.value;

    document.documentElement.classList.toggle(
        'dark',
        localStorage.theme === 'dark'
    )

    document.documentElement.classList.toggle(
        'light',
        localStorage.theme === 'light'
    )
}

export function makeHeader(){
    let theme: string;

    if (localStorage.theme === undefined) {
        theme = 'system';
    }
    else {
        theme = localStorage.theme;
    }

    return  <Disclosure as="nav" className="bg-slate-200 dark:bg-gray-900 m-5 rounded-2xl block box-border overflow-auto">
                <Select className="m-5 block appearance-none rounded-lg border-none bg-black/5 dark:bg-white/5 py-1.5 px-3 text-sm/6 dark:text-white focus:outline-none data-[focus]:outline-2 data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 dark:*:text-black" onChange={onChangeTheme} name="theme" defaultValue={theme} aria-label="Theme">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </Select>
        </Disclosure>;
}