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
 * @interface ImagePackagesElement1Model
 */
export interface ImagePackagesElement1Model {
    /**
     * package hash UInt64 as string
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    hash?: string;
    /**
     * package architecture
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    arch?: string;
    /**
     * package name
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    name?: string;
    /**
     * package epoch
     * @type {number}
     * @memberof ImagePackagesElement1Model
     */
    epoch?: number;
    /**
     * package version
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    version?: string;
    /**
     * package release
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    release?: string;
    /**
     * package disttag
     * @type {string}
     * @memberof ImagePackagesElement1Model
     */
    disttag?: string;
    /**
     * package build time
     * @type {number}
     * @memberof ImagePackagesElement1Model
     */
    buildtime?: number;
}

/**
 * Check if a given object implements the ImagePackagesElement1Model interface.
 */
export function instanceOfImagePackagesElement1Model(value: object): value is ImagePackagesElement1Model {
    return true;
}

export function ImagePackagesElement1ModelFromJSON(json: any): ImagePackagesElement1Model {
    return ImagePackagesElement1ModelFromJSONTyped(json, false);
}

export function ImagePackagesElement1ModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImagePackagesElement1Model {
    if (json == null) {
        return json;
    }
    return {
        
        'hash': json['hash'] == null ? undefined : json['hash'],
        'arch': json['arch'] == null ? undefined : json['arch'],
        'name': json['name'] == null ? undefined : json['name'],
        'epoch': json['epoch'] == null ? undefined : json['epoch'],
        'version': json['version'] == null ? undefined : json['version'],
        'release': json['release'] == null ? undefined : json['release'],
        'disttag': json['disttag'] == null ? undefined : json['disttag'],
        'buildtime': json['buildtime'] == null ? undefined : json['buildtime'],
    };
}

export function ImagePackagesElement1ModelToJSON(value?: ImagePackagesElement1Model | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'hash': value['hash'],
        'arch': value['arch'],
        'name': value['name'],
        'epoch': value['epoch'],
        'version': value['version'],
        'release': value['release'],
        'disttag': value['disttag'],
        'buildtime': value['buildtime'],
    };
}

