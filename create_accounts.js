const API = 'http://localhost:8081/api/v1';

async function createAccounts() {
  try {
    const trainer = {
      name: "Test Trainer",
      email: "trainer@xebia.com",
      role: "teacher",
      department: "Computer Science",
      avatar: "https://i.pravatar.cc/150?u=trainer"
    };

    console.log("Creating Trainer...");
    await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trainer)
    });

    const student = {
      name: "Test Student",
      email: "student@xebia.com",
      role: "student",
      department: "Computer Science",
      avatar: "https://i.pravatar.cc/150?u=student"
    };

    console.log("Creating Student...");
    await fetch(`${API}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });

    console.log("✅ Test accounts created successfully! You can now login with:");
    console.log("Trainer: trainer@xebia.com");
    console.log("Student: student@xebia.com");

  } catch (error) {
    console.error("❌ Failed to connect to the backend. Ensure the backend servers are running first!");
  }
}

createAccounts();
