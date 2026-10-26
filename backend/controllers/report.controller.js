const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');

exports.getReports = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    const now = new Date();

    // 1. Members Breakdown
    const [activeCount, expiringCount, expiredCount, totalCount] = await Promise.all([
      Member.countDocuments({ gymId, status: 'active' }),
      Member.countDocuments({ gymId, status: 'expiring_soon' }),
      Member.countDocuments({ gymId, status: 'expired' }),
      Member.countDocuments({ gymId }),
    ]);

    // 2. Revenue Breakdown by Payment Method
    const paymentsByMethod = await Payment.aggregate([
      { $match: { gymId, status: 'paid' } },
      { $group: { _id: '$paymentMethod', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    // 3. Weekly Attendance Breakdown (Past 7 Days)
    const past7DaysAttendance = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

      const count = await Attendance.countDocuments({ gymId, date: dateStr });
      past7DaysAttendance.push({ date: dateStr, day: dayName, count });
    }

    // 4. Monthly Revenue History (Past 6 Months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthLabel = start.toLocaleString('en-US', { month: 'short' });

      const payments = await Payment.find({
        gymId,
        status: 'paid',
        paymentDate: { $gte: start, $lte: end },
      });
      const sum = payments.reduce((acc, p) => acc + p.totalAmount, 0);
      monthlyRevenue.push({ month: monthLabel, revenue: sum });
    }

    return res.json({
      success: true,
      data: {
        members: {
          total: totalCount,
          active: activeCount,
          expiringSoon: expiringCount,
          expired: expiredCount,
          retentionRate: totalCount > 0 ? Math.round(((activeCount + expiringCount) / totalCount) * 100) : 0,
        },
        revenueByMethod: paymentsByMethod.map((item) => ({
          method: item._id,
          amount: item.total,
          count: item.count,
        })),
        attendanceTrend: past7DaysAttendance,
        monthlyRevenue,
      },
    });
  } catch (err) {
    console.error('getReports error:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate reports.', error: err.message });
  }
};
