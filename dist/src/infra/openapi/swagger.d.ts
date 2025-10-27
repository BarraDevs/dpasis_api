type swaggerProps = {
    tags: string[];
    summary: string;
    description?: string;
    okResponse?: any;
    okPaginatedResponse?: any;
    createdResponse?: any;
    applyBadRequest?: boolean;
    applyForbidden?: boolean;
    applyNotFound?: boolean;
    applyConflict?: boolean;
    applyUnsupportedMediaType?: boolean;
};
export declare function Swagger(props: swaggerProps): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export {};
