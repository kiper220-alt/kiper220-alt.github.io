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
 * @interface SitePackagesetCategoryElementModel
 */
export interface SitePackagesetCategoryElementModel {
    /**
     * package category
     * @type {string}
     * @memberof SitePackagesetCategoryElementModel
     */
    category?: string;
    /**
     * number of packages in category
     * @type {number}
     * @memberof SitePackagesetCategoryElementModel
     */
    count?: number;
}

/**
 * Check if a given object implements the SitePackagesetCategoryElementModel interface.
 */
export function instanceOfSitePackagesetCategoryElementModel(value: object): value is SitePackagesetCategoryElementModel {
    return true;
}

export function SitePackagesetCategoryElementModelFromJSON(json: any): SitePackagesetCategoryElementModel {
    return SitePackagesetCategoryElementModelFromJSONTyped(json, false);
}

export function SitePackagesetCategoryElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SitePackagesetCategoryElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'category': json['category'] == null ? undefined : json['category'],
        'count': json['count'] == null ? undefined : json['count'],
    };
}

export function SitePackagesetCategoryElementModelToJSON(value?: SitePackagesetCategoryElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'category': value['category'],
        'count': value['count'],
    };
}

