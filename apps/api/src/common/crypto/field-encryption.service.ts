import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { AppConfigService } from '../../config/app-config.service';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const ENCRYPTED_VALUE_PARTS = 4;

@Injectable()
export class FieldEncryptionService {
  constructor(private readonly config: AppConfigService) {}

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return ['v1', iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
  }

  decrypt(value: string): string {
    const [version, ivBase64, authTagBase64, encryptedBase64] = value.split(':');
    if (
      version !== 'v1' ||
      !ivBase64 ||
      !authTagBase64 ||
      !encryptedBase64 ||
      value.split(':').length !== ENCRYPTED_VALUE_PARTS
    ) {
      throw new Error('Valeur chiffrée invalide.');
    }

    const iv = Buffer.from(ivBase64, 'base64');
    const authTag = Buffer.from(authTagBase64, 'base64');
    if (iv.length !== IV_LENGTH_BYTES || authTag.length !== AUTH_TAG_LENGTH_BYTES) {
      throw new Error('Valeur chiffrée invalide.');
    }

    const decipher = createDecipheriv(ALGORITHM, this.getKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(Buffer.from(encryptedBase64, 'base64')), decipher.final()]).toString(
      'utf8',
    );
  }

  private getKey(): Buffer {
    const key = Buffer.from(this.config.dataEncryptionKey, 'base64');
    if (key.length !== 32) {
      throw new Error('DATA_ENCRYPTION_KEY doit être une clé Base64 de 32 octets.');
    }
    return key;
  }
}
