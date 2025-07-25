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
 * @interface TaskHistoryElementModel
 */
export interface TaskHistoryElementModel {
    /**
     * task id
     * @type {number}
     * @memberof TaskHistoryElementModel
     */
    taskId?: number;
    /**
     * task commited date in ISO8601 format
     * @type {string}
     * @memberof TaskHistoryElementModel
     */
    taskCommited?: string;
    /**
     * branch commited date in ISO8601 format
     * @type {string}
     * @memberof TaskHistoryElementModel
     */
    branchCommited?: string;
}

/**
 * Check if a given object implements the TaskHistoryElementModel interface.
 */
export function instanceOfTaskHistoryElementModel(value: object): value is TaskHistoryElementModel {
    return true;
}

export function TaskHistoryElementModelFromJSON(json: any): TaskHistoryElementModel {
    return TaskHistoryElementModelFromJSONTyped(json, false);
}

export function TaskHistoryElementModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): TaskHistoryElementModel {
    if (json == null) {
        return json;
    }
    return {
        
        'taskId': json['task_id'] == null ? undefined : json['task_id'],
        'taskCommited': json['task_commited'] == null ? undefined : json['task_commited'],
        'branchCommited': json['branch_commited'] == null ? undefined : json['branch_commited'],
    };
}

export function TaskHistoryElementModelToJSON(value?: TaskHistoryElementModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'task_id': value['taskId'],
        'task_commited': value['taskCommited'],
        'branch_commited': value['branchCommited'],
    };
}

