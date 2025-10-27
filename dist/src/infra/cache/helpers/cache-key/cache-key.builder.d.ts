type Resource = 'account' | 'banner' | 'category' | 'faq' | 'model' | 'product' | 'product-gender' | 'store' | 'text' | '*';
type Id = string;
type Query = Record<string, any>;
export declare class CacheKeyBuilder {
    private accountId?;
    private resource?;
    private command?;
    private data?;
    setAccount(accountId: string): this;
    setResource(resource: Resource): this;
    setCommand(command: '*'): this;
    setCommand(command: 'list', data?: Query): this;
    setCommand(command: 'detail', data: Id): this;
    build(): string;
}
export {};
