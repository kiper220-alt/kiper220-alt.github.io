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
import type { ImagePackagesElement1Model } from './ImagePackagesElement1Model';
import {
    ImagePackagesElement1ModelFromJSON,
    ImagePackagesElement1ModelFromJSONTyped,
    ImagePackagesElement1ModelToJSON,
} from './ImagePackagesElement1Model';
import type { ImagePackagesElement2Model } from './ImagePackagesElement2Model';
import {
    ImagePackagesElement2ModelFromJSON,
    ImagePackagesElement2ModelFromJSONTyped,
    ImagePackagesElement2ModelToJSON,
} from './ImagePackagesElement2Model';

/**
 * 
 * @export
 * @interface ImagePackagesInspectRegularModel
 */
export interface ImagePackagesInspectRegularModel {
    /**
     * request arguments
     * @type {object}
     * @memberof ImagePackagesInspectRegularModel
     */
    requestArgs?: object;
    /**
     * number of input packages
     * @type {number}
     * @memberof ImagePackagesInspectRegularModel
     */
    inputPakages?: number;
    /**
     * number of packages not found in branch
     * @type {number}
     * @memberof ImagePackagesInspectRegularModel
     */
    notInBranch?: number;
    /**
     * number of packages found in build tasks
     * @type {number}
     * @memberof ImagePackagesInspectRegularModel
     */
    foundInTasks?: number;
    /**
     * number of packages not found in database
     * @type {number}
     * @memberof ImagePackagesInspectRegularModel
     */
    notFoundInDb?: number;
    /**
     * list of packages that not in branch but found in build tasks
     * @type {Array<ImagePackagesElement2Model>}
     * @memberof ImagePackagesInspectRegularModel
     */
    packagesInTasks?: Array<ImagePackagesElement2Model>;
    /**
     * list of packages that not found in database
     * @type {Array<ImagePackagesElement1Model>}
     * @memberof ImagePackagesInspectRegularModel
     */
    packagesNotInDb?: Array<ImagePackagesElement1Model>;
}

/**
 * Check if a given object implements the ImagePackagesInspectRegularModel interface.
 */
export function instanceOfImagePackagesInspectRegularModel(value: object): value is ImagePackagesInspectRegularModel {
    return true;
}

export function ImagePackagesInspectRegularModelFromJSON(json: any): ImagePackagesInspectRegularModel {
    return ImagePackagesInspectRegularModelFromJSONTyped(json, false);
}

export function ImagePackagesInspectRegularModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): ImagePackagesInspectRegularModel {
    if (json == null) {
        return json;
    }
    return {
        
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'inputPakages': json['input_pakages'] == null ? undefined : json['input_pakages'],
        'notInBranch': json['not_in_branch'] == null ? undefined : json['not_in_branch'],
        'foundInTasks': json['found_in_tasks'] == null ? undefined : json['found_in_tasks'],
        'notFoundInDb': json['not_found_in_db'] == null ? undefined : json['not_found_in_db'],
        'packagesInTasks': json['packages_in_tasks'] == null ? undefined : ((json['packages_in_tasks'] as Array<any>).map(ImagePackagesElement2ModelFromJSON)),
        'packagesNotInDb': json['packages_not_in_db'] == null ? undefined : ((json['packages_not_in_db'] as Array<any>).map(ImagePackagesElement1ModelFromJSON)),
    };
}

export function ImagePackagesInspectRegularModelToJSON(value?: ImagePackagesInspectRegularModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'request_args': value['requestArgs'],
        'input_pakages': value['inputPakages'],
        'not_in_branch': value['notInBranch'],
        'found_in_tasks': value['foundInTasks'],
        'not_found_in_db': value['notFoundInDb'],
        'packages_in_tasks': value['packagesInTasks'] == null ? undefined : ((value['packagesInTasks'] as Array<any>).map(ImagePackagesElement2ModelToJSON)),
        'packages_not_in_db': value['packagesNotInDb'] == null ? undefined : ((value['packagesNotInDb'] as Array<any>).map(ImagePackagesElement1ModelToJSON)),
    };
}

