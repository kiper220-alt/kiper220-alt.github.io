function genRow(packages, packageName){
    const packageByName = packages
        .filter(p => p.sourcepkgname === packageName || p.packages.includes(packageName))
        .sort(compareBranches);
    const sisyphusBranch = packageByName.find(p => p.branch === "sisyphus");
    let sisyphusVersion = "-";

    if(sisyphusBranch !== undefined){
        sisyphusVersion = sisyphusBranch.version;
    }

    let generated = "            <div class=\"package-header\">\n" +
        `                <p class=\"name\">${packageName}</p>\n` +
        `                <p class="sisyphus-version">${sisyphusVersion}</p> <!--▼-->\n` +
        "            </div>\n" +
        "            <div class=\"drop-down\">\n" +
        "                <table class=\"package-table\">\n" +
        "                    <thead>\n" +
        "                        <tr>\n" +
        "                            <th>Ветка</th>\n" +
        "                            <th>Версия</th>\n" +
        "                            <th>Дата сборки</th>\n" +
        "                            <th>Архитектура</th>\n" +
        "                            <th>Пакеты</th>\n" +
        "                        </tr>\n" +
        "                    </thead>\n" +
        "                        <tbody>"

    for (const packageEl of packageByName) {
        generated += "<tr>\n" +
            `                                <td>${packageEl.branch}</td>\n` +
            `                                <td>${packageEl.version}</td>\n` +
            `                                <td>${packageEl.buildtime}</td>\n` +
            `                                <td>${arrayAsString(packageEl.archs)}</td>\n` +
            `                                <td>${arrayAsString(packageEl.packages)}</td>\n` +
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