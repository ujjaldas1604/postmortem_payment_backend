import bcrypt from 'bcrypt';
const saltRounds = 12; // Work factor (higher is more secure but slower)

// Hash a password
async function hashPassword(password: string) {
    try {
        const salt = await bcrypt.genSalt(saltRounds);
        const hash = await bcrypt.hash(password, salt);
        return hash;
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err;
    }
}

// Verify a password
async function verifyPassword(plainPassword: string, hashedPassword: string) {
    try {
        const match = await bcrypt.compare(plainPassword, hashedPassword);
        return match;
    } catch (err) {
        console.error('Error verifying password:', err);
        return false;
    }
}


export const passwordUtils = {
    hashPassword,
    verifyPassword
}