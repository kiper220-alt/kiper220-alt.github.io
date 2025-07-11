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
import type { SiteWatchByMaintainerElementModel } from './SiteWatchByMaintainerElementModel';
import {
    SiteWatchByMaintainerElementModelFromJSON,
    SiteWatchByMaintainerElementModelFromJSONTyped,
    SiteWatchByMaintainerElementModelToJSON,
} from './SiteWatchByMaintainerElementModel';

/**
 * 
 * @export
 * @interface SiteWatchByMaintainerModel
 */
export interface SiteWatchByMaintainerModel {
    /**
     * request arguments
     * @type {object}
     * @memberof SiteWatchByMaintainerModel
     */
    requestArgs?: object;
    /**
     * number of packages found
     * @type {number}
     * @memberof SiteWatchByMaintainerModel
     */
    length?: number;
    /**
     * found packages
     * @type {Array<SiteWatchByMaintainerElementModel>}
     * @memberof SiteWatchByMaintainerModel
     */
    packages?: Array<SiteWatchByMaintainerElementModel>;
}

/**
 * Check if a given object implements the SiteWatchByMaintainerModel interface.
 */
export function instanceOfSiteWatchByMaintainerModel(value: object): value is SiteWatchByMaintainerModel {
    return true;
}

export function SiteWatchByMaintainerModelFromJSON(json: any): SiteWatchByMaintainerModel {
    return SiteWatchByMaintainerModelFromJSONTyped(json, false);
}

export function SiteWatchByMaintainerModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SiteWatchByMaintainerModel {
    if (json == null) {
        return json;
    }
    return {
        
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'length': json['length'] == null ? undefined : json['length'],
        'packages': json['packages'] == null ? undefined : ((json['packages'] as Array<any>).map(SiteWatchByMaintainerElementModelFromJSON)),
    };
}

export function SiteWatchByMaintainerModelToJSON(value?: SiteWatchByMaintainerModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'request_args': value['requestArgs'],
        'length': value['length'],
        'packages': value['packages'] == null ? undefined : ((value['packages'] as Array<any>).map(SiteWatchByMaintainerElementModelToJSON)),
    };
}

