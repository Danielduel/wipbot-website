import { DbClient } from "./dbClient.ts";
import { ClientSecretSchemaT } from "./dbCollection/clientSecret.ts";
import { createGenerateString } from "./generateString.ts";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;

export class ClientSecret {
  static _generateId = createGenerateString(32);
  static _isIdAvailable = async (id: string) => {
    const dbClient = await DbClient.getDbClient();
    const data = await dbClient.ClientSecret.findByPrimaryIndex("id", id);
    if (!data) return true;
    return false;
  }
  static generateAvailableId = async () => {
    let id = this._generateId();
    while (!(await this._isIdAvailable(id))) id = this._generateId();
    return id;
  }

  static _generatePublicCode = createGenerateString(8);
  static _isPublicCodeAvailable = async (code: string) => {
    const dbClient = await DbClient.getDbClient();
    const data = await dbClient.ClientSecret.findByPrimaryIndex("public_code", code);
    if (!data) return true;
    return false;
  }
  static generateAvailablePublicCode = async () => {
    let code = this._generatePublicCode();
    while (!(await this._isPublicCodeAvailable(code))) code = this._generatePublicCode();
    return code;
  }
  
  static _generateToken = createGenerateString(32);
  static _isTokenAvailable = async (token: string) => {
    const dbClient = await DbClient.getDbClient();
    const data = await dbClient.ClientSecret.findByPrimaryIndex("token", token);
    if (!data) return true;
    return false;
  }
  static generateAvailableToken = async () => {
    let token = this._generateToken();
    while (!(await this._isTokenAvailable(token))) token = this._generateToken();
    return token;
  }

  static async _create(): Promise<ClientSecretSchemaT> {
    const item: ClientSecretSchemaT = {
      id: await this.generateAvailableId(),
      version: 1,
      public_code: await this.generateAvailablePublicCode(),
      token: await this.generateAvailableToken(),
      created_at: new Date(),
      last_used_at: new Date(),
      expires_at: new Date(Date.now() + MONTH_MS)
    };

    return item;
  }
  
  static async create(): Promise<ClientSecretSchemaT> {
    const dbClient = await DbClient.getDbClient();
    const item = await this._create();
    const returns = await dbClient.ClientSecret.add(item);

    if (!returns.ok) {
      throw Error(`Failed to create ${item}`);
    }

    return item;
  }
}

