/* -----------------------------------------------------------------------------
 *  Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, version 3.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program. If not, see <https://www.gnu.org/licenses/>.  
 *
 *  No Patent Rights, Trademark Rights and/or other Intellectual Property
 *  Rights other than the rights under this license are granted.
 *  All other rights reserved.
 *
 *  For any other rights, a separate agreement needs to be closed.
 *
 *  For more information please contact:  
 *  Fraunhofer FOKUS
 *  Kaiserin-Augusta-Allee 31
 *  10589 Berlin, Germany
 *  https://www.fokus.fraunhofer.de/go/fame
 *  famecontact@fokus.fraunhofer.de
 * -----------------------------------------------------------------------------
 */

 

import BaseModelController from '../controllers/BaseModelController';
import AdapterInterface from '../models/AdapterInterface';
import BaseBackendDTO from '../models/BaseBackendDTO';
import BaseDatamodel, { iBaseDatamodel } from '../models/BaseDatamodel';
import BaseFrontendDTO, { iBaseFrontendDTO } from '../models/BaseFrontendDTO';
// DTOS
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
// import redisClient from '../services/redisClient'
import MariaAdapter from '../models/MariaAdapter';
import PathModel, { iPathModel } from '../models/Path/PathModel';
import { ConsumerBDTO, consumerBDTOInstance } from '../models/ServiceConsumer/ConsumerBDTO';
import ConsumerModel, { iConsumerModel, Path } from '../models/ServiceConsumer/ConsumerModel';
import EncryptService from '../services/EncryptService';
import passport from '../passport/passport';
import { roleBDTOInstance } from '../models/Role/RoleBDTO';

declare global {
    namespace Express {
        export interface Request {
            byPass?: boolean
            apiToken: {
                paths?: {
                    route: string,
                    scope: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[]
                }[]
            },
            payload?: any,
            requestingUser?: UserModel & {
                permissions?: {
                    [key: string]: any
                }
            },
            minimumRoleStrength?: number
        }
    }
}


export {
    iUserModel,
    UserModel,
    BaseDAO,
    RelationBDTO,
    BaseBackendDTO,
    iBaseDatamodel,
    BaseFrontendDTO,
    BaseDatamodel,
    iRelationModel,
    RelationModel,
    BaseModelController,
    BaseExtensionCtrl,
    AdapterInterface,
    iBaseFrontendDTO,
    JwtService,
    TokenPayload,
    TokenVerifyResult,
    iGroupModel,
    GroupModel,
    GroupBDTO,
    iConsumerModel,
    ConsumerBDTO,
    ConsumerModel,
    Path,
    UserBDTO,
    iPathModel,
    PathModel,
    PathBDTO,
    GroupPermission,
    UserGroupOptions,
    Role,
    AuthGuard,
    CheckResource,
    UserAuthenticationOptions,
    MariaAdapter,
    PreFetchOptions,
    EncryptService,
    relationBDTOInstance,
    userBDTOInstance,
    pathBDTOInstance,
    errHandler,
    groupBDTOInstance,
    jwtServiceInstance,
    // redisClient,
    consumerBDTOInstance,
    passport,
    roleBDTOInstance
};


