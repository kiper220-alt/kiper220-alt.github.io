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
 * @interface PackageFilesElementModel
 */
export interface PackageFilesElementModel {
    /**
     * file name
     * @type {string}
     * @memberof PackageFilesElementModel
     */
    fileName?: string;
    /**
     * human readable file size
     * @type {string}
     * @memberof PackageFilesElementModel
     */
    fileSize?: string;
    /**
     * file class
     * @type {string}
     * @memberof PackageFilesElementModel
     */
    fileClass?: string;
    /**
     * link path
     * @type {string}
     * @memberof PackageFilesElementModel
     */
    symlink?: string;
    /**
     * file modification time
     * @type {Date}
     * @memberof PackageFilesElementModel
     */
    fileMtime?: Date;
    /**
     * file permissions string representation
     * @type {string}
     * @memberof PackageFilesElementModel
     */
    fileMode?: string;
}

/**
 * Check if a given object implements the PackageFilesElementModel interface.
 */
export function instanceOfPackageFilesElementModel(value: object): value is PackageFilesElementModel {
    return true;
}

export function PackageFilesElementModelFromJSON(json: any): PackageFilesElementModel {
    return PackageFilesElementModelFromJSONTyped(json, false);
}

export function PackageFilesElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): PackageFilesElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'fileName': json['file_name'] == null ? undefined : json['file_name'],
        'fileSize': json['file_size'] == null ? undefined : json['file_size'],
        'fileClass': json['file_class'] == null ? undefined : json['file_class'],
        'symlink': json['symlink'] == null ? undefined : json['symlink'],
        'fileMtime': json['file_mtime'] == null ? undefined : (new Date(json['file_mtime'])),
        'fileMode': json['file_mode'] == null ? undefined : json['file_mode'],
    };
}

export function PackageFilesElementModelToJSON(value?: PackageFilesElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'file_name': value['fileName'],
        'file_size': value['fileSize'],
        'file_class': value['fileClass'],
        'symlink': value['symlink'],
        'file_mtime': value['fileMtime'] == null ? undefined : ((value['fileMtime']).toISOString()),
        'file_mode': value['fileMode'],
    };
}

