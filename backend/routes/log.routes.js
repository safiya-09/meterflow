const express = require('express');
const {
    getLogs,
    getApiLogs,
    getApiStats
} = require('../controllers/log.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

// Logging requests mandate API user authorization
router.use(protect);

router.get('/', authorize('api_owner', 'admin'), getLogs);

// Because of routing rules, place the specific non-parameter path `/stats/:apiId` before `/something` parameters 
// to prevent Express from thinking "stats" is an `apiId` parameters
router.get('/stats/:apiId', authorize('api_owner', 'admin'), getApiStats);
router.get('/:apiId', authorize('api_owner', 'admin'), getApiLogs);


module.exports = router;
