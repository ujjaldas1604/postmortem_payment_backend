import {
    constants,
    createCipheriv,
    publicEncrypt,
    createPublicKey,
    randomBytes,
    createPrivateKey,
    createSign
} from 'crypto';
import path from 'path';
import logger from '../config/winston_logger';
import { readFileSync } from 'fs';

import { createHash } from 'crypto';
import { config } from '../config/config';

const EncryptAES = (data: Object, sessionKey: string): string => {
    logger.info(`sbi EncryptAES utils function hit: ${JSON.stringify({ data, sessionKey })}`);
    const IV = Buffer.alloc(12); // 12-byte zero-filled IV
    const byteKey = Buffer.from(sessionKey, 'utf8');

    // SHA-256 hash and truncate to 16 bytes
    const hashedKey = createHash('sha256').update(byteKey).digest();
    const truncatedKey = hashedKey.subarray(0, 16);

    const cipher = createCipheriv('aes-128-gcm', truncatedKey, IV, {
        authTagLength: 16 // 16 bytes = 128 bits
    });

    let encrypted = cipher.update(JSON.stringify(data), 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Combine ciphertext and auth tag (GCM appends auth tag by default)
    const result = Buffer.concat([encrypted, authTag]);

    logger.info(`Success in sbi EncryptAES utils function: ${result.toString('base64')}`);
    return result.toString('base64');
};

function EncryptRSA(plaintext: string, publicKeyPath?: string): string {
    try {
        logger.info(`sbi EncryptRSA utils function hit: ${JSON.stringify({ plaintext, publicKeyPath })}`);

        let mode = "stage";
        if (config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const keyPath = publicKeyPath || path.join(__dirname, '..', 'keys', mode, 'sbi_public_key.pem');

        // Read public key from filesystem
        const publicKeyPem = readFileSync(keyPath, 'utf8');

        // Create public key object
        const publicKeyObj = createPublicKey({
            key: publicKeyPem,
            format: 'pem',
            type: publicKeyPem.includes('BEGIN RSA PUBLIC KEY') ? 'pkcs1' : 'spki'
        });

        // Perform RSA-OAEP encryption with SHA-1 (matching Java implementation)
        const encrypted = publicEncrypt(
            {
                key: publicKeyObj,
                oaepHash: 'sha1',
                padding: constants.RSA_PKCS1_OAEP_PADDING
            },
            Buffer.from(plaintext, 'utf8')
        );

        logger.info(`Success in sbi EncryptRSA utils function: ${encrypted.toString('base64')}`);
        return encrypted.toString('base64');
    } catch (error: any) {
        logger.error(`Error in sbi EncryptRSA utils function: ${error.message}`);
        throw new Error(`RSA encryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function generateSessionKey(n: number = 16): string {
    logger.info(`sbi generateSessionKey utils function hit: ${JSON.stringify({ n })}`);
    // Generate secure random bytes (no OS-specific providers needed in Node.js)
    const randomBytesBuffer = randomBytes(128);

    // Convert to string (using UTF-8 encoding)
    const randomString = randomBytesBuffer.toString('utf8');

    let result = '';
    let charsLeft = n;

    // Filter to only alphanumeric characters
    for (const ch of randomString) {
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9')) {
            result += ch;
            charsLeft--;

            if (charsLeft <= 0) {
                break;
            }
        }
    }

    // If we didn't get enough characters, recursively call to get more
    if (charsLeft > 0) {
        result += generateSessionKey(charsLeft);
    }
    logger.info(`Success in sbi generateSessionKey utils function: ${result}`);
    return result;
}

function generateSign(data: string, privateKeyPath?: string): string {
    try {
        logger.info(`sbi generateSign utils function hit: ${JSON.stringify({ data, privateKeyPath })}`);

        let mode = "stage";
        if (config.NODE_ENV == "prod") {
            mode = "prod";
        }
        const privateKeyPem =
            privateKeyPath || readFileSync(path.join(__dirname, '..', 'keys', mode, 'sbi_private_key.pem'), 'utf8');
        const privateKey = createPrivateKey({
            key: privateKeyPem,
            format: 'pem',
            type: privateKeyPem.includes('BEGIN RSA PRIVATE KEY') ? 'pkcs1' : 'pkcs8'
        });

        // 2. Create and configure the signer
        const signer = createSign('RSA-SHA256');
        signer.update(data, 'utf8');

        // 3. Generate the signature
        const signature = signer.sign(privateKey);

        logger.info(`Success in sbi generateSign utils function: ${signature.toString('base64')}`);
        return signature.toString('base64');
    } catch (error: any) {
        logger.error(`Error in sbi generateSign utils function: ${error.message}`);
        throw new Error(`Signature generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export const sbiEncryption = {
    EncryptAES,
    EncryptRSA,
    generateSessionKey,
    generateSign
};
