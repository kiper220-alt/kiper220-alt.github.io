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
 * @interface SiteFastPackagesSearchElementModel
 */
export interface SiteFastPackagesSearchElementModel {
    /**
     * package name
     * @type {string}
     * @memberof SiteFastPackagesSearchElementModel
     */
    name?: string;
    /**
     * package type
     * @type {string}
     * @memberof SiteFastPackagesSearchElementModel
     */
    sourcepackage?: string;
    /**
     * list of package branches
     * @type {Array<string>}
     * @memberof SiteFastPackagesSearchElementModel
     */
    branches?: Array<string>;
}

/**
 * Check if a given object implements the SiteFastPackagesSearchElementModel interface.
 */
export function instanceOfSiteFastPackagesSearchElementModel(value: object): value is SiteFastPackagesSearchElementModel {
    return true;
}

export function SiteFastPackagesSearchElementModelFromJSON(json: any): SiteFastPackagesSearchElementModel {
    return SiteFastPackagesSearchElementModelFromJSONTyped(json, false);
}

export function SiteFastPackagesSearchElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SiteFastPackagesSearchElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'sourcepackage': json['sourcepackage'] == null ? undefined : json['sourcepackage'],
        'branches': json['branches'] == null ? undefined : json['branches'],
    };
}

export function SiteFastPackagesSearchElementModelToJSON(value?: SiteFastPackagesSearchElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'sourcepackage': value['sourcepackage'],
        'branches': value['branches'],
    };
}

