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
import type { TasksHistoryTaskModel } from './TasksHistoryTaskModel';
import {
    TasksHistoryTaskModelFromJSON,
    TasksHistoryTaskModelFromJSONTyped,
    TasksHistoryTaskModelToJSON,
} from './TasksHistoryTaskModel';
import type { TasksHistoryBranchCommitModel } from './TasksHistoryBranchCommitModel';
import {
    TasksHistoryBranchCommitModelFromJSON,
    TasksHistoryBranchCommitModelFromJSONTyped,
    TasksHistoryBranchCommitModelToJSON,
} from './TasksHistoryBranchCommitModel';

/**
 * 
 * @export
 * @interface SiteTasksHistoryModel
 */
export interface SiteTasksHistoryModel {
    /**
     * list of active branches
     * @type {Array<string>}
     * @memberof SiteTasksHistoryModel
     */
    branches?: Array<string>;
    /**
     * branches tasks list
     * @type {Array<TasksHistoryTaskModel>}
     * @memberof SiteTasksHistoryModel
     */
    tasks?: Array<TasksHistoryTaskModel>;
    /**
     * branches commits list
     * @type {Array<TasksHistoryBranchCommitModel>}
     * @memberof SiteTasksHistoryModel
     */
    branchCommits?: Array<TasksHistoryBranchCommitModel>;
}

/**
 * Check if a given object implements the SiteTasksHistoryModel interface.
 */
export function instanceOfSiteTasksHistoryModel(value: object): value is SiteTasksHistoryModel {
    return true;
}

export function SiteTasksHistoryModelFromJSON(json: any): SiteTasksHistoryModel {
    return SiteTasksHistoryModelFromJSONTyped(json, false);
}

export function SiteTasksHistoryModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): SiteTasksHistoryModel {
    if (json == null) {
        return json;
    }
    return {
        
        'branches': json['branches'] == null ? undefined : json['branches'],
        'tasks': json['tasks'] == null ? undefined : ((json['tasks'] as Array<any>).map(TasksHistoryTaskModelFromJSON)),
        'branchCommits': json['branch_commits'] == null ? undefined : ((json['branch_commits'] as Array<any>).map(TasksHistoryBranchCommitModelFromJSON)),
    };
}

export function SiteTasksHistoryModelToJSON(value?: SiteTasksHistoryModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'branches': value['branches'],
        'tasks': value['tasks'] == null ? undefined : ((value['tasks'] as Array<any>).map(TasksHistoryTaskModelToJSON)),
        'branch_commits': value['branchCommits'] == null ? undefined : ((value['branchCommits'] as Array<any>).map(TasksHistoryBranchCommitModelToJSON)),
    };
}

