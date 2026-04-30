const mongoose = require('mongoose');
const UsageLog = require('../models/usageLog.model');
const Billing = require('../models/billing.model');
const User = require('../models/user.model');

// Month mapping for parsing
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

exports.calculateAmount = (totalRequests, plan, customRate) => {
    let billableRequests = 0;
    let amount = 0;

    if (plan === 'FREE') {
        billableRequests = 0; // We just charge 0 amount and 0 billable for free plan.
        amount = 0;
    } else if (plan === 'PRO') {
        if (totalRequests > 1000) {
            billableRequests = totalRequests - 1000;
            // First 1000 requests free, ₹0.50 per 100 additional requests
            amount = Math.ceil(billableRequests / 100) * 0.50;
        }
    } else if (plan === 'ENTERPRISE') {
        billableRequests = totalRequests;
        // Apply customRate per request
        amount = billableRequests * (customRate || 0); 
    }

    return { billableRequests, amount };
};

exports.aggregateUsage = async (userId, startDate, endDate) => {
    const pipeline = [
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: {
                    $gte: startDate,
                    $lt: endDate
                }
            }
        },
        {
            $count: "totalRequests"
        }
    ];

    const result = await UsageLog.aggregate(pipeline);
    return result.length > 0 ? result[0].totalRequests : 0;
};

exports.generateBill = async (userId, monthName, year) => {
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex === -1) throw new Error('Invalid month name');

    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 1);

    // Check if bill already exists
    const existingBill = await Billing.findOne({ userId, month: monthNames[monthIndex], year });
    if (existingBill) {
        throw new Error('Bill already generated for this month');
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const totalRequests = await this.aggregateUsage(userId, startDate, endDate);
    
    const { billableRequests, amount } = this.calculateAmount(totalRequests, user.currentPlan, user.customRate);

    const bill = await Billing.create({
        userId,
        month: monthNames[monthIndex],
        year,
        totalRequests,
        billableRequests,
        amount,
        plan: user.currentPlan,
        status: 'pending'
    });

    return bill;
};

exports.getDashboardStats = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const currentMonthRequests = await this.aggregateUsage(userId, startDate, endDate);
    const { amount: currentAmount } = this.calculateAmount(currentMonthRequests, user.currentPlan, user.customRate);

    const pendingInvoicesDoc = await Billing.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'pending' } },
        { $count: "count" }
    ]);
    const paidInvoicesDoc = await Billing.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'paid' } },
        { $count: "count" }
    ]);

    const pendingInvoices = pendingInvoicesDoc.length > 0 ? pendingInvoicesDoc[0].count : 0;
    const paidInvoices = paidInvoicesDoc.length > 0 ? paidInvoicesDoc[0].count : 0;

    return {
        month: monthNames[now.getMonth()],
        currentMonthRequests,
        plan: user.currentPlan,
        currentAmount,
        pendingInvoices,
        paidInvoices,
        requests: currentMonthRequests, // Aliased for easier mapping
        amount: currentAmount // Aliased
    };
};
