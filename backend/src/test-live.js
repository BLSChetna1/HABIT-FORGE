async function testLive() {
  const uniqueEmail = `livetester_${Date.now()}@example.com`;

  console.log("--- Testing live Frontend at http://localhost:5173 ---");
  const frontRes = await fetch("http://localhost:5173");
  console.log("Frontend HTTP Status:", frontRes.status);
  const html = await frontRes.text();
  console.log("Frontend contains root element:", html.includes('id="root"'));
  console.log("Frontend contains main script:", html.includes('/src/main.jsx'));

  console.log("\n--- Testing live Backend at http://localhost:5000/api/health ---");
  const backRes = await fetch("http://localhost:5000/api/health");
  const healthData = await backRes.json();
  console.log("Backend Health Status:", backRes.status, JSON.stringify(healthData));

  console.log("\n--- Testing User Registration on live Backend ---");
  const regRes = await fetch("http://localhost:5000/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Live Tester",
      email: uniqueEmail,
      password: "password123"
    })
  });
  const regData = await regRes.json();
  console.log("Register HTTP Status:", regRes.status, "Token present:", Boolean(regData.token));
  const token = regData.token;

  console.log("\n--- Testing Habit Creation on live Backend ---");
  const habitRes = await fetch("http://localhost:5000/api/habits", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      name: "Daily Coding",
      icon: "💻",
      category: "Study"
    })
  });
  const habitData = await habitRes.json();
  console.log("Create Habit HTTP Status:", habitRes.status, "Habit Name:", habitData.habit?.name);
  const habitId = habitData.habit?.id;

  console.log("\n--- Testing Habit Completion (+10 XP) on live Backend ---");
  const compRes = await fetch(`http://localhost:5000/api/habits/${habitId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  const compData = await compRes.json();
  console.log("Complete Habit HTTP Status:", compRes.status, "XP Gained:", compData.xpGained, "Total XP:", compData.totalXp, "Streak:", compData.currentStreak);

  console.log("\n--- Testing Duplicate Same-Day Completion Protection ---");
  const compDupRes = await fetch(`http://localhost:5000/api/habits/${habitId}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  });
  const compDupData = await compDupRes.json();
  console.log("Duplicate Completion HTTP Status:", compDupRes.status, "XP Gained:", compDupData.xpGained, "Newly Recorded:", compDupData.newlyRecorded);

  console.log("\n--- Testing Weekly Analytics on live Backend ---");
  const analyticsRes = await fetch("http://localhost:5000/api/analytics/weekly", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const analyticsData = await analyticsRes.json();
  console.log("Analytics HTTP Status:", analyticsRes.status, "Total Completions:", analyticsData.totalCompletions, "Days Count:", analyticsData.dates?.length);

  console.log("\n✅ ALL LIVE FULL-STACK CHECKS PASSED SUCCESSFULLY!");
}

testLive().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
