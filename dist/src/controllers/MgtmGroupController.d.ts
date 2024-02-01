import BaseModelController from "./BaseModelController";
import express from 'express';
import GroupDAO from "../models/Group/GroupDAO";
import GroupModel from "../models/Group/GroupModel";
import GroupFDTO from "../models/Group/GroupFDTO";
declare class MgtmGroupController extends BaseModelController<typeof GroupDAO, GroupModel, GroupFDTO> {
    getAllGroupRelations(): express.Handler;
    addUserToGroup(): express.Handler;
    deleteUserFromGroup(): express.Handler;
    addGroupToGroup(): express.Handler;
}
declare const controller: MgtmGroupController;
export default controller;
//# sourceMappingURL=MgtmGroupController.d.ts.map