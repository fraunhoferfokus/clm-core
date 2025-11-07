import BaseFrontendDTO, { iBaseFrontendDTO } from "../BaseFrontendDTO";
interface iConsumerFDTO extends iBaseFrontendDTO {
    paths?: {
        scope: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH')[];
        route: string;
    }[];
    displayName: string;
    active: boolean;
    domain: string;
    userId: string;
}
export default class ConsumerFDTO extends BaseFrontendDTO implements iConsumerFDTO {
    paths?: {
        scope: ('GET' | 'PUT' | 'POST' | 'DELETE' | 'PATCH')[];
        route: string;
    }[];
    displayName: string;
    constructor(payload: iConsumerFDTO);
    active: boolean;
    domain: string;
    userId: string;
}
export {};
//# sourceMappingURL=ConsumerFDTO.d.ts.map