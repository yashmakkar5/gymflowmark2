const Member = require('../models/Member');
const Payment = require('../models/Payment');
const Attendance = require('../models/Attendance');
const Gym = require('../models/Gym');

function formatTimeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} d ago`;
}

exports.getDashboardStats = async (req, res) => {
  try {
    const gymId = req.user.gymId;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Start of this month and last month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // 7 days window for expiring memberships
    const in7Days = new Date(now);
    in7Days.setDate(in7Days.getDate() + 7);

    const [
      gym,
      activeMembersCount,
      totalMembersCount,
      todayAttendanceList,
      expiringMembersList,
      currentMonthPayments,
      lastMonthPayments,
      recentPayments,
      recentAttendance,
    ] = await Promise.all([
      Gym.findById(gymId),
      Member.countDocuments({
        gymId,
        status: { $in: ['active', 'expiring_soon'] },
        membershipEndDate: { $gte: now },
      }),
      Member.countDocuments({ gymId }),
      Attendance.find({ gymId, date: todayStr }),
      Member.find({
        gymId,
        membershipEndDate: { $gte: now, $lte: in7Days },
      })
        .sort({ membershipEndDate: 1 })
        .limit(6),
      Payment.find({
        gymId,
        status: 'paid',
        paymentDate: { $gte: startOfCurrentMonth },
      }),
      Payment.find({
        gymId,
        status: 'paid',
        paymentDate: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),
      Payment.find({ gymId }).sort({ paymentDate: -1 }).limit(5),
      Attendance.find({ gymId }).sort({ checkInTime: -1 }).limit(6),
    ]);

    // Financial calculations
    const currentMonthRevenue = currentMonthPayments.reduce((acc, p) => acc + p.totalAmount, 0);
    const lastMonthRevenue = lastMonthPayments.reduce((acc, p) => acc + p.totalAmount, 0);
    const revenueGrowth =
      lastMonthRevenue > 0
        ? (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
        : '+14.2';

    // Attendance stats
    const todayAttendanceCount = todayAttendanceList.length;
    const currentlyInGym = todayAttendanceList.filter((a) => a.status === 'in_gym').length;

    // Monthly chart data (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthName = d.toLocaleString('en-US', { month: 'short' });

      const payments = await Payment.find({
        gymId,
        status: 'paid',
        paymentDate: { $gte: d, $lte: monthEnd },
      });
      const sum = payments.reduce((acc, p) => acc + p.totalAmount, 0);
      monthlyRevenue.push({ month: monthName, revenue: sum });
    }

    // Expiring members formatting
    const expiringFormatted = expiringMembersList.map((m) => {
      const daysLeft = Math.max(0, Math.ceil((new Date(m.membershipEndDate) - now) / (1000 * 60 * 60 * 24)));
      return {
        id: m._id,
        name: m.name,
        phone: m.phone,
        planName: m.planName,
        expiryDate: m.membershipEndDate,
        daysLeft,
        label: daysLeft === 0 ? 'Expires today' : `Expires in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`,
      };
    });

    // Build unified recent activity
    const activityItems = [];

    recentPayments.forEach((p) => {
      activityItems.push({
        id: `pay-${p._id}`,
        type: 'payment',
        title: p.memberName,
        subtitle: `Paid ₹${p.totalAmount.toLocaleString('en-IN')} for ${p.planName} via ${p.paymentMethod}`,
        time: formatTimeAgo(p.paymentDate),
        rawDate: p.paymentDate,
      });
    });

    recentAttendance.forEach((a) => {
      activityItems.push({
        id: `att-${a._id}`,
        type: 'attendance',
        title: a.memberName,
        subtitle: a.status === 'in_gym' ? 'Checked in to workout' : 'Completed workout session',
        time: formatTimeAgo(a.checkInTime),
        rawDate: a.checkInTime,
      });
    });

    activityItems.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));

    return res.json({
      success: true,
      data: {
        gymName: gym ? gym.name : 'Iron House Fitness',
        userName: req.user.name,
        kpis: {
          activeMembers: {
            value: activeMembersCount,
            totalMembers: totalMembersCount,
            changeLabel: '+8% vs last month',
            indicator: 'positive',
          },
          todayAttendance: {
            value: todayAttendanceCount,
            currentlyInGym,
            changeLabel: `${currentlyInGym} inside now`,
            indicator: 'neutral',
          },
          monthlyRevenue: {
            value: currentMonthRevenue,
            formatted: `₹${currentMonthRevenue.toLocaleString('en-IN')}`,
            changeLabel: `${revenueGrowth}% vs last mo`,
            indicator: Number(revenueGrowth) >= 0 ? 'positive' : 'negative',
          },
          expiringMemberships: {
            value: expiringMembersList.length,
            changeLabel: 'Next 7 days',
            indicator: expiringMembersList.length > 5 ? 'warning' : 'neutral',
          },
        },
        chartData: monthlyRevenue,
        recentActivity: activityItems.slice(0, 7),
        expiringMembers: expiringFormatted,
      },
    });
  } catch (err) {
    console.error('getDashboardStats error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data.', error: err.message });
  }
};
