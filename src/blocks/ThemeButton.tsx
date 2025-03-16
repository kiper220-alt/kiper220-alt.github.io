import {ChangeEvent} from "react";

document.documentElement.classList.toggle(
    'dark',
    localStorage.theme === 'dark'
)

document.documentElement.classList.toggle(
    'light',
    localStorage.theme === 'light'
)

function ThemeButton() {
    let theme: string;

    if (localStorage.theme === undefined) {
        theme = 'system';
    } else {
        theme = localStorage.theme;
    }

    function handleChange(event: ChangeEvent<HTMLSelectElement>) {
        switch (event.target.value) {
            case 'system':
                localStorage.removeItem('theme');
                document.documentElement.classList.toggle('dark', false);
                document.documentElement.classList.toggle('light', false);
                break;
            case 'dark':
                localStorage.theme = event.target.value;
                document.documentElement.classList.toggle('dark', true);
                document.documentElement.classList.toggle('light', false);
                break;
            case 'light':
                localStorage.theme = event.target.value;
                document.documentElement.classList.toggle('dark', false);
                document.documentElement.classList.toggle('light', true);
                break;
        }
    }

    return <select
        className={"block appearance-none rounded-lg cursor-pointer border-none bg-black/5 dark:bg-white/5 p-1.5 px-3 " +
            "text-sm/6 text-center dark:text-white focus:outline-none data-[focus]:outline-2 " +
            "data-[focus]:-outline-offset-2 data-[focus]:outline-white/25 dark:*:text-black"}
        onChange={handleChange}
        name="theme" defaultValue={theme} aria-label="Theme">
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
    </select>
}

export default ThemeButton;