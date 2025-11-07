import { Handler } from 'express';
import BaseModelController from './BaseModelController';
import ConsumerDAO from '../models/ServiceConsumer/ConsumerDAO';
import ConsumerModel from '../models/ServiceConsumer/ConsumerModel';
import ConsumerFDTO from '../models/ServiceConsumer/ConsumerFDTO';
import express from 'express';
declare class MgtmTokenController extends BaseModelController<typeof ConsumerDAO, ConsumerModel, ConsumerFDTO> {
    createDocument(): Handler;
    confirmAPIKey(): express.Handler;
}
declare const controller: MgtmTokenController;
export default controller;
//# sourceMappingURL=MgtmAPITokenController.d.ts.map