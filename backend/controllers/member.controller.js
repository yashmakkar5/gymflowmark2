const Member = require('../models/Member');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `GF-${year}-${rand}`;
}

exports.getMembers = async (req, res) => {
  try {
    const { status, search, planId } = req.query;
    const query = { gymId: req.user.gymId };

    if (status && status !== 'all') {
      query.status = status;
    }

    if (planId) {
      query.planId = planId;
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { phone: regex }, { email: regex }, { memberCode: regex }];
    }

    const members = await Member.find(query).sort({ createdAt: -1 });

    // Update statuses dynamically
    const updatedMembers = members.map((member) => {
      member.computeStatus();
      return member;
    });

    return res.json({
      success: true,
      count: updatedMembers.length,
      data: updatedMembers,
    });
  } catch (err) {
    console.error('getMembers error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch members.', error: err.message });
  }
};

exports.getMemberById = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId }).populate('planId');
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.computeStatus();

    // Fetch related records in parallel
    const [attendanceList, paymentsList, subscriptionsList] = await Promise.all([
      Attendance.find({ memberId: member._id, gymId: req.user.gymId }).sort({ date: -1, checkInTime: -1 }).limit(30),
      Payment.find({ memberId: member._id, gymId: req.user.gymId }).sort({ paymentDate: -1 }),
      Subscription.find({ memberId: member._id, gymId: req.user.gymId }).sort({ startDate: -1 }),
    ]);

    return res.json({
      success: true,
      data: {
        member,
        attendance: attendanceList,
        payments: paymentsList,
        subscriptions: subscriptionsList,
      },
    });
  } catch (err) {
    console.error('getMemberById error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch member details.', error: err.message });
  }
};

exports.createMember = async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      dateOfBirth,
      gender,
      address,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      planId,
      startDate,
      paymentMethod,
      notes,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Member name and phone number are required.',
      });
    }

    // Check duplicate phone in this gym
    const existing = await Member.findOne({ gymId: req.user.gymId, phone });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A member with this phone number already exists in your gym.',
      });
    }

    let plan = null;
    let durationMonths = 1;
    let planPrice = 999;
    let planName = 'Standard';

    if (planId) {
      plan = await Plan.findOne({ _id: planId, gymId: req.user.gymId });
      if (plan) {
        durationMonths = plan.durationMonths || 1;
        planPrice = plan.price;
        planName = plan.name;
      }
    }

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setMonth(end.getMonth() + durationMonths);

    // Auto-generate member code
    const memberCount = await Member.countDocuments({ gymId: req.user.gymId });
    const memberCode = `GF-${1000 + memberCount + 1}`;

    const member = new Member({
      gymId: req.user.gymId,
      memberCode,
      name,
      phone,
      email: email || '',
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'male',
      address: address || '',
      emergencyContact: {
        name: emergencyName || '',
        phone: emergencyPhone || '',
        relation: emergencyRelation || '',
      },
      planId: plan ? plan._id : null,
      planName,
      joinedDate: start,
      membershipStartDate: start,
      membershipEndDate: end,
      paymentStatus: paymentMethod ? 'paid' : 'pending',
      notes: notes || '',
    });

    member.computeStatus();
    await member.save();

    // Record initial subscription
    const subscription = await Subscription.create({
      gymId: req.user.gymId,
      memberId: member._id,
      planId: plan ? plan._id : member._id,
      planName,
      amount: planPrice,
      startDate: start,
      endDate: end,
      status: 'active',
    });

    // Record initial payment if method was selected
    let payment = null;
    if (paymentMethod) {
      const taxAmount = Math.round(planPrice * 0.18);
      const totalAmount = planPrice;
      payment = await Payment.create({
        gymId: req.user.gymId,
        receiptNumber: generateReceiptNumber(),
        memberId: member._id,
        memberName: member.name,
        memberPhone: member.phone,
        planId: plan ? plan._id : null,
        planName,
        amount: planPrice - taxAmount,
        taxAmount,
        totalAmount,
        paymentMethod: paymentMethod || 'UPI',
        transactionReference: `INITIAL-${Date.now().toString().slice(-6)}`,
        status: 'paid',
        paymentDate: new Date(),
      });

      subscription.paymentId = payment._id;
      await subscription.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Member created successfully.',
      data: member,
      payment,
    });
  } catch (err) {
    console.error('createMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create member.', error: err.message });
  }
};

