import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestEnvironment, createTestCustomer, createTestService, createTestAppointment, cleanupTestData } from "./test-helpers";
import { appRouter } from "./routers";
import * as db from "./db";
import { eq } from "drizzle-orm";

describe("Analytics API", () => {
  let testTenantId: string;
  let testUserId: number;
  let mockContext: any;

  beforeEach(async () => {
    const env = await createTestEnvironment();
    testTenantId = env.tenantId;
    testUserId = env.userId;
    mockContext = env.mockContext;
  });

  afterEach(async () => {
    if (testTenantId) {
      await cleanupTestData(testTenantId);
    }
  });

  describe("customerGrowth", () => {
    it("should return customer growth data for date range", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { customers } = await import("../drizzle/schema");

      // Create test customers with specific dates
      await dbInstance.insert(customers).values([
        {
          tenantId: testTenantId,
          firstName: "Test",
          lastName: "Customer 1",
          phone: "12345678",
          email: "customer1@test.com",
          createdAt: new Date("2024-01-15"),
        },
        {
          tenantId: testTenantId,
          firstName: "Test",
          lastName: "Customer 2",
          phone: "87654321",
          email: "customer2@test.com",
          createdAt: new Date("2024-01-15"),
        },
        {
          tenantId: testTenantId,
          firstName: "Test",
          lastName: "Customer 3",
          phone: "11223344",
          email: "customer3@test.com",
          createdAt: new Date("2024-01-20"),
        },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.customerGrowth({
        startDate: "2024-01-01",
        endDate: "2024-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("count");
    });

    it("should return empty array when no customers in date range", async () => {
      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.customerGrowth({
        startDate: "2025-01-01",
        endDate: "2025-01-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });
  });

  describe("employeePerformance", () => {
    it("should return employee performance metrics", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointmentServices } = await import("../drizzle/schema");

      // Create test data using helpers
      const { customerId } = await createTestCustomer(testTenantId);
      const { serviceId, service } = await createTestService(testTenantId, { price: "300.00" });
      const { appointmentId } = await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "completed",
      });

      // Link service to appointment
      await dbInstance.insert(appointmentServices).values({
        appointmentId,
        serviceId,
        price: service.price,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.employeePerformance({
        startDate: "2024-01-01",
        endDate: "2025-12-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("employeeId");
      expect(result[0]).toHaveProperty("employeeName");
      expect(result[0]).toHaveProperty("appointmentCount");
      expect(result[0]).toHaveProperty("totalRevenue");
    });
  });

  describe("topServices", () => {
    it("should return most booked services", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointmentServices } = await import("../drizzle/schema");

      // Create test data
      const { customerId } = await createTestCustomer(testTenantId);
      const { serviceId, service } = await createTestService(testTenantId, { 
        name: "Haircut",
        price: "300.00" 
      });

      // Create two appointments with same service
      const { appointmentId: appt1 } = await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "completed",
      });

      const { appointmentId: appt2 } = await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "completed",
      });

      // Link services to appointments
      await dbInstance.insert(appointmentServices).values([
        {
          appointmentId: appt1,
          serviceId,
          price: service.price,
        },
        {
          appointmentId: appt2,
          serviceId,
          price: service.price,
        },
      ]);

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.topServices({
        startDate: "2024-01-01",
        endDate: "2025-12-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("serviceId");
      expect(result[0]).toHaveProperty("serviceName");
      expect(result[0]).toHaveProperty("bookingCount");
      expect(result[0]).toHaveProperty("totalRevenue");
    });
  });

  describe("revenueTrends", () => {
    it("should return daily revenue trends", async () => {
      const dbInstance = await db.getDb();
      if (!dbInstance) throw new Error("Database not available");

      const { appointmentServices } = await import("../drizzle/schema");

      // Create test data
      const { customerId } = await createTestCustomer(testTenantId);
      const { serviceId, service } = await createTestService(testTenantId, { price: "300.00" });
      const { appointmentId } = await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "completed",
      });

      // Link service to appointment
      await dbInstance.insert(appointmentServices).values({
        appointmentId,
        serviceId,
        price: service.price,
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.revenueTrends({
        startDate: "2024-01-01",
        endDate: "2025-12-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("date");
      expect(result[0]).toHaveProperty("revenue");
    });
  });

  describe("appointmentStatusDistribution", () => {
    it("should return appointment status distribution", async () => {
      // Create appointments with different statuses
      const { customerId } = await createTestCustomer(testTenantId);
      const { serviceId } = await createTestService(testTenantId);

      await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "completed",
      });

      await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "pending",
      });

      await createTestAppointment(testTenantId, {
        customerId,
        employeeId: testUserId,
        serviceId,
        status: "canceled",
      });

      const caller = appRouter.createCaller(mockContext);
      const result = await caller.analytics.appointmentStatusDistribution({
        startDate: "2024-01-01",
        endDate: "2025-12-31",
      });

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("status");
      expect(result[0]).toHaveProperty("count");
    });
  });
});
