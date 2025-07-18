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
import type { PackageFilesElementModel } from './PackageFilesElementModel';
import {
    PackageFilesElementModelFromJSON,
    PackageFilesElementModelFromJSONTyped,
    PackageFilesElementModelToJSON,
} from './PackageFilesElementModel';

/**
 * 
 * @export
 * @interface PackageFilesModel
 */
export interface PackageFilesModel {
    /**
     * request arguments
     * @type {object}
     * @memberof PackageFilesModel
     */
    requestArgs?: object;
    /**
     * number of files found
     * @type {number}
     * @memberof PackageFilesModel
     */
    length?: number;
    /**
     * package file list
     * @type {Array<PackageFilesElementModel>}
     * @memberof PackageFilesModel
     */
    files?: Array<PackageFilesElementModel>;
}

/**
 * Check if a given object implements the PackageFilesModel interface.
 */
export function instanceOfPackageFilesModel(value: object): value is PackageFilesModel {
    return true;
}

export function PackageFilesModelFromJSON(json: any): PackageFilesModel {
    return PackageFilesModelFromJSONTyped(json, false);
}

export function PackageFilesModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): PackageFilesModel {
    if (json == null) {
        return json;
    }
    return {
        
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'length': json['length'] == null ? undefined : json['length'],
        'files': json['files'] == null ? undefined : ((json['files'] as Array<any>).map(PackageFilesElementModelFromJSON)),
    };
}

export function PackageFilesModelToJSON(value?: PackageFilesModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'request_args': value['requestArgs'],
        'length': value['length'],
        'files': value['files'] == null ? undefined : ((value['files'] as Array<any>).map(PackageFilesElementModelToJSON)),
    };
}

