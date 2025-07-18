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
 * @interface SitePackagesBinaryListElementModel
 */
export interface SitePackagesBinaryListElementModel {
    /**
     * package hash UInt64 as string
     * @type {string}
     * @memberof SitePackagesBinaryListElementModel
     */
    hash?: string;
    /**
     * package name
     * @type {string}
     * @memberof SitePackagesBinaryListElementModel
     */
    name?: string;
    /**
     * package version
     * @type {string}
     * @memberof SitePackagesBinaryListElementModel
     */
    version?: string;
    /**
     * package release
     * @type {string}
     * @memberof SitePackagesBinaryListElementModel
     */
    release?: string;
    /**
     * package arch
     * @type {string}
     * @memberof SitePackagesBinaryListElementModel
     */
    arch?: string;
}

/**
 * Check if a given object implements the SitePackagesBinaryListElementModel interface.
 */
export function instanceOfSitePackagesBinaryListElementModel(value: object): value is SitePackagesBinaryListElementModel {
    return true;
}

export function SitePackagesBinaryListElementModelFromJSON(json: any): SitePackagesBinaryListElementModel {
    return SitePackagesBinaryListElementModelFromJSONTyped(json, false);
}

export function SitePackagesBinaryListElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SitePackagesBinaryListElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'hash': json['hash'] == null ? undefined : json['hash'],
        'name': json['name'] == null ? undefined : json['name'],
        'version': json['version'] == null ? undefined : json['version'],
        'release': json['release'] == null ? undefined : json['release'],
        'arch': json['arch'] == null ? undefined : json['arch'],
    };
}

export function SitePackagesBinaryListElementModelToJSON(value?: SitePackagesBinaryListElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'hash': value['hash'],
        'name': value['name'],
        'version': value['version'],
        'release': value['release'],
        'arch': value['arch'],
    };
}

