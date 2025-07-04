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
 * @interface TaskPackagesPackageElementModel
 */
export interface TaskPackagesPackageElementModel {
    /**
     * package name
     * @type {string}
     * @memberof TaskPackagesPackageElementModel
     */
    name?: string;
    /**
     * package epoch
     * @type {number}
     * @memberof TaskPackagesPackageElementModel
     */
    epoch?: number;
    /**
     * package version
     * @type {string}
     * @memberof TaskPackagesPackageElementModel
     */
    version?: string;
    /**
     * package release
     * @type {string}
     * @memberof TaskPackagesPackageElementModel
     */
    release?: string;
    /**
     * package disttag
     * @type {string}
     * @memberof TaskPackagesPackageElementModel
     */
    disttag?: string;
    /**
     * package build time
     * @type {Date}
     * @memberof TaskPackagesPackageElementModel
     */
    buildtime?: Date;
    /**
     * package architecture
     * @type {string}
     * @memberof TaskPackagesPackageElementModel
     */
    arch?: string;
}

/**
 * Check if a given object implements the TaskPackagesPackageElementModel interface.
 */
export function instanceOfTaskPackagesPackageElementModel(value: object): value is TaskPackagesPackageElementModel {
    return true;
}

export function TaskPackagesPackageElementModelFromJSON(json: any): TaskPackagesPackageElementModel {
    return TaskPackagesPackageElementModelFromJSONTyped(json, false);
}

export function TaskPackagesPackageElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskPackagesPackageElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'epoch': json['epoch'] == null ? undefined : json['epoch'],
        'version': json['version'] == null ? undefined : json['version'],
        'release': json['release'] == null ? undefined : json['release'],
        'disttag': json['disttag'] == null ? undefined : json['disttag'],
        'buildtime': json['buildtime'] == null ? undefined : (new Date(json['buildtime'])),
        'arch': json['arch'] == null ? undefined : json['arch'],
    };
}

export function TaskPackagesPackageElementModelToJSON(value?: TaskPackagesPackageElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'epoch': value['epoch'],
        'version': value['version'],
        'release': value['release'],
        'disttag': value['disttag'],
        'buildtime': value['buildtime'] == null ? undefined : ((value['buildtime']).toISOString()),
        'arch': value['arch'],
    };
}

