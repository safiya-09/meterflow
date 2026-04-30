const express = require('express');
const router = express.Router();
const gatewayMiddleware = require('../middleware/gateway.middleware');

// Route all traffic through the gateway middleware
// Example: /gateway/12345/pokemon/ditto
router.use('/:apiId', gatewayMiddleware);

module.exports = router;
