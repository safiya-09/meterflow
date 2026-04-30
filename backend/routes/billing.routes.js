const express = require('express');
const {
    generateBill,
    getMyBilling,
    getUserBills,
    payBill
} = require('../controllers/billing.controller');

const { protect } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

const router = express.Router();

router.use(protect);

router.post('/generate', authorize('admin'), generateBill);
router.get('/me', getMyBilling);
router.patch('/pay/:billId', payBill);
router.get('/:userId', getUserBills);

module.exports = router;
