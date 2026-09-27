import http from "http";
import app from "./app.js";
import { initDb, query } from "./config/database.js";
import { getTodayDateString, getYesterdayDateString } from "./utils/dateUtils.js";

async function runComprehensiveTests() {
  console.log("=================================================");
  console.log(" HABITFORGE DEEP-VERIFICATION TEST SUITE");
  console.log("=================================================\n");

  await initDb();
  await query("DELETE FROM users WHERE email IN ('alpha@example.com', 'beta@example.com')");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let testsPassed = 0;
  let testsFailed = 0;

  async function request(path, options = {}) {
    const url = `${baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const res = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  function assert(condition, message) {
    if (condition) {
      console.log(`PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // 1. Health Endpoint
    const health = await request("/health");
    assert(health.status === 200 && health.data.status === "ok", "1. GET /api/health returns HTTP 200 and status ok");

    // 2. Register User A
    const userAData = {
      name: "User Alpha",
      email: "alpha@example.com",
      password: "securePassword123"
    };
    const regA = await request("/auth/register", { method: "POST", body: userAData });
    assert(
      regA.status === 201 &&
      regA.data.token &&
      regA.data.user.email === "alpha@example.com" &&
      regA.data.user.password_hash === undefined &&
      regA.data.user.total_xp === 0,
      "2. User A registration creates user, returns JWT, excludes password hash, and starts with 0 XP"
    );
    const tokenA = regA.data.token;
    const userAId = regA.data.user.id;

    // 3. Duplicate Email Registration
    const regDup = await request("/auth/register", { method: "POST", body: userAData });
    assert(regDup.status === 409, "3. Duplicate email registration rejected with HTTP 409 Conflict");

    // 4. Login User A
    const loginA = await request("/auth/login", {
      method: "POST",
      body: { email: "alpha@example.com", password: "securePassword123" }
    });
    assert(loginA.status === 200 && loginA.data.token && loginA.data.user.id === userAId, "4. Login succeeds and returns valid JWT");

    // 5. Invalid Login (wrong password)
    const invalidLogin = await request("/auth/login", {
      method: "POST",
      body: { email: "alpha@example.com", password: "wrongPassword" }
    });
    assert(invalidLogin.status === 401, "5. Invalid password rejected with HTTP 401 Unauthorized");

    // 6. Nonexistent user login
    const nonexistentLogin = await request("/auth/login", {
      method: "POST",
      body: { email: "nobody@example.com", password: "somePassword" }
    });
    assert(nonexistentLogin.status === 401, "6. Nonexistent email login rejected with HTTP 401 Unauthorized");

    // 7. GET /api/auth/me and GET /api/users/me
    const meAuth = await request("/auth/me", { headers: { Authorization: `Bearer ${tokenA}` } });
    const meUser = await request("/users/me", { headers: { Authorization: `Bearer ${tokenA}` } });
    assert(
      meAuth.status === 200 &&
      meUser.status === 200 &&
      meAuth.data.user.email === "alpha@example.com" &&
      meAuth.data.user.password_hash === undefined,
      "7. GET /api/auth/me and GET /api/users/me return safe user profile without password"
    );

    // 8. Protected endpoints reject missing or malformed tokens
    const noToken = await request("/habits");
    const badToken = await request("/habits", { headers: { Authorization: "Bearer invalid.fake.token" } });
    assert(noToken.status === 401 && badToken.status === 401, "8. Protected routes reject missing and invalid JWT with HTTP 401");

    // 9. Create Habit for User A
    const habitRes1 = await request("/habits", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: "Morning Meditation", icon: "🧘", category: "Mindfulness" }
    });
    assert(
      habitRes1.status === 201 &&
      habitRes1.data.habit.name === "Morning Meditation" &&
      habitRes1.data.habit.streak === 0 &&
      habitRes1.data.habit.done === false,
      "9. POST /api/habits creates habit initialized with streak=0, done=false"
    );
    const habitAId = habitRes1.data.habit.id;

    // 10. Read Habits for User A
    const listA = await request("/habits", { headers: { Authorization: `Bearer ${tokenA}` } });
    assert(listA.status === 200 && listA.data.habits.length === 1 && listA.data.habits[0].id === habitAId, "10. GET /api/habits returns User A's habits");

    // 11. Read Single Habit by ID
    const singleA = await request(`/habits/${habitAId}`, { headers: { Authorization: `Bearer ${tokenA}` } });
    assert(singleA.status === 200 && singleA.data.habit.name === "Morning Meditation", "11. GET /api/habits/:id retrieves habit");

    // 12. Update Habit for User A
    const updateA = await request(`/habits/${habitAId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: "Deep Mindfulness", icon: "✨", category: "Mindfulness" }
    });
    assert(updateA.status === 200 && updateA.data.habit.name === "Deep Mindfulness" && updateA.data.habit.icon === "✨", "12. PUT /api/habits/:id updates name and icon");

    // 13. Complete Habit (First time today)
    const today = getTodayDateString();
    const comp1 = await request(`/habits/${habitAId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { date: today }
    });
    assert(
      comp1.status === 200 &&
      comp1.data.xpGained === 10 &&
      comp1.data.totalXp === 10 &&
      comp1.data.currentStreak === 1 &&
      comp1.data.newlyRecorded === true &&
      comp1.data.updatedHabit.done === true,
      "13. First completion today awards +10 XP, updates streak=1, sets done=true"
    );

    // 14. Complete Same Habit Again Today (Duplicate Protection)
    const compDup = await request(`/habits/${habitAId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { date: today }
    });
    assert(
      compDup.status === 200 &&
      compDup.data.xpGained === 0 &&
      compDup.data.totalXp === 10 &&
      compDup.data.currentStreak === 1 &&
      compDup.data.newlyRecorded === false,
      "14. Duplicate same-day completion awards 0 XP, preserves streak=1, newlyRecorded=false"
    );

    // 15. Create User B for Cross-User Isolation Testing
    const userBData = {
      name: "User Beta",
      email: "beta@example.com",
      password: "betaPassword456"
    };
    const regB = await request("/auth/register", { method: "POST", body: userBData });
    const tokenB = regB.data.token;

    // 16. User B cannot see User A's habits in list
    const listB = await request("/habits", { headers: { Authorization: `Bearer ${tokenB}` } });
    assert(listB.status === 200 && listB.data.habits.length === 0, "16. User B habit list is empty (cannot see User A's habits)");

    // 17. User B cannot GET User A's habit
    const crossGet = await request(`/habits/${habitAId}`, { headers: { Authorization: `Bearer ${tokenB}` } });
    assert(crossGet.status === 404, "17. Cross-user GET habit rejected with HTTP 404 Not Found");

    // 18. User B cannot PUT User A's habit
    const crossPut = await request(`/habits/${habitAId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenB}` },
      body: { name: "Hacked Habit" }
    });
    assert(crossPut.status === 404, "18. Cross-user PUT habit rejected with HTTP 404 Not Found");

    // 19. User B cannot COMPLETE User A's habit
    const crossComplete = await request(`/habits/${habitAId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossComplete.status === 404, "19. Cross-user POST complete rejected with HTTP 404 Not Found");

    // 20. User B cannot GET User A's habit completion history
    const crossHistory = await request(`/habits/${habitAId}/completions`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossHistory.status === 404, "20. Cross-user GET completions rejected with HTTP 404 Not Found");

    // 21. User B cannot DELETE User A's habit
    const crossDelete = await request(`/habits/${habitAId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert(crossDelete.status === 404, "21. Cross-user DELETE habit rejected with HTTP 404 Not Found");

    // 22. Multi-day streak verification: Next day completion increments streak
    const habitRes2 = await request("/habits", {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { name: "Daily Workout", icon: "💪", category: "Health" }
    });
    const habit2Id = habitRes2.data.habit.id;

    // Complete yesterday
    const yesterday = getYesterdayDateString();
    await request(`/habits/${habit2Id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { date: yesterday }
    });

    // Complete today (consecutive day)
    const consecutiveComp = await request(`/habits/${habit2Id}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${tokenA}` },
      body: { date: today }
    });
    assert(
      consecutiveComp.status === 200 &&
      consecutiveComp.data.currentStreak === 2 &&
      consecutiveComp.data.xpGained === 10,
      "22. Consecutive day completion increments streak from 1 to 2"
    );

    // 23. Weekly Analytics Verification
    const analytics = await request("/analytics/weekly", { headers: { Authorization: `Bearer ${tokenA}` } });
    assert(
      analytics.status === 200 &&
      Array.isArray(analytics.data.dates) &&
      analytics.data.dates.length === 7 &&
      Array.isArray(analytics.data.counts) &&
      analytics.data.counts.length === 7 &&
      analytics.data.totalCompletions === 3,
      "23. GET /api/analytics/weekly returns exactly 7 calendar dates and 3 verified completions"
    );

    // 24. Delete Habit for User A
    const delRes = await request(`/habits/${habit2Id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert(delRes.status === 200 && delRes.data.success === true, "24. DELETE /api/habits/:id successfully removes habit");

    console.log(`\n=================================================`);
    console.log(` FINAL RESULTS: ${testsPassed} Passed, ${testsFailed} Failed`);
    console.log(`=================================================\n`);

  } finally {
    try {
      await query("DELETE FROM users WHERE email IN ('alpha@example.com', 'beta@example.com')");
    } catch (_) {}
    server.close();
  }

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runComprehensiveTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
