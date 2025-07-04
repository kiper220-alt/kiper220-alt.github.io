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
 * @interface DependenciesPackagesElementModel
 */
export interface DependenciesPackagesElementModel {
    /**
     * package hash UInt64 as string
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    hash?: string;
    /**
     * package name
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    name?: string;
    /**
     * package version
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    version?: string;
    /**
     * package release
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    release?: string;
    /**
     * package arch
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    arch?: string;
    /**
     * package type
     * @type {number}
     * @memberof DependenciesPackagesElementModel
     */
    sourcepackage?: number;
    /**
     * package summary
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    summary?: string;
    /**
     * package buildtime
     * @type {number}
     * @memberof DependenciesPackagesElementModel
     */
    buildtime?: number;
    /**
     * package category
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    category?: string;
    /**
     * package maintainer
     * @type {string}
     * @memberof DependenciesPackagesElementModel
     */
    maintainer?: string;
    /**
     * list of dependency types
     * @type {Array<string>}
     * @memberof DependenciesPackagesElementModel
     */
    dpTypes?: Array<string>;
}

/**
 * Check if a given object implements the DependenciesPackagesElementModel interface.
 */
export function instanceOfDependenciesPackagesElementModel(value: object): value is DependenciesPackagesElementModel {
    return true;
}

export function DependenciesPackagesElementModelFromJSON(json: any): DependenciesPackagesElementModel {
    return DependenciesPackagesElementModelFromJSONTyped(json, false);
}

export function DependenciesPackagesElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): DependenciesPackagesElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'hash': json['hash'] == null ? undefined : json['hash'],
        'name': json['name'] == null ? undefined : json['name'],
        'version': json['version'] == null ? undefined : json['version'],
        'release': json['release'] == null ? undefined : json['release'],
        'arch': json['arch'] == null ? undefined : json['arch'],
        'sourcepackage': json['sourcepackage'] == null ? undefined : json['sourcepackage'],
        'summary': json['summary'] == null ? undefined : json['summary'],
        'buildtime': json['buildtime'] == null ? undefined : json['buildtime'],
        'category': json['category'] == null ? undefined : json['category'],
        'maintainer': json['maintainer'] == null ? undefined : json['maintainer'],
        'dpTypes': json['dp_types'] == null ? undefined : json['dp_types'],
    };
}

export function DependenciesPackagesElementModelToJSON(value?: DependenciesPackagesElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'hash': value['hash'],
        'name': value['name'],
        'version': value['version'],
        'release': value['release'],
        'arch': value['arch'],
        'sourcepackage': value['sourcepackage'],
        'summary': value['summary'],
        'buildtime': value['buildtime'],
        'category': value['category'],
        'maintainer': value['maintainer'],
        'dp_types': value['dpTypes'],
    };
}

