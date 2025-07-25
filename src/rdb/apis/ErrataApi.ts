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


import * as runtime from '../runtime';
import type {
  ErrataBranchesModel,
  ErrataBranchesUpdatesModel,
  ErrataIdsListModel,
  ErrataJsonPostListModel,
  ErrataLastChangedModel,
  ErrataPackagesUpdatesModel,
  ErratasModel,
  ImageErrataModel,
  OvalBranchesModel,
} from '../models/index';
import {
    ErrataBranchesModelFromJSON,
    ErrataBranchesModelToJSON,
    ErrataBranchesUpdatesModelFromJSON,
    ErrataBranchesUpdatesModelToJSON,
    ErrataIdsListModelFromJSON,
    ErrataIdsListModelToJSON,
    ErrataJsonPostListModelFromJSON,
    ErrataJsonPostListModelToJSON,
    ErrataLastChangedModelFromJSON,
    ErrataLastChangedModelToJSON,
    ErrataPackagesUpdatesModelFromJSON,
    ErrataPackagesUpdatesModelToJSON,
    ErratasModelFromJSON,
    ErratasModelToJSON,
    ImageErrataModelFromJSON,
    ImageErrataModelToJSON,
    OvalBranchesModelFromJSON,
    OvalBranchesModelToJSON,
} from '../models/index';

export interface GetRouteFindErratasErrataFindErratasRequest {
    input?: Array<string>;
    branch?: string;
    type?: GetRouteFindErratasErrataFindErratasTypeEnum;
    page?: number;
    limit?: number;
    state?: GetRouteFindErratasErrataFindErratasStateEnum;
}

export interface GetRouteFindImageErratasErrataFindImageErratasRequest {
    uuid: string;
    branch: string;
    component?: string;
    input?: Array<string>;
    type?: GetRouteFindImageErratasErrataFindImageErratasTypeEnum;
    page?: number;
    limit?: number;
    isDiscarded?: boolean;
    sort?: Array<string>;
}

export interface GetRouteOvalExportErrataExportOvalStringBranchRequest {
    branch: string;
    packageName?: string;
    oneFile?: boolean;
}

export interface GetRouteSearchErrataSearchRequest {
    branch?: string;
    name?: string;
    vulnId?: string;
    errataId?: string;
}

export interface PostRouteBranchesUpdatesErrataBranchesUpdatesRequest {
    payload: ErrataJsonPostListModel;
}

export interface PostRoutePackagesUpdatesErrataPackagesUpdatesRequest {
    payload: ErrataJsonPostListModel;
}

/**
 * 
 */
export class ErrataApi extends runtime.BaseAPI {

