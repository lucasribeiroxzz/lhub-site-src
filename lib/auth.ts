import { SignJWT, jwtVerify, CompactEncrypt, compactDecrypt } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'changeme_in_production_please_super_secret_key_123';
const SESSION_SECRET = process.env.SESSION_SECRET || 'session_secret_layer_2_protection';

const encodedKey = new TextEncoder().encode(SECRET_KEY);

async function getEncryptionKey() {
    const secret = new TextEncoder().encode(SESSION_SECRET);
    const hash = await crypto.subtle.digest('SHA-256', secret);
    return new Uint8Array(hash);
}

export async function signToken(payload: any) {

    const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey);

    const encryptionKey = await getEncryptionKey();
    const jwe = await new CompactEncrypt(new TextEncoder().encode(jwt))
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
        .encrypt(encryptionKey);

    return jwe;
}

export async function verifyToken(token: string) {
    try {
        const encryptionKey = await getEncryptionKey();

        const { plaintext } = await compactDecrypt(token, encryptionKey);
        const jwt = new TextDecoder().decode(plaintext);

        const { payload } = await jwtVerify(jwt, encodedKey, {
            algorithms: ['HS256'],
        });

        return payload;
    } catch (error) {

        return null;
    }
}
