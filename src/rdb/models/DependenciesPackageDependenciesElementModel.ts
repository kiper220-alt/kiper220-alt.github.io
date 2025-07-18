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
 * @interface DependenciesPackageDependenciesElementModel
 */
export interface DependenciesPackageDependenciesElementModel {
    /**
     * the name of the dependent package
     * @type {string}
     * @memberof DependenciesPackageDependenciesElementModel
     */
    name?: string;
    /**
     * the version of the dependent package
     * @type {string}
     * @memberof DependenciesPackageDependenciesElementModel
     */
    version?: string;
    /**
     * dependency type
     * @type {string}
     * @memberof DependenciesPackageDependenciesElementModel
     */
    type?: string;
    /**
     * dependency flag
     * @type {number}
     * @memberof DependenciesPackageDependenciesElementModel
     */
    flag?: number;
    /**
     * decoded dependency flag
     * @type {Array<string>}
     * @memberof DependenciesPackageDependenciesElementModel
     */
    flagDecoded?: Array<string>;
}

/**
 * Check if a given object implements the DependenciesPackageDependenciesElementModel interface.
 */
export function instanceOfDependenciesPackageDependenciesElementModel(value: object): value is DependenciesPackageDependenciesElementModel {
    return true;
}

export function DependenciesPackageDependenciesElementModelFromJSON(json: any): DependenciesPackageDependenciesElementModel {
    return DependenciesPackageDependenciesElementModelFromJSONTyped(json, false);
}

export function DependenciesPackageDependenciesElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): DependenciesPackageDependenciesElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'version': json['version'] == null ? undefined : json['version'],
        'type': json['type'] == null ? undefined : json['type'],
        'flag': json['flag'] == null ? undefined : json['flag'],
        'flagDecoded': json['flag_decoded'] == null ? undefined : json['flag_decoded'],
    };
}

export function DependenciesPackageDependenciesElementModelToJSON(value?: DependenciesPackageDependenciesElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'version': value['version'],
        'type': value['type'],
        'flag': value['flag'],
        'flag_decoded': value['flagDecoded'],
    };
}

