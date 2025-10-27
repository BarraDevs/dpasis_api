type ClientProps = ClientCreateProps & {
    id: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
};
type ClientCreateProps = {
    kind: string;
    cnpj: string;
    ie: string;
    group: string;
    type: string;
    generateInvoice: boolean;
    companyName: string;
    fantasyName: string;
    owner: string;
    headquarters: string;
};
export declare class Client {
    private readonly _id;
    private readonly _props;
    static create(props: ClientCreateProps): Client;
    static load(props: ClientProps): Client;
    get props(): Readonly<ClientProps>;
    constructor(props: ClientProps);
}
export {};
