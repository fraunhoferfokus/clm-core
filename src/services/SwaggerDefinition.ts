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

 import { Components, OAS3Definition, PathItem, Schema } from "swagger-jsdoc";
import { CONFIG } from "../config/config";
import { ROOT_DIR } from "../../server";


const deployUrl = CONFIG.DEPLOY_URL

/**
 * @public
 * Static class to create the swagger documentation of clm-extensions/clm-core
 */

export default class SwaggerDefinition {

    private static standardResponses = {
        "401": {
            description: 'API-Token/JWT unauthorized',
        },
        "403": {
            description: 'API-Token/JWT not sufficient permissions',
        },
        "404": {
            description: 'Resource not found',
        },
        "500": {
            description: 'Internal server error',
        }
    }

    /**
     * The current Open API 3.0 definition  {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | OAS3Definition}
     */
    static definition: OAS3Definition = {
        openapi: '3.0.0',
        paths: {},
        components: {
            schemas: {
                relation: {
                    properties: {
                        fromType: {
                            type: 'string',
                            description: 'The type of the node',
                            default: 'fromTypeNode'
                        },
                        toType: {
                            type: 'string',
                            description: 'The type of the target node',
                            default: 'toTypeNode'

                        },
                        fromId: {
                            type: 'string',
                            description: 'The id of the node',
                            default: 'fromNodeId'
                        },
                        toId: {
                            type: 'string',
                            description: 'The id of the target node',
                            default: 'toNodeId'

                        },
                        order: {
                            type: 'number',
                            description: 'The order of the relation. Used for example ordering the enrollments of a group/user',
                            default: 0

                        }
                    }
                }

            },
            responses: {},
            parameters: {
                accessToken:
                {
                    name: 'x-access-token',
                    in: 'header',
                    description: 'The access token',
                    required: true,
                    example: 'exampleAccessToken',
                    schema:
                        { type: 'string' }
                }

            },
            examples: {},
            requestBodies: {},
            headers: {},
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer'
                },
                refreshAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'x-refresh-token'
                }
            },
            callbacks: {}

        },
        info: {
            title: 'Middleware API',
            description: 'Common Learning Middleware (CLM)',
            version: '1.0.0',
        },
        servers: [
            { url: deployUrl! || `http://localhost:${CONFIG.PORT}` }
        ],
        security: [{
            bearerAuth: [],

        }],
        tags: [
            {
                name: 'pblc',
                description: 'Routes which are public available and requested by consumers.'
            },
            {
                name: 'pblc-redirect',
                description: 'Routes which are public and available through consumers but which are usually not requested seperately but through redirects.'
            },
            {
                name: 'mgmt',
                description: 'Routes which should only accessed through management services.'
            }
        ]

    }


    /**
     * Add component to the Open API definitoin
     * @param schemaName - The name of the schema
     * @param schmema - Open API 3.0 conformant schema {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | Schema}
     */
    static addComponentSchema(schemaName: string, schmema: Schema) {
        this.definition.components!.schemas![schemaName] = schmema
    }

    /**
     * Add path to the Open API definitoin
     * @param schemaName - The name of the path
     * @param schmema - Open API 3.0 conformant path item {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | PathItem}
     */
    static addPath(pathName: string, path: PathItem) {
        const existingPath = this.definition.paths![pathName]
        this.definition.paths![pathName] = existingPath ? { ...existingPath, ...path } : path
        for (const key in path) {
            if (path[key].responses) {
                path[key].responses = { ...path[key].responses, ...this.standardResponses }
            }
        }

    }

    static save(filesrc?: string) {
        // save the definition to a file
        const fs = require('fs');
        // get the root directory 
        const rootDir = ROOT_DIR
        // convert JSON-stringified version to YAML
        const yaml = require('js-yaml');
        const doc = yaml.load(JSON.stringify(this.definition));
        fs.writeFileSync(filesrc || rootDir + '/swagger/swagger.json', JSON.stringify(doc));
    }

}


