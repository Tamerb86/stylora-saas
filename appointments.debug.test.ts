import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Appointments Debug Test", () => {
  it("should retrieve appointments for tenant", async () => {
    const tenantId = "goeasychargeco@gmail.com";
    const startDate = new Date("2025-11-01");
    const endDate = new Date("2025-12-31");

    console.log("=== DEBUG: Testing getAppointmentsByTenant ===");
    console.log("TenantId:", tenantId);
    console.log("Start date:", startDate);
    console.log("End date:", endDate);

    const appointments = await db.getAppointmentsByTenant(tenantId, startDate, endDate);

    console.log("=== RESULTS ===");
    console.log("Total appointments:", appointments.length);
    console.log("Appointments:", JSON.stringify(appointments, null, 2));

    // This test is for debugging, so we just log the results
    expect(appointments).toBeDefined();
  });
});
