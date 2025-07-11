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
 * @interface CheckImagesInputFilterModel
 */
export interface CheckImagesInputFilterModel {
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    editions?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    releases?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    versions?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    archs?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    variants?: Array<string>;
    /**
     * 
     * @type {Array<string>}
     * @memberof CheckImagesInputFilterModel
     */
    types?: Array<string>;
}

/**
 * Check if a given object implements the CheckImagesInputFilterModel interface.
 */
export function instanceOfCheckImagesInputFilterModel(value: object): value is CheckImagesInputFilterModel {
    return true;
}

export function CheckImagesInputFilterModelFromJSON(json: any): CheckImagesInputFilterModel {
    return CheckImagesInputFilterModelFromJSONTyped(json, false);
}

export function CheckImagesInputFilterModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): CheckImagesInputFilterModel {
    if (json == null) {
        return json;
    }
    return {
        
        'editions': json['editions'] == null ? undefined : json['editions'],
        'releases': json['releases'] == null ? undefined : json['releases'],
        'versions': json['versions'] == null ? undefined : json['versions'],
        'archs': json['archs'] == null ? undefined : json['archs'],
        'variants': json['variants'] == null ? undefined : json['variants'],
        'types': json['types'] == null ? undefined : json['types'],
    };
}

export function CheckImagesInputFilterModelToJSON(value?: CheckImagesInputFilterModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'editions': value['editions'],
        'releases': value['releases'],
        'versions': value['versions'],
        'archs': value['archs'],
        'variants': value['variants'],
        'types': value['types'],
    };
}

