const Plan = require('../models/Plan');
const Member = require('../models/Member');

exports.getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ gymId: req.user.gymId }).sort({ price: 1 });

    // Compute active subscriber counts dynamically
    const plansWithCounts = await Promise.all(
      plans.map(async (p) => {
        const count = await Member.countDocuments({
          gymId: req.user.gymId,
          planId: p._id,
          status: { $in: ['active', 'expiring_soon'] },
        });
        const obj = p.toObject();
        obj.subscribersCount = count;
        return obj;
      })
    );

    return res.json({ success: true, data: plansWithCounts });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch plans.', error: err.message });
  }
};

exports.createPlan = async (req, res) => {
  try {
    const { name, price, durationMonths, description, features } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ success: false, message: 'Plan name and price are required.' });
    }

    const plan = await Plan.create({
      gymId: req.user.gymId,
      name,
      price: Number(price),
      durationMonths: Number(durationMonths) || 1,
      description: description || '',
      features: Array.isArray(features) ? features : (features ? features.split(',').map(s => s.trim()) : []),
    });

    return res.status(201).json({
      success: true,
      message: 'Plan created successfully.',
      data: plan,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create plan.', error: err.message });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findOne({ _id: req.params.id, gymId: req.user.gymId });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }

    const { name, price, durationMonths, description, features, isActive } = req.body;
    if (name) plan.name = name;
    if (price !== undefined) plan.price = Number(price);
    if (durationMonths !== undefined) plan.durationMonths = Number(durationMonths);
    if (description !== undefined) plan.description = description;
    if (features !== undefined) {
      plan.features = Array.isArray(features) ? features : features.split(',').map(s => s.trim());
    }
    if (isActive !== undefined) plan.isActive = Boolean(isActive);

    await plan.save();

    return res.json({ success: true, message: 'Plan updated successfully.', data: plan });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update plan.', error: err.message });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findOneAndDelete({ _id: req.params.id, gymId: req.user.gymId });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found.' });
    }
    return res.json({ success: true, message: 'Plan deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete plan.', error: err.message });
  }
};
