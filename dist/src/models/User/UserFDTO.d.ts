import BaseFrontendDTO, { iBaseFrontendDTO } from "../BaseFrontendDTO";
interface iUserFDTO extends iBaseFrontendDTO {
    email: string;
    familyName: string;
    givenName: string;
    isSuperAdmin: boolean;
}
export default class UserFDTO extends BaseFrontendDTO implements iUserFDTO {
    email: string;
    familyName: string;
    givenName: string;
    constructor(payload: iUserFDTO);
    isSuperAdmin: boolean;
}
export {};
//# sourceMappingURL=UserFDTO.d.ts.map