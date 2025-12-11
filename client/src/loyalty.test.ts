import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestEnvironment, createTestCustomer, createTestService, createTestAppointment, cleanupTestData } from "./test-helpers";
import { appRouter } from "./routers";

describe("Loyalty System", () => {
  let testTenantId: string;
  let testUserId: number;
  let mockContext: any;
  let caller: any;

  beforeEach(async () => {
    const env = await createTestEnvironment();
    testTenantId = env.tenantId;
    testUserId = env.userId;
    mockContext = env.mockContext;
    caller = appRouter.createCaller(mockContext);
  });

  afterEach(async () => {
    if (testTenantId) {
      await cleanupTestData(testTenantId);
    }
  });

  it("should create and retrieve loyalty settings", async () => {
    // Update settings
    await caller.loyalty.updateSettings({
      enabled: true,
      pointsPerVisit: 10,
      pointsPerNOK: 0.1,
    });

    // Get settings
    const settings = await caller.loyalty.getSettings();
    expect(settings.enabled).toBe(true);
    expect(settings.pointsPerVisit).toBe(10);
    expect(settings.pointsPerNOK).toBe(0.1);
  });

  it("should create a loyalty reward", async () => {
    const result = await caller.loyalty.createReward({
      name: "10% rabatt",
      description: "Få 10% rabatt på neste besøk",
      pointsCost: 100,
      discountType: "percentage",
      discountValue: "10",
      validityDays: 30,
    });

    expect(result.success).toBe(true);

    // Verify reward was created by listing rewards
    const rewards = await caller.loyalty.listRewards();
    expect(rewards.length).toBeGreaterThan(0);
  });

  it("should award and retrieve loyalty points", async () => {
    // Create a customer using helper
    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Loyalty",
      lastName: "Test",
      phone: "+4798765432",
      email: "loyalty@test.com",
    });

    // Award points
    await caller.loyalty.awardPoints({
      customerId,
      points: 50,
      reason: "Test points award",
    });

    // Get points
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId,
    });

    expect(loyaltyPoints.currentPoints).toBe(50);
    expect(loyaltyPoints.lifetimePoints).toBe(50);
  });

  it("should redeem loyalty points for reward", async () => {
    // Create customer
    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Redeem",
      lastName: "Test",
      phone: "+4798765433",
      email: "redeem@test.com",
    });

    // Award points
    await caller.loyalty.awardPoints({
      customerId,
      points: 200,
      reason: "Initial points",
    });

    // Create reward
    await caller.loyalty.createReward({
      name: "Free haircut",
      description: "Get a free haircut",
      pointsCost: 150,
      discountType: "fixed_amount",
      discountValue: "500",
      validityDays: 30,
    });

    // Get the reward ID from list
    const rewards = await caller.loyalty.listRewards();
    const reward = rewards.find(r => r.name === "Free haircut");
    if (!reward) throw new Error("Reward not found");

    // Redeem reward
    await caller.loyalty.redeemReward({
      customerId,
      rewardId: reward.id,
    });

    // Check remaining points
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId,
    });

    expect(loyaltyPoints.currentPoints).toBe(50); // 200 - 150
    expect(loyaltyPoints.lifetimePoints).toBe(200); // Lifetime doesn't decrease
  });

  it("should auto-award points when appointment is completed", async () => {
    // Enable loyalty
    await caller.loyalty.updateSettings({
      enabled: true,
      pointsPerVisit: 10,
      pointsPerNOK: 0.1,
    });

    // Create customer using helper
    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Auto",
      lastName: "Points",
      phone: "+4798765434",
      email: "auto@test.com",
    });

    // Create service using helper
    const { serviceId } = await createTestService(testTenantId, {
      name: "Haircut",
      description: "Standard haircut",
      price: "500.00",
      durationMinutes: 60,
    });

    // Create appointment using helper
    const { appointmentId } = await createTestAppointment(testTenantId, {
      customerId,
      employeeId: testUserId,
      serviceId,
      status: "pending",
    });

    // Complete appointment
    await caller.appointments.updateStatus({
      id: appointmentId,
      status: "completed",
    });

    // Check points were awarded
    const loyaltyPoints = await caller.loyalty.getPoints({
      customerId,
    });

    // Should have 10 points for visit + 50 points for 500 NOK (500 * 0.1)
    expect(loyaltyPoints.currentPoints).toBe(60);
  });
});
