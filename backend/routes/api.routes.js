const express = require('express');
const {
    createApi,
    getApis,
    getApi,
    updateApi,
    deleteApi
} = require('../controllers/api.controller');
const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('api_owner', 'admin'), createApi);
router.get('/', getApis);
router.get('/:id', getApi);
router.put('/:id', updateApi);
router.delete('/:id', deleteApi);

module.exports = router;
