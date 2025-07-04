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
import type { BranchTreeTaskModel } from './BranchTreeTaskModel';
import {
    BranchTreeTaskModelFromJSON,
    BranchTreeTaskModelFromJSONTyped,
    BranchTreeTaskModelToJSON,
} from './BranchTreeTaskModel';

/**
 * 
 * @export
 * @interface BranchTreeBranchPointModel
 */
export interface BranchTreeBranchPointModel {
    /**
     * branch name
     * @type {string}
     * @memberof BranchTreeBranchPointModel
     */
    branch?: string;
    /**
     * first branch' task
     * @type {BranchTreeTaskModel}
     * @memberof BranchTreeBranchPointModel
     */
    task?: BranchTreeTaskModel;
    /**
     * task from parent branch
     * @type {BranchTreeTaskModel}
     * @memberof BranchTreeBranchPointModel
     */
    fromTask?: BranchTreeTaskModel;
}

/**
 * Check if a given object implements the BranchTreeBranchPointModel interface.
 */
export function instanceOfBranchTreeBranchPointModel(value: object): value is BranchTreeBranchPointModel {
    return true;
}

export function BranchTreeBranchPointModelFromJSON(json: any): BranchTreeBranchPointModel {
    return BranchTreeBranchPointModelFromJSONTyped(json, false);
}

export function BranchTreeBranchPointModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): BranchTreeBranchPointModel {
    if (json == null) {
        return json;
    }
    return {
        
        'branch': json['branch'] == null ? undefined : json['branch'],
        'task': json['task'] == null ? undefined : BranchTreeTaskModelFromJSON(json['task']),
        'fromTask': json['from_task'] == null ? undefined : BranchTreeTaskModelFromJSON(json['from_task']),
    };
}

export function BranchTreeBranchPointModelToJSON(value?: BranchTreeBranchPointModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'branch': value['branch'],
        'task': BranchTreeTaskModelToJSON(value['task']),
        'from_task': BranchTreeTaskModelToJSON(value['fromTask']),
    };
}

