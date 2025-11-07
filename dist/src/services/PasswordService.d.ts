declare class PasswordService {
    verifyPassword(password: string, hash: string): Promise<boolean>;
    hashPassword(password: string, strength?: number): Promise<string>;
}
declare const _default: PasswordService;
export default _default;
//# sourceMappingURL=PasswordService.d.ts.map