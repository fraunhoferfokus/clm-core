import express from 'express';
import UserDAO from "../models/User/UserDAO";
import UserFDTO from "../models/User/UserFDTO";
import { UserModel } from "../models/User/UserModel";
import BaseModelController from "./BaseModelController";
declare class UserMGMTController extends BaseModelController<typeof UserDAO, UserModel, UserFDTO> {
    getUserRelations(): express.Handler;
    createDocument(): express.Handler;
    updateOneDocument(): express.Handler;
    deleteOneDocument(): express.Handler;
}
declare const controller: UserMGMTController;
export default controller;
//# sourceMappingURL=MgtmUserController.d.ts.map