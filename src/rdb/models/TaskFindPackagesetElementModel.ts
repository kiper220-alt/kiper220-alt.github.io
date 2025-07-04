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
 * @interface TaskFindPackagesetElementModel
 */
export interface TaskFindPackagesetElementModel {
    /**
     * package set name
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    branch?: string;
    /**
     * package set date
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    pkgsetDatetime?: string;
    /**
     * source package name
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    sourcepkgname?: string;
    /**
     * binary packages list
     * @type {Array<string>}
     * @memberof TaskFindPackagesetElementModel
     */
    packages?: Array<string>;
    /**
     * package version
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    version?: string;
    /**
     * package release
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    release?: string;
    /**
     * package disttag
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    disttag?: string;
    /**
     * package packager email
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    packagerEmail?: string;
    /**
     * package build time
     * @type {string}
     * @memberof TaskFindPackagesetElementModel
     */
    buildtime?: string;
    /**
     * binary packages archs
     * @type {Array<string>}
     * @memberof TaskFindPackagesetElementModel
     */
    archs?: Array<string>;
}

/**
 * Check if a given object implements the TaskFindPackagesetElementModel interface.
 */
export function instanceOfTaskFindPackagesetElementModel(value: object): value is TaskFindPackagesetElementModel {
    return true;
}

export function TaskFindPackagesetElementModelFromJSON(json: any): TaskFindPackagesetElementModel {
    return TaskFindPackagesetElementModelFromJSONTyped(json, false);
}

export function TaskFindPackagesetElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskFindPackagesetElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'branch': json['branch'] == null ? undefined : json['branch'],
        'pkgsetDatetime': json['pkgset_datetime'] == null ? undefined : json['pkgset_datetime'],
        'sourcepkgname': json['sourcepkgname'] == null ? undefined : json['sourcepkgname'],
        'packages': json['packages'] == null ? undefined : json['packages'],
        'version': json['version'] == null ? undefined : json['version'],
        'release': json['release'] == null ? undefined : json['release'],
        'disttag': json['disttag'] == null ? undefined : json['disttag'],
        'packagerEmail': json['packager_email'] == null ? undefined : json['packager_email'],
        'buildtime': json['buildtime'] == null ? undefined : json['buildtime'],
        'archs': json['archs'] == null ? undefined : json['archs'],
    };
}

export function TaskFindPackagesetElementModelToJSON(value?: TaskFindPackagesetElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'branch': value['branch'],
        'pkgset_datetime': value['pkgsetDatetime'],
        'sourcepkgname': value['sourcepkgname'],
        'packages': value['packages'],
        'version': value['version'],
        'release': value['release'],
        'disttag': value['disttag'],
        'packager_email': value['packagerEmail'],
        'buildtime': value['buildtime'],
        'archs': value['archs'],
    };
}

