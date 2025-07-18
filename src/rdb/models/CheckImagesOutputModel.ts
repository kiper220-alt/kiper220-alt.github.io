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
import type { CheckImagesOutputImageModel } from './CheckImagesOutputImageModel';
import {
    CheckImagesOutputImageModelFromJSON,
    CheckImagesOutputImageModelFromJSONTyped,
    CheckImagesOutputImageModelToJSON,
} from './CheckImagesOutputImageModel';
import type { CheckImagesOutputPackageModel } from './CheckImagesOutputPackageModel';
import {
    CheckImagesOutputPackageModelFromJSON,
    CheckImagesOutputPackageModelFromJSONTyped,
    CheckImagesOutputPackageModelToJSON,
} from './CheckImagesOutputPackageModel';

/**
 * 
 * @export
 * @interface CheckImagesOutputModel
 */
export interface CheckImagesOutputModel {
    /**
     * request arguments
     * @type {object}
     * @memberof CheckImagesOutputModel
     */
    requestArgs?: object;
    /**
     * list of images with binary packages
     * @type {Array<CheckImagesOutputImageModel>}
     * @memberof CheckImagesOutputModel
     */
    inImages?: Array<CheckImagesOutputImageModel>;
    /**
     * list of binary packages which doesn't belong to any image
     * @type {Array<CheckImagesOutputPackageModel>}
     * @memberof CheckImagesOutputModel
     */
    notInImages?: Array<CheckImagesOutputPackageModel>;
}

/**
 * Check if a given object implements the CheckImagesOutputModel interface.
 */
export function instanceOfCheckImagesOutputModel(value: object): value is CheckImagesOutputModel {
    return true;
}

export function CheckImagesOutputModelFromJSON(json: any): CheckImagesOutputModel {
    return CheckImagesOutputModelFromJSONTyped(json, false);
}

export function CheckImagesOutputModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): CheckImagesOutputModel {
    if (json == null) {
        return json;
    }
    return {
        
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'inImages': json['in_images'] == null ? undefined : ((json['in_images'] as Array<any>).map(CheckImagesOutputImageModelFromJSON)),
        'notInImages': json['not_in_images'] == null ? undefined : ((json['not_in_images'] as Array<any>).map(CheckImagesOutputPackageModelFromJSON)),
    };
}

export function CheckImagesOutputModelToJSON(value?: CheckImagesOutputModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'request_args': value['requestArgs'],
        'in_images': value['inImages'] == null ? undefined : ((value['inImages'] as Array<any>).map(CheckImagesOutputImageModelToJSON)),
        'not_in_images': value['notInImages'] == null ? undefined : ((value['notInImages'] as Array<any>).map(CheckImagesOutputPackageModelToJSON)),
    };
}

