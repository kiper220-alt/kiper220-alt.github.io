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
 * @interface FindImagesByTaskImageElementModel
 */
export interface FindImagesByTaskImageElementModel {
    /**
     * image filename
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    filename?: string;
    /**
     * image edition
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    edition?: string;
    /**
     * image tag
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    tag?: string;
    /**
     * image built date in ISO8601 format
     * @type {Date}
     * @memberof FindImagesByTaskImageElementModel
     */
    buildtime?: Date;
    /**
     * image's binary package name
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    binpkgName?: string;
    /**
     * image's binary package version
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    binpkgVersion?: string;
    /**
     * image's binary package release
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    binpkgRelease?: string;
    /**
     * image's binary package architecture
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    binpkgArch?: string;
    /**
     * image's binary package hash
     * @type {string}
     * @memberof FindImagesByTaskImageElementModel
     */
    binpkgHash?: string;
}

/**
 * Check if a given object implements the FindImagesByTaskImageElementModel interface.
 */
export function instanceOfFindImagesByTaskImageElementModel(value: object): value is FindImagesByTaskImageElementModel {
    return true;
}

export function FindImagesByTaskImageElementModelFromJSON(json: any): FindImagesByTaskImageElementModel {
    return FindImagesByTaskImageElementModelFromJSONTyped(json, false);
}

export function FindImagesByTaskImageElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): FindImagesByTaskImageElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'filename': json['filename'] == null ? undefined : json['filename'],
        'edition': json['edition'] == null ? undefined : json['edition'],
        'tag': json['tag'] == null ? undefined : json['tag'],
        'buildtime': json['buildtime'] == null ? undefined : (new Date(json['buildtime'])),
        'binpkgName': json['binpkg_name'] == null ? undefined : json['binpkg_name'],
        'binpkgVersion': json['binpkg_version'] == null ? undefined : json['binpkg_version'],
        'binpkgRelease': json['binpkg_release'] == null ? undefined : json['binpkg_release'],
        'binpkgArch': json['binpkg_arch'] == null ? undefined : json['binpkg_arch'],
        'binpkgHash': json['binpkg_hash'] == null ? undefined : json['binpkg_hash'],
    };
}

export function FindImagesByTaskImageElementModelToJSON(value?: FindImagesByTaskImageElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'filename': value['filename'],
        'edition': value['edition'],
        'tag': value['tag'],
        'buildtime': value['buildtime'] == null ? undefined : ((value['buildtime']).toISOString()),
        'binpkg_name': value['binpkgName'],
        'binpkg_version': value['binpkgVersion'],
        'binpkg_release': value['binpkgRelease'],
        'binpkg_arch': value['binpkgArch'],
        'binpkg_hash': value['binpkgHash'],
    };
}

