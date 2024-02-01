declare class RedisClient {
    get(key: string): Promise<any>;
    set(key: string, value: {
        [key: string]: any;
    }): Promise<{
        [key: string]: any;
    }>;
    delete(key: string): Promise<boolean>;
    flush(): Promise<boolean>;
}
declare const _default: RedisClient;
export default _default;
//# sourceMappingURL=redisClient.d.ts.map