
    // Create a test tenant
    testTenantId = nanoid();
    await db.insert(tenants).values({
      id: testTenantId,
      name: "Test Salon",
      subdomain: `test-${Date.now()}`,
      phone: "12345678",
      email: "test@example.com",
      status: "trial",
      timezone: "Europe/Oslo",
      currency: "NOK",
      vatRate: "25.00",
      emailVerified: false, // Not verified
    });

    // Create a test user
    testUserOpenId = `test-user-${nanoid()}`;
    await db.insert(users).values({
      tenantId: testTenantId,