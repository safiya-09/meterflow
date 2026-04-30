const crypto = require('crypto');

/**
 * Generates a secure random API key
 * @returns {string} Plain text API key
 */
const generateApiKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

module.exports = generateApiKey;
