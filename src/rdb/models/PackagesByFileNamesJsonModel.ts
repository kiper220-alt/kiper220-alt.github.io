/* tslint:disable */
/* eslint-disable */
/**
 * ALTRepo API
 * altrepo API v1
 *
 * The version of the OpenAPI document: 1.19.15
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime';
/**
 * 
 * @export
 * @interface PackagesByFileNamesJsonModel
 */
export interface PackagesByFileNamesJsonModel {
    /**
     * 
     * @type {Array<string>}
     * @memberof PackagesByFileNamesJsonModel
     */
    files: Array<string>;
    /**
     * name of packageset
     * @type {string}
     * @memberof PackagesByFileNamesJsonModel
     */
    branch: string;
    /**
     * packages architecture
     * @type {string}
     * @memberof PackagesByFileNamesJsonModel
     */
    arch?: string;
}

/**
 * Check if a given object implements the PackagesByFileNamesJsonModel interface.
 */
export function instanceOfPackagesByFileNamesJsonModel(value: object): value is PackagesByFileNamesJsonModel {
    if (!('files' in value) || value['files'] === undefined) return false;
    if (!('branch' in value) || value['branch'] === undefined) return false;
    return true;
}

export function PackagesByFileNamesJsonModelFromJSON(json: any): PackagesByFileNamesJsonModel {
    return PackagesByFileNamesJsonModelFromJSONTyped(json, false);
}

export function PackagesByFileNamesJsonModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): PackagesByFileNamesJsonModel {
    if (json == null) {
        return json;
    }
    return {
        
        'files': json['files'],
        'branch': json['branch'],
        'arch': json['arch'] == null ? undefined : json['arch'],
    };
}

export function PackagesByFileNamesJsonModelToJSON(value?: PackagesByFileNamesJsonModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'files': value['files'],
        'branch': value['branch'],
        'arch': value['arch'],
    };
}

