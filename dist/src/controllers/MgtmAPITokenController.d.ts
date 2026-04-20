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