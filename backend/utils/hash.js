const crypto = require('crypto');

/**
 * Hashes a plain text string (e.g., API key) using SHA-256
 * @param {string} text - The text to hash
 * @returns {string} The hashed string
 */
const hashString = (text) => {
    return crypto
        .createHash('sha256')
        .update(text)
        .digest('hex');
};

module.exports = {
    hashString
};
