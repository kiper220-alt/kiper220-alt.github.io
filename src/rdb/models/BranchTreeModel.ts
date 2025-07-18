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
import type { BranchTreeBranchPointModel } from './BranchTreeBranchPointModel';
import {
    BranchTreeBranchPointModelFromJSON,
    BranchTreeBranchPointModelFromJSONTyped,
    BranchTreeBranchPointModelToJSON,
} from './BranchTreeBranchPointModel';
import type { BranchTreeTaskModel } from './BranchTreeTaskModel';
import {
    BranchTreeTaskModelFromJSON,
    BranchTreeTaskModelFromJSONTyped,
    BranchTreeTaskModelToJSON,
} from './BranchTreeTaskModel';
import type { BranchTreeBranchCommitModel } from './BranchTreeBranchCommitModel';
import {
    BranchTreeBranchCommitModelFromJSON,
    BranchTreeBranchCommitModelFromJSONTyped,
    BranchTreeBranchCommitModelToJSON,
} from './BranchTreeBranchCommitModel';

/**
 * 
 * @export
 * @interface BranchTreeModel
 */
export interface BranchTreeModel {
    /**
     * list of branches
     * @type {Array<string>}
     * @memberof BranchTreeModel
     */
    branches?: Array<string>;
    /**
     * branches tasks list
     * @type {Array<BranchTreeTaskModel>}
     * @memberof BranchTreeModel
     */
    tasks?: Array<BranchTreeTaskModel>;
    /**
     * branches commits list
     * @type {Array<BranchTreeBranchCommitModel>}
     * @memberof BranchTreeModel
     */
    branchCommits?: Array<BranchTreeBranchCommitModel>;
    /**
     * branch points list
     * @type {Array<BranchTreeBranchPointModel>}
     * @memberof BranchTreeModel
     */
    branchPoints?: Array<BranchTreeBranchPointModel>;
}

/**
 * Check if a given object implements the BranchTreeModel interface.
 */
export function instanceOfBranchTreeModel(value: object): value is BranchTreeModel {
    return true;
}

export function BranchTreeModelFromJSON(json: any): BranchTreeModel {
    return BranchTreeModelFromJSONTyped(json, false);
}

export function BranchTreeModelFromJSONTyped(json: any, ignoreDiscriminator: boolean): BranchTreeModel {
    if (json == null) {
        return json;
    }
    return {
        
        'branches': json['branches'] == null ? undefined : json['branches'],
        'tasks': json['tasks'] == null ? undefined : ((json['tasks'] as Array<any>).map(BranchTreeTaskModelFromJSON)),
        'branchCommits': json['branch_commits'] == null ? undefined : ((json['branch_commits'] as Array<any>).map(BranchTreeBranchCommitModelFromJSON)),
        'branchPoints': json['branch_points'] == null ? undefined : ((json['branch_points'] as Array<any>).map(BranchTreeBranchPointModelFromJSON)),
    };
}

export function BranchTreeModelToJSON(value?: BranchTreeModel | null): any {
    if (value == null) {
        return value;
    }
    return {
        
        'branches': value['branches'],
        'tasks': value['tasks'] == null ? undefined : ((value['tasks'] as Array<any>).map(BranchTreeTaskModelToJSON)),
        'branch_commits': value['branchCommits'] == null ? undefined : ((value['branchCommits'] as Array<any>).map(BranchTreeBranchCommitModelToJSON)),
        'branch_points': value['branchPoints'] == null ? undefined : ((value['branchPoints'] as Array<any>).map(BranchTreeBranchPointModelToJSON)),
    };
}

