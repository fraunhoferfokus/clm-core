import BaseDatamodel, { iBaseDatamodel } from '../BaseDatamodel';
/**
 * Subattribute of the payload of {@link iConsumerModel}
 * @public
 */
export interface Path {
    /**
     * The method(s) which can be executed on the express route
     */
    scope: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH')[];
    /**
     * The full path of the express route
     */
    route: string;
}
/**
 * @public
 * The payload which is passed to the constructor of {@link ConsumerModel}
 */
export interface iConsumerModel extends iBaseDatamodel {
    displayName: string;
    active: boolean;
    userId: string;
    domain: string;
    paths: Path[];
}
/**
 * Cnsumer datamodel which is used by {@link ConsumerBDTO}
 * @public
 *
 */
export default class ConsumerModel extends BaseDatamodel implements iConsumerModel {
    paths: Path[];
    constructor(payload: iConsumerModel);
    /**
     * Domain where the api-token is deployed
     */
    domain: string;
    /**
     * Status whether the consumer has been confirmed by double-opt in
     */
    active: boolean;
    /**
     * The user responsible for the deployment of the token
     */
    userId: string;
    /**
     * Name displayed on the frontend
     */
    displayName: string;
}
//# sourceMappingURL=ConsumerModel.d.ts.map