exports.updateMember = async (req, res) => {
  try {
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const {
      name,
      phone,
      email,
      gender,
      address,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      membershipEndDate,
      notes,
    } = req.body;

    if (name) member.name = name;
    if (phone) member.phone = phone;
    if (email !== undefined) member.email = email;
    if (gender) member.gender = gender;
    if (address !== undefined) member.address = address;
    if (emergencyName || emergencyPhone || emergencyRelation) {
      member.emergencyContact = {
        name: emergencyName !== undefined ? emergencyName : member.emergencyContact?.name,
        phone: emergencyPhone !== undefined ? emergencyPhone : member.emergencyContact?.phone,
        relation: emergencyRelation !== undefined ? emergencyRelation : member.emergencyContact?.relation,
      };
    }
    if (membershipEndDate) member.membershipEndDate = new Date(membershipEndDate);
    if (notes !== undefined) member.notes = notes;

    member.computeStatus();
    await member.save();

    return res.json({
      success: true,
      message: 'Member updated successfully.',
      data: member,
    });
  } catch (err) {
    console.error('updateMember error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update member.', error: err.message });
  }
};

exports.deleteMember = async (req, res) => {
  try {
    const member = await Member.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    // Cleanup related attendance and records for cleanliness
    await Attendance.deleteMany({ memberId: member._id, gymId: req.user.gymId });

    return res.json({
      success: true,
      message: 'Member and related records removed.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete member.', error: err.message });
  }
};

exports.renewMembership = async (req, res) => {
  try {
    const { planId, paymentMethod } = req.body;
    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const plan = await Plan.findOne({ _id: planId || member.planId, gymId: req.user.gymId });
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Selected plan not found.' });
    }

    // If current end date is in the future, add to it; else start from today
    const now = new Date();
    const currentEnd = new Date(member.membershipEndDate);
    const startDate = currentEnd > now ? currentEnd : now;

    const newEnd = new Date(startDate);
    newEnd.setMonth(newEnd.getMonth() + (plan.durationMonths || 1));

    member.planId = plan._id;
    member.planName = plan.name;
    member.membershipEndDate = newEnd;
    member.paymentStatus = 'paid';
    member.computeStatus();
    await member.save();

    // Create payment record
    const taxAmount = Math.round(plan.price * 0.18);
    const payment = await Payment.create({
      gymId: req.user.gymId,
      receiptNumber: generateReceiptNumber(),
      memberId: member._id,
      memberName: member.name,
      memberPhone: member.phone,
      planId: plan._id,
      planName: plan.name,
      amount: plan.price - taxAmount,
      taxAmount,
      totalAmount: plan.price,
      paymentMethod: paymentMethod || 'UPI',
      transactionReference: `RENEW-${Date.now().toString().slice(-6)}`,
      status: 'paid',
      paymentDate: new Date(),
    });

    // Create subscription history
    await Subscription.create({
      gymId: req.user.gymId,
      memberId: member._id,
      planId: plan._id,
      planName: plan.name,
      amount: plan.price,
      startDate,
      endDate: newEnd,
      status: 'active',
      paymentId: payment._id,
    });

    return res.json({
      success: true,
      message: `Membership renewed successfully until ${newEnd.toLocaleDateString('en-IN')}`,
      data: member,
      payment,
    });
  } catch (err) {
    console.error('renewMembership error:', err);
    return res.status(500).json({ success: false, message: 'Failed to renew membership.', error: err.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const member = await Member.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    member.avatarUrl = avatarUrl;
    await member.save();

    return res.json({
      success: true,
      message: 'Member avatar uploaded successfully.',
      avatarUrl,
      data: member,
    });
  } catch (err) {
    console.error('uploadAvatar error:', err);
    return res.status(500).json({ success: false, message: 'Failed to upload avatar.', error: err.message });
  }
};
