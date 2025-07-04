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
import type { SitePackageVersionsElementModel } from './SitePackageVersionsElementModel';
import {
    SitePackageVersionsElementModelFromJSON,
    SitePackageVersionsElementModelFromJSONTyped,
    SitePackageVersionsElementModelToJSON,
} from './SitePackageVersionsElementModel';

/**
 * 
 * @export
 * @interface SiteFingPackagesPackageModel
 */
export interface SiteFingPackagesPackageModel {
    /**
     * package name
     * @type {string}
     * @memberof SiteFingPackagesPackageModel
     */
    name?: string;
    /**
     * package build time
     * @type {number}
     * @memberof SiteFingPackagesPackageModel
     */
    buildtime?: number;
    /**
     * package url
     * @type {string}
     * @memberof SiteFingPackagesPackageModel
     */
    url?: string;
    /**
     * package summary
     * @type {string}
     * @memberof SiteFingPackagesPackageModel
     */
    summary?: string;
    /**
     * package category
     * @type {string}
     * @memberof SiteFingPackagesPackageModel
     */
    category?: string;
    /**
     * all package versions
     * @type {Array<SitePackageVersionsElementModel>}
     * @memberof SiteFingPackagesPackageModel
     */
    versions?: Array<SitePackageVersionsElementModel>;
    /**
     * found by binary package name
     * @type {boolean}
     * @memberof SiteFingPackagesPackageModel
     */
    byBinary?: boolean;
}

/**
 * Check if a given object implements the SiteFingPackagesPackageModel interface.
 */
export function instanceOfSiteFingPackagesPackageModel(value: object): value is SiteFingPackagesPackageModel {
    return true;
}

export function SiteFingPackagesPackageModelFromJSON(json: any): SiteFingPackagesPackageModel {
    return SiteFingPackagesPackageModelFromJSONTyped(json, false);
}

export function SiteFingPackagesPackageModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SiteFingPackagesPackageModel {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'buildtime': json['buildtime'] == null ? undefined : json['buildtime'],
        'url': json['url'] == null ? undefined : json['url'],
        'summary': json['summary'] == null ? undefined : json['summary'],
        'category': json['category'] == null ? undefined : json['category'],
        'versions': json['versions'] == null ? undefined : ((json['versions'] as Array<any>).map(SitePackageVersionsElementModelFromJSON)),
        'byBinary': json['by_binary'] == null ? undefined : json['by_binary'],
    };
}

export function SiteFingPackagesPackageModelToJSON(value?: SiteFingPackagesPackageModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'buildtime': value['buildtime'],
        'url': value['url'],
        'summary': value['summary'],
        'category': value['category'],
        'versions': value['versions'] == null ? undefined : ((value['versions'] as Array<any>).map(SitePackageVersionsElementModelToJSON)),
        'by_binary': value['byBinary'],
    };
}

