const Payment = require('../models/Payment');
const Member = require('../models/Member');
const Gym = require('../models/Gym');
const Plan = require('../models/Plan');

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}-${rand}`;
}

exports.getPayments = async (req, res) => {
  try {
    const { status, method, search } = req.query;
    const query = { gymId: req.user.gymId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (method && method !== 'all') {
      query.paymentMethod = method;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ memberName: regex }, { memberPhone: regex }, { receiptNumber: regex }, { transactionReference: regex }];
    }

    const payments = await Payment.find(query).sort({ paymentDate: -1 });

    // Compute KPI metrics
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayAgg, monthAgg, pendingAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { gymId: req.user.gymId, status: 'paid', paymentDate: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Payment.aggregate([
        { $match: { gymId: req.user.gymId, status: 'paid', paymentDate: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Payment.aggregate([
        { $match: { gymId: req.user.gymId, status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const todayRevenue = todayAgg[0]?.total || 0;
    const monthRevenue = monthAgg[0]?.total || 0;
    const pendingAmount = pendingAgg[0]?.total || 0;

    return res.json({
      success: true,
      summary: {
        todayRevenue,
        monthRevenue,
        pendingAmount,
      },
      data: payments,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch payments.', error: err.message });
  }
};

exports.getReceipt = async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const [gym, member] = await Promise.all([
      Gym.findById(req.user.gymId),
      Member.findById(payment.memberId),
    ]);

    return res.json({
      success: true,
      data: {
        receipt: payment,
        gym: {
          name: gym.name,
          ownerName: gym.ownerName,
          address: gym.address,
          city: gym.city,
          phone: gym.phone,
          email: gym.email,
          gstin: gym.gstin,
          currencySymbol: gym.currencySymbol || '₹',
        },
        member: member
          ? {
              name: member.name,
              phone: member.phone,
              email: member.email,
              memberCode: member.memberCode,
            }
          : { name: payment.memberName, phone: payment.memberPhone },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate receipt.', error: err.message });
  }
};

exports.createPayment = async (req, res) => {
  try {
    const { memberId, planId, amount, paymentMethod, transactionReference, status, notes } = req.body;

    if (!memberId || !amount) {
      return res.status(400).json({ success: false, message: 'Member ID and amount are required.' });
    }

    const member = await Member.findOne({ _id: memberId, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    let planName = member.planName || 'Gym Membership';
    if (planId) {
      const plan = await Plan.findOne({ _id: planId, gymId: req.user.gymId });
      if (plan) planName = plan.name;
    }

    const totalAmount = Number(amount);
    const taxAmount = Math.round((totalAmount * 18) / 118); // Inclusive 18% GST calculation
    const baseAmount = totalAmount - taxAmount;

    const payment = await Payment.create({
      gymId: req.user.gymId,
      receiptNumber: generateReceiptNumber(),
      memberId: member._id,
      memberName: member.name,
      memberPhone: member.phone,
      planId: planId || member.planId,
      planName,
      amount: baseAmount,
      taxAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: transactionReference || `TXN-${Date.now().toString().slice(-6)}`,
      status: status || 'paid',
      paymentDate: new Date(),
      notes: notes || '',
    });

    if (payment.status === 'paid') {
      member.paymentStatus = 'paid';
      await member.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Payment recorded successfully.',
      data: payment,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record payment.', error: err.message });
  }
};
