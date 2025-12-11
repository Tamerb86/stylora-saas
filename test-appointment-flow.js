// Test to verify appointment data transformation
const appointments = [
  {
    id: 1,
    appointmentDate: "2025-12-01",
    startTime: "14:00:00",
    endTime: "15:00:00",
    customerId: 1,
    employeeId: 1,
    status: "confirmed"
  },
  {
    id: 2,
    appointmentDate: "2025-12-02",
    startTime: "14:00:00",
    endTime: "15:00:00",
    customerId: 1,
    employeeId: 1,
    status: "confirmed"
  },
  {
    id: 3,
    appointmentDate: "2025-12-03",
    startTime: "14:00:00",
    endTime: "15:00:00",
    customerId: 1,
    employeeId: 1,
    status: "confirmed"
  }
];

console.log("Total appointments:", appointments.length);
console.log("\nTesting date matching for Dec 1, 2025:");

const testDate = new Date("2025-12-01");
const dateStr = testDate.toISOString().split("T")[0];
console.log("Test date string:", dateStr);

appointments.forEach(apt => {
  const aptDate = new Date(apt.appointmentDate);
  const aptDateStr = `${aptDate.getUTCFullYear()}-${String(aptDate.getUTCMonth() + 1).padStart(2, '0')}-${String(aptDate.getUTCDate()).padStart(2, '0')}`;
  const aptTime = apt.startTime.substring(0, 5);
  
  const dateMatch = aptDateStr === dateStr;
  const timeMatch = aptTime === "14:00";
  
  console.log(`\nAppointment ${apt.id}:`);
  console.log(`  appointmentDate: ${apt.appointmentDate}`);
  console.log(`  aptDateStr: ${aptDateStr}`);
  console.log(`  aptTime: ${aptTime}`);
  console.log(`  Date match: ${dateMatch}`);
  console.log(`  Time match: ${timeMatch}`);
  console.log(`  Should show: ${dateMatch && timeMatch}`);
});
