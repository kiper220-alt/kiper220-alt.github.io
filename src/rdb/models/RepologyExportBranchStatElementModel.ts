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
 * @interface RepologyExportBranchStatElementModel
 */
export interface RepologyExportBranchStatElementModel {
    /**
     * source package arch
     * @type {string}
     * @memberof RepologyExportBranchStatElementModel
     */
    arch?: string;
    /**
     * count of source packages by binary packages arch
     * @type {number}
     * @memberof RepologyExportBranchStatElementModel
     */
    count?: number;
}

/**
 * Check if a given object implements the RepologyExportBranchStatElementModel interface.
 */
export function instanceOfRepologyExportBranchStatElementModel(value: object): value is RepologyExportBranchStatElementModel {
    return true;
}

export function RepologyExportBranchStatElementModelFromJSON(json: any): RepologyExportBranchStatElementModel {
    return RepologyExportBranchStatElementModelFromJSONTyped(json, false);
}

export function RepologyExportBranchStatElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): RepologyExportBranchStatElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'arch': json['arch'] == null ? undefined : json['arch'],
        'count': json['count'] == null ? undefined : json['count'],
    };
}

export function RepologyExportBranchStatElementModelToJSON(value?: RepologyExportBranchStatElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'arch': value['arch'],
        'count': value['count'],
    };
}

