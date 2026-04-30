const express = require('express');
const {
    generateKey,
    rotateKey,
    revokeKey,
    getKeys,
    getAllKeys
} = require('../controllers/apiKey.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const { checkApiOwnership, checkKeyOwnership } = require('../middleware/ownership.middleware');

const router = express.Router({ mergeParams: true });

// All routes require protection
router.use(protect);

// Global keys route
router.get('/all', authorize('api_owner', 'admin'), getAllKeys);

// API Specific routes
router.post('/:apiId/generate', authorize('api_owner', 'admin'), checkApiOwnership, generateKey);
router.post('/:apiId/rotate', authorize('api_owner', 'admin'), checkApiOwnership, rotateKey);
router.patch('/:apiId/revoke/:keyId', authorize('api_owner', 'admin'), checkApiOwnership, checkKeyOwnership, revokeKey);
router.get('/:apiId', authorize('api_owner', 'admin'), checkApiOwnership, getKeys);

module.exports = router;
