import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestEnvironment, createTestCustomer, createTestService, createTestProduct, cleanupTestData } from "./test-helpers";
import { appRouter } from "./routers";

/**
 * Test suite for POS (Point of Sale) backend functionality
 * 
 * Tests order creation and payment recording for in-salon sales
 */

describe("POS Backend", () => {
  let testTenantId: string;
  let testUserId: number;
  let testServiceId: number;
  let testProductId: number;
  let testCustomerId: number;
  let mockContext: any;
  let caller: any;

  beforeEach(async () => {
    // Create test environment
    const env = await createTestEnvironment();
    testTenantId = env.tenantId;
    testUserId = env.userId;
    mockContext = env.mockContext;
    caller = appRouter.createCaller(mockContext);

    // Create test data
    const { serviceId } = await createTestService(testTenantId, {
      name: "Test Haircut",
      price: "400.00",
      durationMinutes: 30,
    });
    testServiceId = serviceId;

    const { productId } = await createTestProduct(testTenantId, {
      name: "Test Hair Gel",
      sku: `TEST-GEL-${Date.now()}`,
      retailPrice: "150.00",
      costPrice: "100.00",
      stockQuantity: 100,
    });
    testProductId = productId;

    const { customerId } = await createTestCustomer(testTenantId, {
      firstName: "Test",
      lastName: "Customer",
      phone: "+4712345678",
    });
    testCustomerId = customerId;
  });

  afterEach(async () => {
    if (testTenantId) {
      await cleanupTestData(testTenantId);
    }
  });

  describe("pos.createOrder", () => {
    it("should create order with service items", async () => {
      const result = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-01",
        orderTime: "10:30",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Verify response structure
      expect(result.order).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.items.length).toBe(1);

      // Verify order details
      expect(result.order.tenantId).toBe(testTenantId);
      expect(result.order.employeeId).toBe(testUserId);
      expect(result.order.customerId).toBe(testCustomerId);
      expect(result.order.status).toBe("pending");
      expect(result.order.subtotal).toBe("400.00");
      expect(result.order.vatAmount).toBe("100.00"); // 25% of 400
      expect(result.order.total).toBe("500.00"); // 400 + 100

      // Verify order item
      expect(result.items[0].itemType).toBe("service");
      expect(result.items[0].itemId).toBe(testServiceId);
      expect(result.items[0].quantity).toBe(1);
      expect(result.items[0].unitPrice).toBe("400.00");
      expect(result.items[0].total).toBe("400.00");
    });

    it("should create order with multiple items (service + product)", async () => {
      const result = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-02",
        orderTime: "14:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
          {
            itemType: "product",
            itemId: testProductId,
            quantity: 2,
            unitPrice: 150,
            vatRate: 25,
          },
        ],
      });

      expect(result.items.length).toBe(2);
      
      // Verify totals: (400 + 150*2) = 700, VAT = 175, Total = 875
      expect(result.order.subtotal).toBe("700.00");
      expect(result.order.vatAmount).toBe("175.00");
      expect(result.order.total).toBe("875.00");
    });

    it("should create walk-in order without customer", async () => {
      const result = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: null,
        orderDate: "2025-12-03",
        orderTime: "16:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      expect(result.order).toBeDefined();
      expect(result.order.customerId).toBeNull();
      expect(result.order.total).toBe("500.00");
    });
  });

  describe("pos.recordPayment", () => {
    it("should record cash payment for order", async () => {
      // First create an order
      const orderResult = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-04",
        orderTime: "10:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Record payment
      const paymentResult = await caller.pos.recordPayment({
        orderId: orderResult.order.id,
        paymentMethod: "cash",
        amount: 500,
        processedBy: testUserId,
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.payment).toBeDefined();
      expect(paymentResult.payment.paymentMethod).toBe("cash");
      expect(paymentResult.payment.amount).toBe("500.00");
      expect(paymentResult.payment.status).toBe("completed");
    });

    it("should record card payment for order", async () => {
      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-05",
        orderTime: "11:00",
        items: [
          {
            itemType: "product",
            itemId: testProductId,
            quantity: 1,
            unitPrice: 150,
            vatRate: 25,
          },
        ],
      });

      // Record card payment
      const paymentResult = await caller.pos.recordPayment({
        orderId: orderResult.order.id,
        paymentMethod: "card",
        amount: 187.5, // 150 + 25% VAT
        processedBy: testUserId,
        cardLast4: "1234",
        cardBrand: "Visa",
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.payment.paymentMethod).toBe("card");
      expect(paymentResult.payment.cardLast4).toBe("1234");
      expect(paymentResult.payment.cardBrand).toBe("Visa");
    });

    it("should record split payment (cash + card)", async () => {
      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-06",
        orderTime: "12:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Record split payment
      const paymentResult = await caller.pos.recordPayment({
        orderId: orderResult.order.id,
        paymentMethod: "split",
        amount: 500,
        processedBy: testUserId,
        splitPayments: [
          { method: "cash", amount: 300 },
          { method: "card", amount: 200, cardLast4: "5678", cardBrand: "Mastercard" },
        ],
      });

      expect(paymentResult.success).toBe(true);
      expect(paymentResult.payment.paymentMethod).toBe("split");
    });
  });

  describe("pos.listOrders", () => {
    it("should list orders for tenant", async () => {
      // Create a few orders
      await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-07",
        orderTime: "10:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-07",
        orderTime: "14:00",
        items: [
          {
            itemType: "product",
            itemId: testProductId,
            quantity: 1,
            unitPrice: 150,
            vatRate: 25,
          },
        ],
      });

      // List orders
      const orders = await caller.pos.listOrders({
        startDate: "2025-12-01",
        endDate: "2025-12-31",
      });

      expect(orders).toBeDefined();
      expect(orders.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter orders by employee", async () => {
      // Create order
      await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-08",
        orderTime: "10:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // List orders for specific employee
      const orders = await caller.pos.listOrders({
        startDate: "2025-12-01",
        endDate: "2025-12-31",
        employeeId: testUserId,
      });

      expect(orders).toBeDefined();
      expect(orders.every(o => o.employeeId === testUserId)).toBe(true);
    });
  });

  describe("pos.getOrderById", () => {
    it("should retrieve order with items and payments", async () => {
      // Create order
      const orderResult = await caller.pos.createOrder({
        employeeId: testUserId,
        customerId: testCustomerId,
        orderDate: "2025-12-09",
        orderTime: "10:00",
        items: [
          {
            itemType: "service",
            itemId: testServiceId,
            quantity: 1,
            unitPrice: 400,
            vatRate: 25,
          },
        ],
      });

      // Record payment
      await caller.pos.recordPayment({
        orderId: orderResult.order.id,
        paymentMethod: "cash",
        amount: 500,
        processedBy: testUserId,
      });

      // Get order details
      const order = await caller.pos.getOrderById({
        orderId: orderResult.order.id,
      });

      expect(order).toBeDefined();
      expect(order.id).toBe(orderResult.order.id);
      expect(order.items).toBeDefined();
      expect(order.items.length).toBe(1);
      expect(order.payments).toBeDefined();
      expect(order.payments.length).toBe(1);
    });
  });
});
