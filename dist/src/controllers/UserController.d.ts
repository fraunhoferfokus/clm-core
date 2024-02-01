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