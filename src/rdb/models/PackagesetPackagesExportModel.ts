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
import type { PackagesetPackagesExportElementModel } from './PackagesetPackagesExportElementModel';
import {
    PackagesetPackagesExportElementModelFromJSON,
    PackagesetPackagesExportElementModelFromJSONTyped,
    PackagesetPackagesExportElementModelToJSON,
} from './PackagesetPackagesExportElementModel';

/**
 * 
 * @export
 * @interface PackagesetPackagesExportModel
 */
export interface PackagesetPackagesExportModel {
    /**
     * request arguments
     * @type {object}
     * @memberof PackagesetPackagesExportModel
     */
    requestArgs?: object;
    /**
     * number of binary packages found
     * @type {number}
     * @memberof PackagesetPackagesExportModel
     */
    length?: number;
    /**
     * binary packages information
     * @type {Array<PackagesetPackagesExportElementModel>}
     * @memberof PackagesetPackagesExportModel
     */
    packages?: Array<PackagesetPackagesExportElementModel>;
}

/**
 * Check if a given object implements the PackagesetPackagesExportModel interface.
 */
export function instanceOfPackagesetPackagesExportModel(value: object): value is PackagesetPackagesExportModel {
    return true;
}

export function PackagesetPackagesExportModelFromJSON(json: any): PackagesetPackagesExportModel {
    return PackagesetPackagesExportModelFromJSONTyped(json, false);
}

export function PackagesetPackagesExportModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): PackagesetPackagesExportModel {
    if (json == null) {
        return json;
    }
    return {
        
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'length': json['length'] == null ? undefined : json['length'],
        'packages': json['packages'] == null ? undefined : ((json['packages'] as Array<any>).map(PackagesetPackagesExportElementModelFromJSON)),
    };
}

export function PackagesetPackagesExportModelToJSON(value?: PackagesetPackagesExportModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'request_args': value['requestArgs'],
        'length': value['length'],
        'packages': value['packages'] == null ? undefined : ((value['packages'] as Array<any>).map(PackagesetPackagesExportElementModelToJSON)),
    };
}

