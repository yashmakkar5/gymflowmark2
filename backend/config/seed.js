const mongoose = require('mongoose');
const Gym = require('../models/Gym');
const User = require('../models/User');
const Plan = require('../models/Plan');
const Member = require('../models/Member');
const Subscription = require('../models/Subscription');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Trainer = require('../models/Trainer');
const Class = require('../models/Class');

async function seedDatabase() {
  console.log('--- Starting Seed Process ---');

  // Check if gym already exists
  const existingGym = await Gym.findOne({ email: 'vikram@ironhouse.in' });
  if (existingGym) {
    console.log('Seed data already present. Skipping re-seed.');
    return { gym: existingGym };
  }

  // 1. Create Primary Gym
  const gym = await Gym.create({
    name: 'Iron House Fitness',
    ownerName: 'Vikram Oberoi',
    email: 'vikram@ironhouse.in',
    phone: '+91 98201 54321',
    address: 'Plot 42, Central Avenue, Hiranandani Gardens, Powai',
    city: 'Mumbai',
    currency: 'INR',
    currencySymbol: '₹',
    gstin: '27AAACG0561K1Z2',
    settings: {
      gracePeriodDays: 3,
      requireCheckinApproval: false,
    },
  });

  // 2. Create Owner User
  const owner = await User.create({
    gymId: gym._id,
    name: 'Vikram Oberoi',
    email: 'vikram@ironhouse.in',
    password: 'admin123',
    role: 'owner',
    phone: '+91 98201 54321',
  });

  // Front desk staff
  await User.create({
    gymId: gym._id,
    name: 'Pooja Nair',
    email: 'pooja@ironhouse.in',
    password: 'staff123',
    role: 'staff',
    phone: '+91 98201 99887',
  });

  // 3. Create Multi-Tenant Comparison Gym
  const gym2 = await Gym.create({
    name: 'CrossFit Elevate',
    ownerName: 'Rohan Verma',
    email: 'rohan@crossfitelevate.in',
    phone: '+91 98765 12340',
    address: 'Indiranagar 100ft Road',
    city: 'Bengaluru',
    currency: 'INR',
    currencySymbol: '₹',
    gstin: '29BBBCG1234L1Z5',
  });

  await User.create({
    gymId: gym2._id,
    name: 'Rohan Verma',
    email: 'rohan@crossfitelevate.in',
    password: 'admin123',
    role: 'owner',
    phone: '+91 98765 12340',
  });

  // 4. Create Plans for Iron House Fitness
  const basicPlan = await Plan.create({
    gymId: gym._id,
    name: 'Basic',
    price: 999,
    durationMonths: 1,
    description: 'Essential gym floor access, cardio zone, and standard locker facility.',
    features: ['General Gym Floor Access', 'Cardio & Strength Machines', 'Standard Locker Room'],
  });

  const premiumPlan = await Plan.create({
    gymId: gym._id,
    name: 'Premium',
    price: 1499,
    durationMonths: 1,
    description: 'Full facility access including steam, sauna, and weekend group HIIT classes.',
    features: ['All Basic Amenities', 'Steam & Sauna Access', 'Weekend Group HIIT', '1 Free Trainer Assessment'],
  });

  const elitePlan = await Plan.create({
    gymId: gym._id,
    name: 'Elite',
    price: 3999,
    durationMonths: 3,
    description: '3-Month comprehensive athlete pass with personal diet charts and class priority.',
    features: ['Unlimited All-Access', 'Personal Nutrition Guide', 'All Daily Classes Included', 'Priority Equipment Booking'],
  });

  const annualPlan = await Plan.create({
    gymId: gym._id,
    name: 'Annual Pro',
    price: 12999,
    durationMonths: 12,
    description: 'VIP annual membership with dedicated trainer sessions and free guest passes.',
    features: ['365 Days Access', '12 Personal Training Sessions', 'Dedicated Locker', 'Unlimited Guest Passes'],
  });

  // 5. Create Trainers
  const sameer = await Trainer.create({
    gymId: gym._id,
    name: 'Sameer Khan',
    role: 'Head Strength Coach',
    specialization: 'Hypertrophy & Powerlifting',
    phone: '+91 98334 11223',
    email: 'sameer@ironhouse.in',
    shift: 'Morning (06:00 AM - 02:00 PM)',
    status: 'active',
  });

  const ananya = await Trainer.create({
    gymId: gym._id,
    name: 'Ananya Deshmukh',
    role: 'Yoga & Mobility Coach',
    specialization: 'Hatha Yoga & Posture Correction',
    phone: '+91 98221 44556',
    email: 'ananya@ironhouse.in',
    shift: 'Evening (02:00 PM - 10:00 PM)',
    status: 'active',
  });

  const kabir = await Trainer.create({
    gymId: gym._id,
    name: 'Kabir Singh',
    role: 'Functional Conditioning Coach',
    specialization: 'CrossFit & Athletic Conditioning',
    phone: '+91 98112 77889',
    email: 'kabir@ironhouse.in',
    shift: 'Full Shift (07:00 AM - 04:00 PM)',
    status: 'active',
  });

  // 6. Create Classes
  await Class.create([
    {
      gymId: gym._id,
      name: 'Morning Power Yoga',
      trainerId: ananya._id,
      trainerName: ananya.name,
      dayOfWeek: 'Monday',
      time: '07:00 AM - 08:00 AM',
      capacity: 20,
      bookedSeats: 14,
      status: 'scheduled',
    },
    {
      gymId: gym._id,
      name: 'Iron HIIT Conditioning',
      trainerId: kabir._id,
      trainerName: kabir.name,
      dayOfWeek: 'Tuesday',
      time: '06:30 PM - 07:30 PM',
      capacity: 18,
      bookedSeats: 16,
      status: 'scheduled',
    },
    {
      gymId: gym._id,
      name: 'Deadlift & Barbell Mastery',
      trainerId: sameer._id,
      trainerName: sameer.name,
      dayOfWeek: 'Wednesday',
      time: '07:00 PM - 08:15 PM',
      capacity: 12,
      bookedSeats: 10,
      status: 'scheduled',
    },
    {
      gymId: gym._id,
      name: 'Cardio Core Blast',
      trainerId: kabir._id,
      trainerName: kabir.name,
      dayOfWeek: 'Friday',
      time: '08:00 AM - 09:00 AM',
      capacity: 25,
      bookedSeats: 21,
      status: 'scheduled',
    },
  ]);

  // 7. Create Members with realistic dates
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  function daysOffset(d) {
    const res = new Date(now);
    res.setDate(res.getDate() + d);
    return res;
  }

  const membersData = [
    {
      code: 'GF-1001',
      name: 'Rahul Sharma',
      phone: '98204 11221',
      email: 'rahul.sharma@gmail.com',
      gender: 'male',
      plan: premiumPlan,
      joined: daysOffset(-90),
      start: daysOffset(-20),
      end: daysOffset(40),
      status: 'active',
      trainer: sameer._id,
      notes: 'Focusing on strength progression and bench press PR.',
    },
    {
      code: 'GF-1002',
      name: 'Aman Singh',
      phone: '98192 33445',
      email: 'aman.singh@outlook.com',
      gender: 'male',
      plan: premiumPlan,
      joined: daysOffset(-60),
      start: daysOffset(-28),
      end: daysOffset(2), // Expiring in 2 days!
      status: 'expiring_soon',
      trainer: sameer._id,
      notes: 'Reminder sent via WhatsApp for upcoming renewal.',
    },
    {
      code: 'GF-1003',
      name: 'Karan Kumar',
      phone: '98331 55667',
      email: 'karan.kumar@yahoo.com',
      gender: 'male',
      plan: elitePlan,
      joined: daysOffset(-45),
      start: daysOffset(-45),
      end: daysOffset(45),
      status: 'active',
      trainer: kabir._id,
      notes: 'CrossFit enthusiast. Morning slot regular.',
    },
    {
      code: 'GF-1004',
      name: 'Simran Kaur',
      phone: '98210 77889',
      email: 'simran.kaur@gmail.com',
      gender: 'female',
      plan: basicPlan,
      joined: daysOffset(-120),
      start: daysOffset(-15),
      end: daysOffset(15),
      status: 'active',
      trainer: ananya._id,
      notes: 'Prefers evening treadmill & mobility routine.',
    },
    {
      code: 'GF-1005',
      name: 'Arjun Mehta',
      phone: '98205 99001',
      email: 'arjun.mehta@rediffmail.com',
      gender: 'male',
      plan: basicPlan,
      joined: daysOffset(-30),
      start: daysOffset(-26),
      end: daysOffset(4), // Expiring in 4 days!
      status: 'expiring_soon',
      notes: 'Requested consultation for upgrading to Elite.',
    },
    {
      code: 'GF-1006',
      name: 'Priya Patel',
      phone: '98190 22334',
      email: 'priya.patel@gmail.com',
      gender: 'female',
      plan: annualPlan,
      joined: daysOffset(-180),
      start: daysOffset(-180),
      end: daysOffset(185),
      status: 'active',
      trainer: ananya._id,
      notes: 'Annual Pro subscriber. Attends yoga on Monday & Thursday.',
    },
    {
      code: 'GF-1007',
      name: 'Devendra Rathore',
      phone: '98335 44556',
      email: 'devendra.rathore@gmail.com',
      gender: 'male',
      plan: basicPlan,
      joined: daysOffset(-90),
      start: daysOffset(-60),
      end: daysOffset(-5), // Expired 5 days ago!
      status: 'expired',
      notes: 'Membership lapsed on Oct 21. Needs follow-up call.',
    },
    {
      code: 'GF-1008',
      name: 'Neha Sengupta',
      phone: '98218 66778',
      email: 'neha.s@gmail.com',
      gender: 'female',
      plan: premiumPlan,
      joined: daysOffset(-40),
      start: daysOffset(-10),
      end: daysOffset(20),
      status: 'active',
      trainer: kabir._id,
      notes: 'Joined after free trial. High consistency.',
    },
  ];

  const createdMembers = [];

  for (const mData of membersData) {
    const member = await Member.create({
      gymId: gym._id,
      memberCode: mData.code,
      name: mData.name,
      phone: mData.phone,
      email: mData.email,
      gender: mData.gender,
      address: 'Powai, Mumbai',
      emergencyContact: {
        name: 'Family Member',
        phone: '+91 98000 11111',
        relation: 'Spouse / Parent',
      },
      planId: mData.plan._id,
      planName: mData.plan.name,
      joinedDate: mData.joined,
      membershipStartDate: mData.start,
      membershipEndDate: mData.end,
      status: mData.status,
      paymentStatus: mData.status === 'expired' ? 'overdue' : 'paid',
      assignedTrainer: mData.trainer || null,
      notes: mData.notes,
    });

    createdMembers.push(member);

    // Initial Subscription record
    await Subscription.create({
      gymId: gym._id,
      memberId: member._id,
      planId: mData.plan._id,
      planName: mData.plan.name,
      amount: mData.plan.price,
      startDate: mData.start,
      endDate: mData.end,
      status: mData.status === 'expired' ? 'expired' : 'active',
    });

    // Create payment record
    if (mData.status !== 'expired') {
      const tax = Math.round((mData.plan.price * 18) / 118);
      await Payment.create({
        gymId: gym._id,
        receiptNumber: `REC-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        memberId: member._id,
        memberName: member.name,
        memberPhone: member.phone,
        planId: mData.plan._id,
        planName: mData.plan.name,
        amount: mData.plan.price - tax,
        taxAmount: tax,
        totalAmount: mData.plan.price,
        paymentMethod: ['UPI', 'Card', 'UPI', 'Cash'][Math.floor(Math.random() * 4)],
        transactionReference: `UPI/${Date.now().toString().slice(-6)}/${member.phone.slice(-4)}`,
        status: 'paid',
        paymentDate: mData.start,
      });
    }
  }

  // 8. Add Recent Attendance for Today
  const checkinTimes = [
    { member: createdMembers[0], timeOffsetHours: -2, status: 'in_gym' },
    { member: createdMembers[1], timeOffsetHours: -1.5, status: 'in_gym' },
    { member: createdMembers[2], timeOffsetHours: -4, status: 'completed' },
    { member: createdMembers[3], timeOffsetHours: -3.5, status: 'completed' },
    { member: createdMembers[5], timeOffsetHours: -0.5, status: 'in_gym' },
  ];

  for (const c of checkinTimes) {
    const inTime = new Date(now.getTime() + c.timeOffsetHours * 3600 * 1000);
    const outTime = c.status === 'completed' ? new Date(inTime.getTime() + 75 * 60 * 1000) : null;

    await Attendance.create({
      gymId: gym._id,
      memberId: c.member._id,
      memberName: c.member.name,
      memberPhone: c.member.phone,
      date: todayStr,
      checkInTime: inTime,
      checkOutTime: outTime,
      status: c.status,
    });
  }

  console.log('--- Database Seeding Completed Successfully ---');
  console.log('Demo Account: vikram@ironhouse.in / admin123');
  return { gym, owner };
}

module.exports = { seedDatabase };
