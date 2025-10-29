type Resource =
  | 'account'
  | 'banner'
  | 'category'
  | 'faq'
  | 'product'
  | 'store'
  | 'text'
  | '*'

type Command =
  | 'list'
  | 'detail'
  | '*'

type Id = string;
type Query = Record<string, any>;

export class CacheKeyBuilder {
  private accountId?: string;
  private resource?: Resource;
  private command?: Command;
  private data?: Id | Query;

  public setAccount(accountId: string): this {
    this.accountId = accountId;
    return this;
  }

  public setResource(resource: Resource): this {
    this.resource = resource;
    return this;
  }

  public setCommand(command: '*'): this;
  public setCommand(command: 'list', data?: Query): this;
  public setCommand(command: 'detail', data: Id): this;
  public setCommand(command: Command, data?: Id | Query): this {
    this.command = command;
    this.data = data;
    return this;
  }

  public build(): string {
    if (!this.resource) throw new Error('Resource é obrigatório');
    if (!this.command) throw new Error('Command é obrigatório');

    const keyParts: string[] = [];
    keyParts.push('cache');
    keyParts.push(this.accountId ? this.accountId : 'global');
    keyParts.push(this.resource);
    keyParts.push(this.command);

    if (this.data) {
      if (typeof this.data === 'string') {
        keyParts.push(this.data);
      } else {
        keyParts.push(JSON.stringify(this.data));
      }
    }

    // example: cache:global:product:list:{"page":1,"limit":10}
    return keyParts.join(':');
  }
}