    /**
     * Get list of branches form errata history.
     */
    async getRouteErrataBranchesErrataErrataBranchesRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErrataBranchesModel>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/errata_branches`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErrataBranchesModelFromJSON(jsonValue));
    }

    /**
     * Get list of branches form errata history.
     */
    async getRouteErrataBranchesErrataErrataBranches(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErrataBranchesModel> {
        const response = await this.getRouteErrataBranchesErrataErrataBranchesRaw(initOverrides);
        return await response.value();
    }

    /**
     * Get list of valid Errata identifiers
     */
    async getRouteErrataIdsErrataIdsRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErrataIdsListModel>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/ids`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErrataIdsListModelFromJSON(jsonValue));
    }

    /**
     * Get list of valid Errata identifiers
     */
    async getRouteErrataIdsErrataIds(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErrataIdsListModel> {
        const response = await this.getRouteErrataIdsErrataIdsRaw(initOverrides);
        return await response.value();
    }

    /**
     * Find errata by ID, vulnerability ID or package name.
     */
    async getRouteFindErratasErrataFindErratasRaw(requestParameters: GetRouteFindErratasErrataFindErratasRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErrataLastChangedModel>> {
        const queryParameters: any = {};

        if (requestParameters['input'] != null) {
            queryParameters['input'] = requestParameters['input']!.join(runtime.COLLECTION_FORMATS["csv"]);
        }

        if (requestParameters['branch'] != null) {
            queryParameters['branch'] = requestParameters['branch'];
        }

        if (requestParameters['type'] != null) {
            queryParameters['type'] = requestParameters['type'];
        }

        if (requestParameters['page'] != null) {
            queryParameters['page'] = requestParameters['page'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
        }

        if (requestParameters['state'] != null) {
            queryParameters['state'] = requestParameters['state'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/find_erratas`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErrataLastChangedModelFromJSON(jsonValue));
    }

    /**
     * Find errata by ID, vulnerability ID or package name.
     */
    async getRouteFindErratasErrataFindErratas(requestParameters: GetRouteFindErratasErrataFindErratasRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErrataLastChangedModel> {
        const response = await this.getRouteFindErratasErrataFindErratasRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Find errata by image UUID.
     */
    async getRouteFindImageErratasErrataFindImageErratasRaw(requestParameters: GetRouteFindImageErratasErrataFindImageErratasRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ImageErrataModel>> {
        if (requestParameters['uuid'] == null) {
            throw new runtime.RequiredError(
                'uuid',
                'Required parameter "uuid" was null or undefined when calling getRouteFindImageErratasErrataFindImageErratas().'
            );
        }

        if (requestParameters['branch'] == null) {
            throw new runtime.RequiredError(
                'branch',
                'Required parameter "branch" was null or undefined when calling getRouteFindImageErratasErrataFindImageErratas().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['uuid'] != null) {
            queryParameters['uuid'] = requestParameters['uuid'];
        }

        if (requestParameters['branch'] != null) {
            queryParameters['branch'] = requestParameters['branch'];
        }

        if (requestParameters['component'] != null) {
            queryParameters['component'] = requestParameters['component'];
        }

        if (requestParameters['input'] != null) {
            queryParameters['input'] = requestParameters['input']!.join(runtime.COLLECTION_FORMATS["csv"]);
        }

        if (requestParameters['type'] != null) {
            queryParameters['type'] = requestParameters['type'];
        }

        if (requestParameters['page'] != null) {
            queryParameters['page'] = requestParameters['page'];
        }

        if (requestParameters['limit'] != null) {
            queryParameters['limit'] = requestParameters['limit'];
        }

        if (requestParameters['isDiscarded'] != null) {
            queryParameters['is_discarded'] = requestParameters['isDiscarded'];
        }

        if (requestParameters['sort'] != null) {
            queryParameters['sort'] = requestParameters['sort']!.join(runtime.COLLECTION_FORMATS["csv"]);
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/find_image_erratas`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ImageErrataModelFromJSON(jsonValue));
    }

    /**
     * Find errata by image UUID.
     */
    async getRouteFindImageErratasErrataFindImageErratas(requestParameters: GetRouteFindImageErratasErrataFindImageErratasRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ImageErrataModel> {
        const response = await this.getRouteFindImageErratasErrataFindImageErratasRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get branches with OVAL definitions export available
     */
    async getRouteOvalExportBranchesErrataExportOvalBranchesRaw(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<OvalBranchesModel>> {
        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/export/oval/branches`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => OvalBranchesModelFromJSON(jsonValue));
    }

    /**
     * Get branches with OVAL definitions export available
     */
    async getRouteOvalExportBranchesErrataExportOvalBranches(initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<OvalBranchesModel> {
        const response = await this.getRouteOvalExportBranchesErrataExportOvalBranchesRaw(initOverrides);
        return await response.value();
    }

    /**
     * Get OVAL definitions of closed issues of branch packages
     */
    async getRouteOvalExportErrataExportOvalStringBranchRaw(requestParameters: GetRouteOvalExportErrataExportOvalStringBranchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<void>> {
        if (requestParameters['branch'] == null) {
            throw new runtime.RequiredError(
                'branch',
                'Required parameter "branch" was null or undefined when calling getRouteOvalExportErrataExportOvalStringBranch().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['packageName'] != null) {
            queryParameters['package_name'] = requestParameters['packageName'];
        }

        if (requestParameters['oneFile'] != null) {
            queryParameters['one_file'] = requestParameters['oneFile'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/export/oval/{branch}`.replace(`{${"branch"}}`, encodeURIComponent(String(requestParameters['branch']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.VoidApiResponse(response);
    }

    /**
     * Get OVAL definitions of closed issues of branch packages
     */
    async getRouteOvalExportErrataExportOvalStringBranch(requestParameters: GetRouteOvalExportErrataExportOvalStringBranchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<void> {
        await this.getRouteOvalExportErrataExportOvalStringBranchRaw(requestParameters, initOverrides);
    }

    /**
     * Find erratas by given arguments
     */
    async getRouteSearchErrataSearchRaw(requestParameters: GetRouteSearchErrataSearchRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErratasModel>> {
        const queryParameters: any = {};

        if (requestParameters['branch'] != null) {
            queryParameters['branch'] = requestParameters['branch'];
        }

        if (requestParameters['name'] != null) {
            queryParameters['name'] = requestParameters['name'];
        }

        if (requestParameters['vulnId'] != null) {
            queryParameters['vuln_id'] = requestParameters['vulnId'];
        }

        if (requestParameters['errataId'] != null) {
            queryParameters['errata_id'] = requestParameters['errataId'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/errata/search`,
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErratasModelFromJSON(jsonValue));
    }

    /**
     * Find erratas by given arguments
     */
    async getRouteSearchErrataSearch(requestParameters: GetRouteSearchErrataSearchRequest = {}, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErratasModel> {
        const response = await this.getRouteSearchErrataSearchRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get information about branch update erratas
     */
    async postRouteBranchesUpdatesErrataBranchesUpdatesRaw(requestParameters: PostRouteBranchesUpdatesErrataBranchesUpdatesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErrataBranchesUpdatesModel>> {
        if (requestParameters['payload'] == null) {
            throw new runtime.RequiredError(
                'payload',
                'Required parameter "payload" was null or undefined when calling postRouteBranchesUpdatesErrataBranchesUpdates().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/errata/branches_updates`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: ErrataJsonPostListModelToJSON(requestParameters['payload']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErrataBranchesUpdatesModelFromJSON(jsonValue));
    }

    /**
     * Get information about branch update erratas
     */
    async postRouteBranchesUpdatesErrataBranchesUpdates(requestParameters: PostRouteBranchesUpdatesErrataBranchesUpdatesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErrataBranchesUpdatesModel> {
        const response = await this.postRouteBranchesUpdatesErrataBranchesUpdatesRaw(requestParameters, initOverrides);
        return await response.value();
    }

    /**
     * Get information about package update erratas
     */
    async postRoutePackagesUpdatesErrataPackagesUpdatesRaw(requestParameters: PostRoutePackagesUpdatesErrataPackagesUpdatesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<ErrataPackagesUpdatesModel>> {
        if (requestParameters['payload'] == null) {
            throw new runtime.RequiredError(
                'payload',
                'Required parameter "payload" was null or undefined when calling postRoutePackagesUpdatesErrataPackagesUpdates().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        headerParameters['Content-Type'] = 'application/json';

        const response = await this.request({
            path: `/errata/packages_updates`,
            method: 'POST',
            headers: headerParameters,
            query: queryParameters,
            body: ErrataJsonPostListModelToJSON(requestParameters['payload']),
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => ErrataPackagesUpdatesModelFromJSON(jsonValue));
    }

    /**
     * Get information about package update erratas
     */
    async postRoutePackagesUpdatesErrataPackagesUpdates(requestParameters: PostRoutePackagesUpdatesErrataPackagesUpdatesRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<ErrataPackagesUpdatesModel | null | undefined > {
        const response = await this.postRoutePackagesUpdatesErrataPackagesUpdatesRaw(requestParameters, initOverrides);
        switch (response.raw.status) {
            case 201:
                return null;
            case 200:
                return await response.value();
            default:
                return await response.value();
        }
    }

}

/**
 * @export
 */
export const GetRouteFindErratasErrataFindErratasTypeEnum = {
    Packages: 'packages',
    Repository: 'repository',
    Bug: 'bug',
    Vuln: 'vuln'
} as const;
export type GetRouteFindErratasErrataFindErratasTypeEnum = typeof GetRouteFindErratasErrataFindErratasTypeEnum[keyof typeof GetRouteFindErratasErrataFindErratasTypeEnum];
/**
 * @export
 */
export const GetRouteFindErratasErrataFindErratasStateEnum = {
    All: 'all',
    Active: 'active',
    Discarded: 'discarded'
} as const;
export type GetRouteFindErratasErrataFindErratasStateEnum = typeof GetRouteFindErratasErrataFindErratasStateEnum[keyof typeof GetRouteFindErratasErrataFindErratasStateEnum];
/**
 * @export
 */
export const GetRouteFindImageErratasErrataFindImageErratasTypeEnum = {
    Packages: 'packages',
    Repository: 'repository',
    Bug: 'bug',
    Vuln: 'vuln'
} as const;
export type GetRouteFindImageErratasErrataFindImageErratasTypeEnum = typeof GetRouteFindImageErratasErrataFindImageErratasTypeEnum[keyof typeof GetRouteFindImageErratasErrataFindImageErratasTypeEnum];
