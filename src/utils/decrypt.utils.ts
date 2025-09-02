import logger from "../config/winston_logger";
import { privateDecrypt, createPrivateKey, constants, createDecipheriv, createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from "../config/config";


// export const DecryptAES = (encryptedData: string, key: Buffer): string => {
//     try {
//         logger.info(`DecryptAES utils function hit`)
//         const parts = encryptedData.split(":");
//         if (parts.length !== 3) {
//             throw new Error("Invalid encrypted data format. Expected 'IV:CipherText:AuthTag'.");
//         }

//         const [ivBase64, encryptedTextBase64, authTagBase64] = parts;
//         const iv = Buffer.from(ivBase64, "base64");
//         const encryptedText = Buffer.from(encryptedTextBase64, "base64");
//         const authTag = Buffer.from(authTagBase64, "base64");

//         const decipher = crypto.createDecipheriv("aes-128-gcm", key, iv);
//         decipher.setAuthTag(authTag);

//         let decrypted = decipher.update(encryptedText).toString("utf8");
//         decrypted += decipher.final("utf8");

//         logger.info(`Success in DecryptAES utils function`)
//         return decrypted;
//     } catch (error) {
//         console.error("Decryption failed:", error);
//         throw new Error("Decryption failed. Ensure the key and encrypted data are correct.");
//     }
// };




async function DecryptRSA(encryptedKey: string, privateKeyPath?: string): Promise<string> {
    try {
        logger.info(`sbi DecryptRSA utils function hit: ${JSON.stringify({ encryptedKey, privateKeyPath })}`)
        
        
        let mode = 'stage';
        if (config.NODE_ENV == 'prod') {
            mode = 'prod';
        }
        
        const keyPath = privateKeyPath || join(__dirname, '..', 'keys', mode , 'sbi_private_key.pem');
        const pemContents = readFileSync(keyPath, 'utf8');

        // Read and decode the base64 encrypted data
        const encryptedBuffer = Buffer.from(encryptedKey, 'base64');

        const privateKey = createPrivateKey({
            key: pemContents,
            format: 'pem',
            type: pemContents.includes('BEGIN RSA PRIVATE KEY') ? 'pkcs1' : 'pkcs8'
        });
        // Perform RSA-OAEP decryption with SHA-1
        const decrypted = privateDecrypt(
            {
                key: privateKey,
                oaepHash: 'sha1',
                padding: constants.RSA_PKCS1_OAEP_PADDING
            },
            encryptedBuffer
        );

        logger.info(`Success in sbi DecryptRSA utils function: ${decrypted.toString('utf8')}`)
        return decrypted.toString('utf8');
    } catch (error: any) {
        logger.error(`Error in sbi DecryptRSA utils function: ${error.message}`)
        throw new Error(`RSA decryption failed: ${error instanceof Error ? error.message : String(error)}`);
    }
}




function DecryptAES(encryptedTokenRequest: string, sessionKey: string): string {
    try {
        logger.info(`sbi DecryptAES utils function hit: ${JSON.stringify({ encryptedTokenRequest, sessionKey })}`)
        const IV = Buffer.alloc(12); // 12-byte IV (same as Java version)

        // Process the key (SHA-256 hash and truncate to 16 bytes)
        const bytesKey = Buffer.from(sessionKey, 'utf8');
        const hashedKey = createHash('sha256').update(bytesKey).digest();
        const truncatedKey = hashedKey.subarray(0, 16); // Use first 16 bytes (AES-128)

        // Split the encrypted data into ciphertext and auth tag
        const encryptedData = Buffer.from(encryptedTokenRequest, 'base64');
        const authTag = encryptedData.subarray(encryptedData.length - 16);
        const cipherText = encryptedData.subarray(0, encryptedData.length - 16);

        // Create and configure the decipher
        const decipher = createDecipheriv('aes-128-gcm', truncatedKey, IV, {
            authTagLength: 16
        });

        // Set the authentication tag
        decipher.setAuthTag(authTag);

        // Decrypt the data
        let decrypted = decipher.update(cipherText, undefined, 'utf8');
        decrypted += decipher.final('utf8');

        logger.info(`Success in sbi DecryptAES utils function: ${decrypted}`)
        return decrypted;
    } catch (err: any) {
        logger.error(`Error in DecryptAES utils function: ${err.message}`)
        throw err
    }
}


export const sbiDecryption = {
    DecryptAES,
    DecryptRSA
}