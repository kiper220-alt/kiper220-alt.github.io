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
import type { TaskMisconflictPackageModel } from './TaskMisconflictPackageModel';
import {
    TaskMisconflictPackageModelFromJSON,
    TaskMisconflictPackageModelFromJSONTyped,
    TaskMisconflictPackageModelToJSON,
} from './TaskMisconflictPackageModel';

/**
 * 
 * @export
 * @interface TaskMisconflictPackagesModel
 */
export interface TaskMisconflictPackagesModel {
    /**
     * task id
     * @type {number}
     * @memberof TaskMisconflictPackagesModel
     */
    id?: number;
    /**
     * request arguments
     * @type {object}
     * @memberof TaskMisconflictPackagesModel
     */
    requestArgs?: object;
    /**
     * number of packages found
     * @type {number}
     * @memberof TaskMisconflictPackagesModel
     */
    length?: number;
    /**
     * conflicts
     * @type {Array<TaskMisconflictPackageModel>}
     * @memberof TaskMisconflictPackagesModel
     */
    conflicts?: Array<TaskMisconflictPackageModel>;
}

/**
 * Check if a given object implements the TaskMisconflictPackagesModel interface.
 */
export function instanceOfTaskMisconflictPackagesModel(value: object): value is TaskMisconflictPackagesModel {
    return true;
}

export function TaskMisconflictPackagesModelFromJSON(json: any): TaskMisconflictPackagesModel {
    return TaskMisconflictPackagesModelFromJSONTyped(json, false);
}

export function TaskMisconflictPackagesModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskMisconflictPackagesModel {
    if (json == null) {
        return json;
    }
    return {
        
        'id': json['id'] == null ? undefined : json['id'],
        'requestArgs': json['request_args'] == null ? undefined : json['request_args'],
        'length': json['length'] == null ? undefined : json['length'],
        'conflicts': json['conflicts'] == null ? undefined : ((json['conflicts'] as Array<any>).map(TaskMisconflictPackageModelFromJSON)),
    };
}

export function TaskMisconflictPackagesModelToJSON(value?: TaskMisconflictPackagesModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'id': value['id'],
        'request_args': value['requestArgs'],
        'length': value['length'],
        'conflicts': value['conflicts'] == null ? undefined : ((value['conflicts'] as Array<any>).map(TaskMisconflictPackageModelToJSON)),
    };
}

