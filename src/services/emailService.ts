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
 import nodemailer from 'nodemailer'
import { pugEngine } from "nodemailer-pug-engine";
import { CONFIG } from '../config/config';
import path from 'path'
// Resolve from the working directory directly: importing ROOT_DIR from '../server' is a circular
// import, and the value is still undefined while this module is loaded ("undefined/views").
const viewdir = path.join(process.cwd(), 'views');

let transporter = nodemailer.createTransport({
    host: CONFIG.SMTP_HOST,
    port: parseInt(CONFIG.SMTP_PORT!),
    secure: false,
    auth: {
        user: CONFIG.SMTP_USER,
        pass: CONFIG.SMTP_PASS
    },
    tls: {
        // Certificate validation is on by default; only disable it for local test servers.
        rejectUnauthorized: !CONFIG.SMTP_ALLOW_INSECURE_TLS
    }
})

transporter.use('compile', pugEngine({
    templateDir: viewdir,
    pretty: true
}));


export default transporter;

