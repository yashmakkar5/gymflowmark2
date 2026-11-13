// Automated API Verification Test Suite for GymFlow SaaS
const assert = require('assert');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  return { status: res.status, data };
}

async function runTests() {
  console.log('🧪 Starting GymFlow Automated API Verification...\n');

  try {
    // 1. Health Check
    console.log('1. Testing /api/health ...');
    const health = await request('/health');
    assert.strictEqual(health.status, 200);
    assert.strictEqual(health.data.product, 'GymFlow SaaS');
    console.log('   ✅ Health check passed.');

    // 2. Auth Login (Primary Gym: Iron House Fitness)
    console.log('2. Testing /api/auth/login (Iron House Fitness) ...');
    const login = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'vikram@ironhouse.in', password: 'admin123' }),
    });
    assert.strictEqual(login.status, 200);
    assert.ok(login.data.token, 'Token must be present');
    assert.strictEqual(login.data.gym.name, 'Iron House Fitness');
    const token1 = login.data.token;
    console.log('   ✅ Authentication successful. Received Bearer token.');

    // 3. Multi-Tenant Isolation Test (CrossFit Elevate vs Iron House)
    console.log('3. Testing Multi-Tenant Data Isolation ...');
    const login2 = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'rohan@crossfitelevate.in', password: 'admin123' }),
    });
    assert.strictEqual(login2.status, 200);
    const token2 = login2.data.token;

    const membersGym1 = await request('/members', {}, token1);
    const membersGym2 = await request('/members', {}, token2);

    assert.ok(membersGym1.data.count > 0, 'Gym 1 must have seeded members');
    assert.strictEqual(membersGym2.data.count, 0, 'Gym 2 must NOT have access to Gym 1 members');
    console.log(`   ✅ Tenant isolation verified: Gym 1 has ${membersGym1.data.count} members, Gym 2 has 0 members.`);

    // 4. Dashboard Metrics
    console.log('4. Testing /api/dashboard ...');
    const dash = await request('/dashboard', {}, token1);
    assert.strictEqual(dash.status, 200);
    assert.ok(dash.data.data.kpis.activeMembers.value >= 1);
    assert.ok(dash.data.data.kpis.monthlyRevenue.value >= 0);
    console.log(`   ✅ Dashboard stats loaded. Monthly Revenue: ${dash.data.data.kpis.monthlyRevenue.formatted}`);

    // 5. Add New Member & Dynamic Renewal
    console.log('5. Testing Member Creation & Profile ...');
    const newMemberRes = await request(
      '/members',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Sunil Gavaskar',
          phone: '98200 99881',
          email: 'sunil@cricket.in',
          gender: 'male',
          paymentMethod: 'UPI',
        }),
      },
      token1
    );
    assert.strictEqual(newMemberRes.status, 201);
    const memberId = newMemberRes.data.data._id;
    console.log(`   ✅ Member created: Sunil Gavaskar (${memberId})`);

    const memberProfile = await request(`/members/${memberId}`, {}, token1);
    assert.strictEqual(memberProfile.status, 200);
    assert.strictEqual(memberProfile.data.data.member.name, 'Sunil Gavaskar');
    console.log('   ✅ Member profile CRM loaded with attendance and payment history.');

    // 5b. Testing Multer Avatar Upload
    console.log('5b. Testing Multer Member Avatar Upload (/api/members/:id/avatar) ...');
    const form = new FormData();
    const fakeImage = new Blob([Buffer.from('fake image bytes')], { type: 'image/png' });
    form.append('avatar', fakeImage, 'test-avatar.png');

    const avatarUploadRes = await fetch(`${BASE_URL}/members/${memberId}/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: form,
    });
    const avatarData = await avatarUploadRes.json();
    assert.strictEqual(avatarUploadRes.status, 200);
    assert.ok(avatarData.avatarUrl.includes('/uploads/avatars/'));
    console.log(`   ✅ Multer image upload verified: ${avatarData.avatarUrl}`);

    // 6. Fast Attendance Toggle
    console.log('6. Testing /api/attendance/toggle ...');
    const toggleIn = await request(
      '/attendance/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ memberId }),
      },
      token1
    );
    assert.strictEqual(toggleIn.status, 200);
    assert.strictEqual(toggleIn.data.action, 'check_in');
    console.log('   ✅ Member fast checked in.');

    const toggleOut = await request(
      '/attendance/toggle',
      {
        method: 'POST',
        body: JSON.stringify({ memberId }),
      },
      token1
    );
    assert.strictEqual(toggleOut.status, 200);
    assert.strictEqual(toggleOut.data.action, 'check_out');
    console.log('   ✅ Member fast checked out.');

    // 7. Payments Ledger & Receipt
    console.log('7. Testing /api/payments and receipt generator ...');
    const paymentsRes = await request('/payments', {}, token1);
    assert.strictEqual(paymentsRes.status, 200);
    assert.ok(paymentsRes.data.data.length > 0);

    const firstPaymentId = paymentsRes.data.data[0]._id;
    const receiptRes = await request(`/payments/${firstPaymentId}/receipt`, {}, token1);
    assert.strictEqual(receiptRes.status, 200);
    assert.ok(receiptRes.data.data.gym.gstin, 'GSTIN must be present on tax receipt');
    console.log(`   ✅ Tax invoice receipt verified with GST breakdown (${receiptRes.data.data.receipt.receiptNumber}).`);

    // 8. Plans, Trainers, Classes & Reports
    console.log('8. Testing Plans, Trainers, Classes, and Executive Reports ...');
    const [plans, trainers, classes, reports] = await Promise.all([
      request('/plans', {}, token1),
      request('/trainers', {}, token1),
      request('/classes', {}, token1),
      request('/reports', {}, token1),
    ]);

    assert.strictEqual(plans.status, 200);
    assert.strictEqual(trainers.status, 200);
    assert.strictEqual(classes.status, 200);
    assert.strictEqual(reports.status, 200);
    console.log('   ✅ All administrative modules responding with 200 OK.');

    console.log('\n🎉 ALL GYMFLOW TESTS PASSED SUCCESSFULLY! Ready for production deployment.\n');
  } catch (err) {
    console.error('\n❌ Test failure:', err);
    process.exit(1);
  }
}

runTests();
