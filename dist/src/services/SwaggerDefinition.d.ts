import { OAS3Definition, PathItem, Schema } from "swagger-jsdoc";
/**
 * @public
 * Static class to create the swagger documentation of clm-extensions/clm-core
 */
export default class SwaggerDefinition {
    private static standardResponses;
    /**
     * The current Open API 3.0 definition  {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | OAS3Definition}
     */
    static definition: OAS3Definition;
    /**
     * Add component to the Open API definitoin
     * @param schemaName - The name of the schema
     * @param schmema - Open API 3.0 conformant schema {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | Schema}
     */
    static addComponentSchema(schemaName: string, schmema: Schema): void;
    /**
     * Add path to the Open API definitoin
     * @param schemaName - The name of the path
     * @param schmema - Open API 3.0 conformant path item {@link https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/swagger-jsdoc/index.d.ts | PathItem}
     */
    static addPath(pathName: string, path: PathItem): void;
    static save(filesrc?: string): void;
}
//# sourceMappingURL=SwaggerDefinition.d.ts.map