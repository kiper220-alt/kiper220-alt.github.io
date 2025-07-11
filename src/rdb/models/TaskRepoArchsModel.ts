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
import type { TaskRepoPackageModel } from './TaskRepoPackageModel';
import {
    TaskRepoPackageModelFromJSON,
    TaskRepoPackageModelFromJSONTyped,
    TaskRepoPackageModelToJSON,
} from './TaskRepoPackageModel';

/**
 * 
 * @export
 * @interface TaskRepoArchsModel
 */
export interface TaskRepoArchsModel {
    /**
     * architecture
     * @type {string}
     * @memberof TaskRepoArchsModel
     */
    arch?: string;
    /**
     * packages list
     * @type {Array<TaskRepoPackageModel>}
     * @memberof TaskRepoArchsModel
     */
    packages?: Array<TaskRepoPackageModel>;
}

/**
 * Check if a given object implements the TaskRepoArchsModel interface.
 */
export function instanceOfTaskRepoArchsModel(value: object): value is TaskRepoArchsModel {
    return true;
}

export function TaskRepoArchsModelFromJSON(json: any): TaskRepoArchsModel {
    return TaskRepoArchsModelFromJSONTyped(json, false);
}

export function TaskRepoArchsModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskRepoArchsModel {
    if (json == null) {
        return json;
    }
    return {
        
        'arch': json['arch'] == null ? undefined : json['arch'],
        'packages': json['packages'] == null ? undefined : ((json['packages'] as Array<any>).map(TaskRepoPackageModelFromJSON)),
    };
}

export function TaskRepoArchsModelToJSON(value?: TaskRepoArchsModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'arch': value['arch'],
        'packages': value['packages'] == null ? undefined : ((value['packages'] as Array<any>).map(TaskRepoPackageModelToJSON)),
    };
}

