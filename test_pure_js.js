/**
 * Comprehensive Node.js verification test for FindBack Pure JavaScript Architecture
 */

// Mock browser window and localStorage for Node.js test environment
const storageMock = {};
global.localStorage = {
  getItem: (key) => storageMock[key] || null,
  setItem: (key, val) => { storageMock[key] = String(val); },
  removeItem: (key) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

global.window = {
  location: { pathname: '/dashboard.html', search: '' }
};

// Load pure JS modules
const fs = require('fs');
let dbCode = fs.readFileSync('js/db.js', 'utf8').replace('const FindBackDB =', 'global.FindBackDB =');
let matchingCode = fs.readFileSync('js/matching.js', 'utf8').replace('const MatchingEngine =', 'global.MatchingEngine =');
let apiCode = fs.readFileSync('js/api.js', 'utf8').replace('const Auth =', 'global.Auth =').replace('async function apiFetch', 'global.apiFetch = async function');

eval(dbCode);
eval(matchingCode);
eval(apiCode);

async function runTests() {
  console.log("=== Testing FindBack Pure JavaScript Engine ===");

  let passed = 0;
  let failed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // Test 1: DB Initialization & Seed Data
  const categories = FindBackDB.getAll('categories');
  assert(categories.length === 12, `Categories seeded correctly (found ${categories.length})`);

  const users = FindBackDB.getAll('users');
  assert(users.length >= 5, `Users seeded correctly (found ${users.length})`);

  const reports = FindBackDB.getAll('reports');
  assert(reports.length >= 7, `Reports seeded correctly (found ${reports.length})`);

  // Test 2: Auth Login
  try {
    const loginRes = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'sarah.jenkins@example.com', password: 'User@123456' })
    });
    assert(loginRes.user && loginRes.user.id === 2, `Sarah logged in successfully (id: ${loginRes.user.id})`);
    Auth.setToken(loginRes.token);
    Auth.setUser(loginRes.user);
  } catch (e) {
    assert(false, `Sarah login failed: ${e.message}`);
  }

  // Test 3: Auth /me
  try {
    const meRes = await apiFetch('/auth/me');
    assert(meRes.user.stats.lost_count > 0, `Stats retrieved: lost_count=${meRes.user.stats.lost_count}`);
  } catch (e) {
    assert(false, `Auth /me failed: ${e.message}`);
  }

  // Test 4: 100-Point Matching Engine
  const lostReport = FindBackDB.getById('reports', 1);
  const foundReport = FindBackDB.getById('reports', 2);
  const matchResult = MatchingEngine.evaluatePair(lostReport, foundReport);
  console.log(`Match score for Wallet reports: ${matchResult.total_score}%`);
  assert(matchResult.total_score >= 80.0, `Matching Engine evaluates Wallet pair with high confidence (Score: ${matchResult.total_score}%)`);
  assert(matchResult.category_score === 25.0, `Category score: ${matchResult.category_score}/25`);
  assert(matchResult.location_score === 25.0, `Location score: ${matchResult.location_score}/25`);
  assert(matchResult.date_score === 15.0, `Date score: ${matchResult.date_score}/15`);

  // Test 5: Duplicate Detection
  const dupCheck = MatchingEngine.checkForDuplicates(
    2, 'LOST', 1, 'Black Leather Bifold Wallet', '2026-09-08', 'Main Campus Library 2nd Floor', 37.774929, -122.419416, 'lost near study area'
  );
  assert(dupCheck.is_duplicate === true, `Duplicate detector flagged duplicate lost report`);

  // Test 6: Sensitive Item Protection
  const isSensitive = MatchingEngine.isItemSensitive('ID Card', 'University Student ID', 'lost barcode badge');
  assert(isSensitive === true, `Sensitive item detected for student ID`);
  const maskedText = MatchingEngine.maskSensitiveText('Card number is 482910394819 for student');
  assert(maskedText.includes('••••••••'), `Sensitive card number masked correctly: ${maskedText}`);

  // Test 7: Submitting a new Lost Report via apiFetch
  try {
    const newLost = await apiFetch('/reports/lost', {
      method: 'POST',
      body: JSON.stringify({
        item_name: 'Hydro Flask Water Bottle Navy Blue',
        category_id: 11,
        report_date: '2026-09-11',
        location_name: 'Student Rec Center Gym',
        description: 'Navy blue 32oz Hydro Flask with white mountain sticker',
        identifying_characteristics: 'Small dent on bottom rim',
        latitude: 37.7760,
        longitude: -122.4200
      })
    });
    assert(newLost.report && newLost.report.case_id.startsWith('FB-'), `Report created with Case ID: ${newLost.report.case_id}`);
  } catch (e) {
    assert(false, `Report creation failed: ${e.message}`);
  }

  // Test 8: Submitting a Claim via apiFetch
  try {
    const claimRes = await apiFetch('/claims', {
      method: 'POST',
      body: JSON.stringify({
        report_id: 4, // Emily's found laptop
        match_id: 2,
        verification_response: { q1: 'Octocat sticker and Python logo' }
      })
    });
    assert(claimRes.claim && claimRes.claim.id > 0, `Claim submitted successfully (Claim #${claimRes.claim.id})`);
  } catch (e) {
    assert(false, `Claim submission failed: ${e.message}`);
  }

  // Test 9: Admin Operations
  try {
    const adminUser = FindBackDB.getById('users', 1);
    Auth.setUser(adminUser);
    Auth.setToken('admin_token');

    const dashMetrics = await apiFetch('/admin/dashboard');
    assert(dashMetrics.metrics.total_users >= 5, `Admin dashboard metrics loaded (Users: ${dashMetrics.metrics.total_users})`);
    assert(dashMetrics.metrics.recovery_rate >= 0, `Admin recovery rate: ${dashMetrics.metrics.recovery_rate}%`);

    const heatmapRes = await apiFetch('/admin/heatmap');
    assert(heatmapRes.points.length > 0, `Admin heatmap points retrieved (Points: ${heatmapRes.points.length})`);

    const auditRes = await apiFetch('/admin/audit-logs');
    assert(auditRes.logs.length > 0, `Admin audit logs retrieved (${auditRes.logs.length} entries)`);
  } catch (e) {
    assert(false, `Admin operations failed: ${e.message}`);
  }

  // Test 10: Official Case QR Resolver
  try {
    const caseRes = await apiFetch('/cases/FB-2026-001001');
    assert(caseRes.report && caseRes.report.item_name.includes('Wallet'), `Case QR resolver resolved FB-2026-001001`);
  } catch (e) {
    assert(false, `Case resolver failed: ${e.message}`);
  }

  console.log(`\n=== Verification Complete: ${passed} Passed, ${failed} Failed ===`);
}

runTests();
