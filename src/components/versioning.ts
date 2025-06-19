export type VersionUnit = string | number;
export type Version = VersionUnit[];

function splitVersionUnit(dot_split: string[]): VersionUnit[] {
    const result: VersionUnit[] = [];

    for (const unit of dot_split) {
        let currentNumber = '';
        let currentString = '';

        for (let i = 0; i < unit.length; i++) {
            const char = unit[i];

            if (/\d/.test(char)) {
                if (currentString) {
                    result.push(currentString);
                    currentString = '';
                }
                currentNumber += char;
            } else {
                if (currentNumber) {
                    result.push(parseInt(currentNumber, 10));
                    currentNumber = '';
                }
                currentString += char;
            }
        }

        if (currentNumber) {
            result.push(parseInt(currentNumber, 10));
        }
        if (currentString) {
            result.push(currentString);
        }
    }

    return result;
}

export function lexingVersion(version: string): Version {
    let lexicons: Version = splitVersionUnit(version.split('.'));
    return lexicons;
}

export function compareVersions(version1: Version, version2: Version): number {
    for (let i = 0; i < (version1.length <= version2.length ? version1.length : version2.length); i++) {
        if (version1[i] !== version2[i]) {
            return (version1[i] > version2[i] ? 1 : 0) - (version1[i] < version2[i] ? 1 : 0);
        }
    }
    return (version1.length > version2.length ? 1 : 0) - (version1.length < version2.length ? 1 : 0);
}

export function compareVersionsString(version1: string, version2: string): number {
    if (version1 !== "" && version2 === "") {
        return 1;
    }
    return compareVersions(lexingVersion(version1), lexingVersion(version2));
}
