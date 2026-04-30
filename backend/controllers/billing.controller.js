const billingService = require('../services/billing.service');
const Billing = require('../models/billing.model');

// @desc    Generate bill for a user
// @route   POST /api/billing/generate
// @access  Private
exports.generateBill = async (req, res, next) => {
    try {
        const { userId, month, year } = req.body;
        
        if (!userId || !month || !year) {
            return res.status(400).json({ success: false, message: 'Please provide userId, month, and year' });
        }

        const bill = await billingService.generateBill(userId, month, year);

        res.status(201).json({
            success: true,
            data: bill
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current user billing stats
// @route   GET /api/billing/me
// @access  Private
exports.getMyBilling = async (req, res, next) => {
    try {
        const stats = await billingService.getDashboardStats(req.user._id);
        
        res.status(200).json({
            success: true,
            data: {
                month: stats.month,
                requests: stats.currentMonthRequests,
                plan: stats.plan,
                amount: stats.currentAmount,
                // The status of an ongoing month logic is conceptually difficult, but per specs we map it like this:
                // If there are pending invoices we can return pending, or simply active if no bill generated for current month.
                status: stats.pendingInvoices > 0 ? "pending" : "active", 
                currentMonthRequests: stats.currentMonthRequests,
                currentAmount: stats.currentAmount,
                pendingInvoices: stats.pendingInvoices,
                paidInvoices: stats.paidInvoices
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get user bills
// @route   GET /api/billing/:userId
// @access  Private
exports.getUserBills = async (req, res, next) => {
    try {
        // Security check: Only admin or the user themselves
        if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
        }

        const bills = await Billing.find({ userId: req.params.userId }).sort('-createdAt');

        res.status(200).json({
            success: true,
            count: bills.length,
            data: bills
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Pay a bill
// @route   PATCH /api/billing/pay/:billId
// @access  Private
exports.payBill = async (req, res, next) => {
    try {
        const bill = await Billing.findById(req.params.billId);

        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found' });
        }

        // Security check: Only admin or the user themselves
        if (req.user.role !== 'admin' && req.user._id.toString() !== bill.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this route' });
        }

        bill.status = 'paid';
        await bill.save();

        res.status(200).json({
            success: true,
            data: bill
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
