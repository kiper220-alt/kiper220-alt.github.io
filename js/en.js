function genRow(packages, branchName){
    let generated = "            <div class=\"package-header\">\n" +
        `                <p class=\"name\">${branchName}</p>\n` +
        "            </div>\n" +
        "            <div class=\"drop-down\">\n" +
        "                <table class=\"package-table\">\n" +
        "                    <thead>\n" +
        "                        <tr>\n" +
        "                            <th>Package</th>\n" +
        "                            <th>Version</th>\n" +
        "                            <th>Build date</th>\n" +
        "                        </tr>\n" +
        "                    </thead>\n" +
        "                        <tbody>"

    for (const packageEl of packages) {
        console.log(packageEl);
        generated += "<tr>\n" +
            `                                <td>${packageEl.sourcepkgname}</td>\n` +
            `                                <td>${packageEl.version}</td>\n` +
            `                                <td>${packageEl.buildtime}</td>\n` +
            "                            </tr>"
    }

    generated += "</tbody>\n" +
        "                </table>\n" +
        "            </div>\n";

    let el = document.createElement('li')
    el.classList.add('package');
    el.classList.add('package-expanded');
    el.innerHTML = generated;
    return el;
}