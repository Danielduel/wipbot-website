import { DbClient } from "./dbClient.ts";
import { WipMetadataSchemaT } from "./dbCollection/wipMetadata.ts";
import { createGenerateString } from "./generateString.ts";

const HOUR_MS = 60 * 60 * 1000;

export class WipMetadata {
  static generateSecret = createGenerateString(32); 
  
  static _generateWipcode = createGenerateString(5);
  static _isWipcodeAvailable = async (wipcode: string) => {
    const dbClient = await DbClient.getDbClient();
    const data = await dbClient.WipMetadata.findByPrimaryIndex("wipcode", wipcode);
    if (!data) return true;
    return data.value.removed;
  };
  static generateAvailableWipcode = async () => {
    let wipcode = this._generateWipcode();
    while (!(await this._isWipcodeAvailable(wipcode))) {
      wipcode = this._generateWipcode();
    }
    return wipcode;
  };

  static _generateHash = createGenerateString(12);
  static _isHashAvailable = async (hash: string) => {
    const dbClient = await DbClient.getDbClient();
    const data = await dbClient.WipMetadata.findByPrimaryIndex("hash", hash);
    if (!data) return true;
    return data.value.removed;
  };
  static generateAvailableHash = async () => {
    let hash = this._generateHash();
    while (!(await this._isHashAvailable(hash))) {
      hash = this._generateHash();
    }
    return hash;
  };

  static async _create(size: number): Promise<Required<WipMetadataSchemaT>> {
    const created_at = new Date();
    const outdated_at = new Date(Date.now() + 23 * HOUR_MS);

    const item: Required<WipMetadataSchemaT> = {
      version: 3,

      removed: false,
      size,
      private: false,
      private_shared_with: [],

      hash: await this.generateAvailableHash(),
      wipcode: await this.generateAvailableWipcode(),
      secret: this.generateSecret(),

      verify_started: false,
      verify_errorArray: null,
      verify_finished: false,
      verify_success: false,

      created_at,
      outdated_at,
    };

    return item; 
  }

  static async create(size: number): Promise<WipMetadataSchemaT> {
    const dbClient = await DbClient.getDbClient();
    const item = await this._create(size);

    const returns = await dbClient.WipMetadata.add(item);

    if (!returns.ok) {
      throw Error(`Failed to create ${item}`);
    }

    return item;
  }
}


