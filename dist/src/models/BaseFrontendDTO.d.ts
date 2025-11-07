/**
 * @public
 * The payload which is passed to the constructor of {@link BaseFrontendDTO}
 */
export interface iBaseFrontendDTO {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
}
/** DTO which exposes only a subset of attributes!
 * @remarks This class is based on Java DTO. It is meant for consumption by the frontend. Exposes only subset of attributes of a datamodel (f.e not including user password).
 * see https://www.baeldung.com/java-dto-pattern
 * @public
 */
export default class BaseFrontendDTO implements iBaseFrontendDTO {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    constructor(payload: iBaseFrontendDTO);
}
//# sourceMappingURL=BaseFrontendDTO.d.ts.map