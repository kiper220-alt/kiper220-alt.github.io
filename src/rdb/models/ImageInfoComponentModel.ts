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
 * @interface ImageInfoComponentModel
 */
export interface ImageInfoComponentModel {
    /**
     * Component name
     * @type {string}
     * @memberof ImageInfoComponentModel
     */
    name?: string;
    /**
     * Component size (human readable)
     * @type {string}
     * @memberof ImageInfoComponentModel
     */
    size?: string;
    /**
     * Component packages count
     * @type {number}
     * @memberof ImageInfoComponentModel
     */
    packages?: number;
    /**
     * Component package set UUID
     * @type {string}
     * @memberof ImageInfoComponentModel
     */
    uuid?: string;
    /**
     * Component package set root UUID
     * @type {string}
     * @memberof ImageInfoComponentModel
     */
    ruuid?: string;
    /**
     * Component metadata
     * @type {object}
     * @memberof ImageInfoComponentModel
     */
    kv?: object;
}

/**
 * Check if a given object implements the ImageInfoComponentModel interface.
 */
export function instanceOfImageInfoComponentModel(value: object): value is ImageInfoComponentModel {
    return true;
}

export function ImageInfoComponentModelFromJSON(json: any): ImageInfoComponentModel {
    return ImageInfoComponentModelFromJSONTyped(json, false);
}

export function ImageInfoComponentModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImageInfoComponentModel {
    if (json == null) {
        return json;
    }
    return {
        
        'name': json['name'] == null ? undefined : json['name'],
        'size': json['size'] == null ? undefined : json['size'],
        'packages': json['packages'] == null ? undefined : json['packages'],
        'uuid': json['uuid'] == null ? undefined : json['uuid'],
        'ruuid': json['ruuid'] == null ? undefined : json['ruuid'],
        'kv': json['kv'] == null ? undefined : json['kv'],
    };
}

export function ImageInfoComponentModelToJSON(value?: ImageInfoComponentModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'name': value['name'],
        'size': value['size'],
        'packages': value['packages'],
        'uuid': value['uuid'],
        'ruuid': value['ruuid'],
        'kv': value['kv'],
    };
}

