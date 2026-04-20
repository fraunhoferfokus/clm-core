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
import BaseModelController from "./BaseModelController";
import { UserModel } from '../models/User/UserModel';
import UserFDTO from "../models/User/UserFDTO";
import UserDAO from "../models/User/UserDAO";
import { Handler } from "express";
import express from 'express';
declare class UserController extends BaseModelController<typeof UserDAO, UserModel, UserFDTO> {
    getOwnUserInformation: express.Handler;
    getUsersGroups(): express.Handler;
    getUsersRoles(): express.Handler;
    deleteOneDocument(): express.Handler;
    createDocument(): Handler;
    verifyToken(): Handler;
    usersPermissions: () => Handler;
}
declare const controller: UserController;
export default controller;
//# sourceMappingURL=UserController.d.ts.map