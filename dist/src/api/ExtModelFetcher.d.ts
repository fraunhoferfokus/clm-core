declare class ExtModelFetcher {
    token: string;
    constructor();
    createAccessToken: () => Promise<void>;
    findAll: (modelPath: string) => Promise<any[]>;
    findById(id: string, modelPath: string): Promise<any>;
}
export declare const extModelFetchInstance: ExtModelFetcher;
export {};
//# sourceMappingURL=ExtModelFetcher.d.ts.map