import BaseModelController from '../controllers/BaseModelController';
import AdapterInterface from '../models/AdapterInterface';
import BaseBackendDTO from '../models/BaseBackendDTO';
import BaseDatamodel, { iBaseDatamodel } from '../models/BaseDatamodel';
import BaseFrontendDTO, { iBaseFrontendDTO } from '../models/BaseFrontendDTO';
import { BaseExtensionCtrl } from '../controllers/BaseExtensionCtrl';
import { AuthGuard, CheckResource, UserAuthenticationOptions } from "../handlers/AuthGuard";
import errHandler from '../handlers/ErrorHandler';
import BaseDAO from '../models/BaseDAO';
import { GroupBDTO, groupBDTOInstance } from '../models/Group/GroupBDTO';
import GroupModel, { iGroupModel } from '../models/Group/GroupModel';
import { PathBDTO, pathBDTOInstance } from '../models/Path/PathBDTO';
import relationBDTOInstance, { GroupPermission, PreFetchOptions, RelationBDTO, Role, UserGroupOptions } from '../models/Relation/RelationBDTO';
import RelationModel, { iRelationModel } from '../models/Relation/RelationModel';
import { UserBDTO, userBDTOInstance } from '../models/User/UserBDTO';
import { iUserModel, UserModel } from '../models/User/UserModel';
import { JwtService, jwtServiceInstance, TokenPayload, TokenVerifyResult } from '../services/jwtService';
import MariaAdapter from '../models/MariaAdapter';
import PathModel, { iPathModel } from '../models/Path/PathModel';
import { ConsumerBDTO, consumerBDTOInstance } from '../models/ServiceConsumer/ConsumerBDTO';
import ConsumerModel, { iConsumerModel, Path } from '../models/ServiceConsumer/ConsumerModel';
import EncryptService from '../services/EncryptService';
import passport from '../passport/passport';
import { roleBDTOInstance } from '../models/Role/RoleBDTO';
declare global {
    namespace Express {
        interface Request {
            byPass?: boolean;
            apiToken: {
                paths?: {
                    route: string;
                    scope: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
                }[];
            };
            payload?: any;
            requestingUser?: UserModel & {
                permissions?: {
                    [key: string]: any;
                };
            };
            minimumRoleStrength?: number;
        }
    }
}
export { iUserModel, UserModel, BaseDAO, RelationBDTO, BaseBackendDTO, iBaseDatamodel, BaseFrontendDTO, BaseDatamodel, iRelationModel, RelationModel, BaseModelController, BaseExtensionCtrl, AdapterInterface, iBaseFrontendDTO, JwtService, TokenPayload, TokenVerifyResult, iGroupModel, GroupModel, GroupBDTO, iConsumerModel, ConsumerBDTO, ConsumerModel, Path, UserBDTO, iPathModel, PathModel, PathBDTO, GroupPermission, UserGroupOptions, Role, AuthGuard, CheckResource, UserAuthenticationOptions, MariaAdapter, PreFetchOptions, EncryptService, relationBDTOInstance, userBDTOInstance, pathBDTOInstance, errHandler, groupBDTOInstance, jwtServiceInstance, consumerBDTOInstance, passport, roleBDTOInstance };
//# sourceMappingURL=CoreLib.d.ts.map