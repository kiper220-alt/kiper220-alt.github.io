// @ts-ignore
function genRow(packages, branchName) {
    let generated = "            <div class=\"package-header\">\n" +
        `                <p class=\"name\">${branchName}</p>\n` +
        "            </div>\n" +
        "            <div class=\"drop-down\">\n" +
        "                <table class=\"package-table\">\n" +
        "                    <thead>\n" +
        "                        <tr>\n" +
        "                            <th>Package</th>\n" +
        "                            <th>Build date</th>\n" +
        "                            <th>Version</th>\n" +
        "                        </tr>\n" +
        "                    </thead>\n" +
        "                        <tbody>";
    for (const packageEl of packages) {
        if (packageEl.version == "-") {
            generated += "<tr>\n" +
                `                                <td><a class="muted" href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.sourcepkgname}</a></td>\n` +
                `                                <td><a class="muted" href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.buildtime}</a></td>\n` +
                `                                <td><a class="muted" href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.version}</a></td>\n` +
                "                            </tr>";
        }
        else {
            generated += "<tr>\n" +
                `                                <td><a href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.sourcepkgname}</a></td>\n` +
                `                                <td><a href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.buildtime}</a></td>\n` +
                `                                <td><a href="https://packages.altlinux.org/ru/${packageEl.branch}/srpms/${packageEl.sourcepkgname}/" target="_blank">${packageEl.version}</a></td>\n` +
                "                            </tr>";
        }
    }
    generated += "</tbody>\n" +
        "                </table>\n" +
        "            </div>\n";
    let el = document.createElement('li');
    el.classList.add('package');
    el.classList.add('package-expanded');
    el.id = `branch-${packages[0].branch}`;
    el.innerHTML = generated;
    return el;
}
//# sourceMappingURL=en.js.map