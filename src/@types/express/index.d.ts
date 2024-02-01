/* -
 * Copyright (c) 2023, Fraunhofer-Gesellschaft zur Förderung der angewandten Forschung e.V.
 * All rights reserved.
 *
 * For more information please contact:
 * Fraunhofer FOKUS
 * Kaiserin-Augusta-Allee 31
 * 10589 Berlin, Germany
 * https://www.fokus.fraunhofer.de/go/fame
 * famecontact@fokus.fraunhofer.de
 * -
 */

 import { UserModel } from "../../lib/CoreLib"

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
            requestingUser?: UserModel
        }
    }
}


