process.env.NODE_ENV = 'test';
const assert = require('assert');
const http = require('http');
const app = require('../index');
const userService = require('../services/userService');

let server;
let baseUrl;

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

async function stopServer() {
  return new Promise((resolve) => {
    server.close(resolve);
  });
}

async function runTests() {
  await startServer();
  userService.resetStore();

  console.log('--- Starting Exercise Tracker Tests ---');

  try {
    // 1. POST /api/users to create a user
    const resUser1 = await fetch(`${baseUrl}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: 'fcc_test_user' }).toString()
    });
    const user1 = await resUser1.json();

    assert.strictEqual(resUser1.status, 200, 'POST /api/users should return 200');
    assert.strictEqual(user1.username, 'fcc_test_user', 'Username should match');
    assert.ok(user1._id && typeof user1._id === 'string', '_id should be string');
    console.log('✓ 1. Create user (POST /api/users) passed');

    // 2. GET /api/users to get all users
    const resAllUsers = await fetch(`${baseUrl}/api/users`);
    const allUsers = await resAllUsers.json();

    assert.strictEqual(resAllUsers.status, 200, 'GET /api/users should return 200');
    assert.ok(Array.isArray(allUsers), 'Response should be an array');
    assert.ok(allUsers.some(u => u.username === 'fcc_test_user' && u._id === user1._id), 'User list contains created user');
    console.log('✓ 2. Get all users (GET /api/users) passed');

    // 3. POST /api/users/:_id/exercises with specific date
    const resEx1 = await fetch(`${baseUrl}/api/users/${user1._id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        description: 'running',
        duration: '30',
        date: '1990-01-01'
      }).toString()
    });
    const ex1 = await resEx1.json();

    assert.strictEqual(resEx1.status, 200, 'POST exercise should return 200');
    assert.strictEqual(ex1._id, user1._id, '_id should match user');
    assert.strictEqual(ex1.username, 'fcc_test_user', 'username should match user');
    assert.strictEqual(ex1.description, 'running', 'description should match');
    assert.strictEqual(typeof ex1.duration, 'number', 'duration should be a number');
    assert.strictEqual(ex1.duration, 30, 'duration value should be 30');
    assert.strictEqual(typeof ex1.date, 'string', 'date should be string');
    assert.strictEqual(ex1.date, 'Mon Jan 01 1990', 'date string must be Mon Jan 01 1990');
    console.log('✓ 3. Add exercise with date passed');

    // 4. POST /api/users/:_id/exercises without date (defaults to today)
    const resEx2 = await fetch(`${baseUrl}/api/users/${user1._id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        description: 'cycling',
        duration: '45'
      }).toString()
    });
    const ex2 = await resEx2.json();

    assert.strictEqual(resEx2.status, 200);
    assert.strictEqual(ex2.description, 'cycling');
    assert.strictEqual(typeof ex2.duration, 'number');
    assert.strictEqual(ex2.duration, 45);
    assert.strictEqual(ex2.date, new Date().toDateString(), 'Date should default to today toDateString()');
    console.log('✓ 4. Add exercise without date passed');

    // 5. Add a 3rd exercise with another date
    await fetch(`${baseUrl}/api/users/${user1._id}/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        description: 'swimming',
        duration: '60',
        date: '1990-01-05'
      }).toString()
    });

    // 6. GET /api/users/:_id/logs
    const resLogs = await fetch(`${baseUrl}/api/users/${user1._id}/logs`);
    const logs = await resLogs.json();

    assert.strictEqual(resLogs.status, 200);
    assert.strictEqual(logs._id, user1._id);
    assert.strictEqual(logs.username, 'fcc_test_user');
    assert.strictEqual(typeof logs.count, 'number', 'count should be number');
    assert.strictEqual(logs.count, 3, 'count should be 3');
    assert.ok(Array.isArray(logs.log), 'log should be array');
    assert.strictEqual(logs.log.length, 3, 'log array should have 3 items');
    assert.strictEqual(logs.log[0].description, 'running');
    assert.strictEqual(typeof logs.log[0].duration, 'number');
    assert.strictEqual(typeof logs.log[0].date, 'string');
    console.log('✓ 5. Full log retrieval passed');

    // 7. GET /api/users/:_id/logs with from/to
    const resFromTo = await fetch(`${baseUrl}/api/users/${user1._id}/logs?from=1989-12-31&to=1990-01-02`);
    const logsFromTo = await resFromTo.json();

    assert.strictEqual(logsFromTo.count, 1, 'Should match 1 exercise in range 1989-12-31 to 1990-01-02');
    assert.strictEqual(logsFromTo.log[0].description, 'running');
    console.log('✓ 6. Log filtering with from & to passed');

    // 8. GET /api/users/:_id/logs with limit
    const resLimit = await fetch(`${baseUrl}/api/users/${user1._id}/logs?limit=2`);
    const logsLimit = await resLimit.json();

    assert.strictEqual(logsLimit.log.length, 2, 'Limit should slice array to 2');
    assert.strictEqual(logsLimit.count, 2, 'Count should match returned log length');
    console.log('✓ 7. Log limit parameter passed');

    // 8. User not found error check
    const resNotFound = await fetch(`${baseUrl}/api/users/nonexistent_id/logs`);
    assert.strictEqual(resNotFound.status, 404, 'Should return 404 for nonexistent user');
    console.log('✓ 8. Nonexistent user check passed');

    // 9. Add exercise with :_id in request body (HTML form simulation)
    const resFormPost = await fetch(`${baseUrl}/api/users/:_id/exercises`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        ':_id': user1._id,
        description: 'yoga',
        duration: '20'
      }).toString()
    });
    const formPostRes = await resFormPost.json();
    assert.strictEqual(resFormPost.status, 200);
    assert.strictEqual(formPostRes.description, 'yoga');
    assert.strictEqual(formPostRes.duration, 20);
    console.log('✓ 9. Form POST with body :_id passed');

    console.log('\n--- ALL EXERCISE TRACKER TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    await stopServer();
    userService.resetStore();
  }
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
