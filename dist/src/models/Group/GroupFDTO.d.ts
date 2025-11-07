import BaseFronendDTO, { iBaseFrontendDTO } from "../BaseFrontendDTO";
interface iGroupFDTO extends iBaseFrontendDTO {
    displayName: string;
}
export default class GroupFDTO extends BaseFronendDTO implements iGroupFDTO {
    displayName: string;
    constructor(payload: iGroupFDTO);
}
export {};
//# sourceMappingURL=GroupFDTO.d.ts.map