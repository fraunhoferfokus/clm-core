"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../config/config");
/**
 * Err handler which should be invoked if an error occurs in an express application
 * @public
 */
const errHandler = (err, req, res, next) => {
    var _a, _b, _c;
    if (config_1.CONFIG.DISABLE_ERR_RESPONSE === 'true') {
        console.error((err === null || err === void 0 ? void 0 : err.message) || JSON.stringify(err));
        return res.status((_a = err.status) !== null && _a !== void 0 ? _a : 500).send();
    }
    else {
        return res.status((_b = err.status) !== null && _b !== void 0 ? _b : 500).json({ message: (_c = err === null || err === void 0 ? void 0 : err.message) !== null && _c !== void 0 ? _c : err });
    }
};
exports.default = errHandler;
