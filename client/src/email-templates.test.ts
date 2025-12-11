    if (!db) throw new Error("Database not available");
    
    const timestamp = Date.now();
    tenantId = randomUUID();
    
    await db.insert(tenants).values({
      id: tenantId,
      name: "Test Salon for Email Templates",
      subdomain: `test-email-${timestamp}`,
      ownerName: "Test Owner",
      ownerEmail: "owner@test.com",
      ownerPhone: "+4712345678",
      address: "Test Address",
      city: "Oslo",
      postalCode: "0001",
      country: "Norway",
      emailVerified: true,
    });

    // Create a test email template