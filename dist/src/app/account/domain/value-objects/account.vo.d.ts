export declare class Account {
    private _status;
    private _roles;
    constructor(status: string, roles: string[]);
    private set status(value);
    private set roles(value);
    get isActive(): boolean;
    get isInactive(): boolean;
    get isAdmin(): boolean;
}
