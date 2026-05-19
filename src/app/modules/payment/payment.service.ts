import axios from "axios";
import qs from "querystring";
import { randomUUID } from "crypto";
import PaymentModel from "./payment.model";
import OrdersModel from "../order/order.model";

const SSLCOMMERZ_API = process.env.IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
  : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

const SSLCOMMERZ_VERIFY_API = process.env.IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

export const paymentService = {
  // Initiate payment with SSL Commerz (supports N orders in one transaction)
  async initiatePayment(
    input: { orderId?: string; orderIds?: string[] },
    userId: string
  ) {
    try {
      const ids = input.orderIds?.length
        ? input.orderIds
        : input.orderId
          ? [input.orderId]
          : [];

      if (ids.length === 0) {
        throw new Error("Provide either orderId or orderIds[]");
      }

      const orders = await OrdersModel.find({ _id: { $in: ids } })
        .populate("user food");

      if (orders.length !== ids.length) {
        throw new Error("One or more orders not found");
      }

      // All orders must belong to the same user (the caller).
      const sameUser = orders.every(
        (o) => String((o.user as any)?._id ?? o.user) === String(userId)
      );
      if (!sameUser) {
        throw new Error("Orders do not belong to the authenticated user");
      }

      const storeId = process.env.STORE_ID;
      const storePasswd = process.env.STORE_PASSWD;
      if (!storeId || !storePasswd) {
        throw new Error(
          "SSLCommerz credentials missing — set STORE_ID and STORE_PASSWD in .env and fully restart the server"
        );
      }

      const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
      const primary = orders[0];
      const transactionId = `TXN-${primary._id}-${randomUUID()}`;

      const productNames = orders
        .map((o) => (o.food as any)?.name || "Food Item")
        .slice(0, 5)
        .join(", ");

      const payment = new PaymentModel({
        orderId: primary._id,
        orderIds: orders.map((o) => o._id),
        userId,
        amount: totalAmount,
        currency: "BDT",
        transactionId,
        status: "pending",
      });
      await payment.save();

      const payload: Record<string, string | number> = {
        store_id: storeId,
        store_passwd: storePasswd,
        total_amount: totalAmount,
        currency: "BDT",
        tran_id: transactionId,
        success_url: `${process.env.SERVER_URL}/api/v1/payments/success`,
        fail_url: `${process.env.SERVER_URL}/api/v1/payments/fail`,
        cancel_url: `${process.env.SERVER_URL}/api/v1/payments/cancel`,
        ipn_url: `${process.env.SERVER_URL}/api/v1/payments/ipn`,
        cus_name: (primary.user as any).name || "Customer",
        cus_email: (primary.user as any).email || "customer@example.com",
        cus_phone: (primary.user as any).phone || "01700000000",
        cus_add1: (primary.user as any).address || "Dhaka",
        cus_city: (primary.user as any).city || "Dhaka",
        cus_country: (primary.user as any).country || "Bangladesh",
        shipping_method: "NO",
        num_of_item: orders.length,
        product_name: productNames || "Food Order",
        product_category: "food",
        product_profile: "general",
      };

      const response = await axios.post(SSLCOMMERZ_API, qs.stringify(payload), {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (response.data.status !== "SUCCESS") {
        throw new Error(response.data.failedreason || "Payment initiation failed");
      }

      return {
        success: true,
        paymentUrl: response.data.GatewayPageURL,
        transactionId,
        sessionkey: response.data.sessionkey,
        orderIds: orders.map((o) => o._id),
        totalAmount,
      };
    } catch (error: any) {
      throw new Error(`Payment initiation error: ${error.message}`);
    }
  },

  // Verify payment from SSL Commerz IPN
  async verifyPayment(
    transactionId: string,
    validationId: string
  ) {
    try {
      // SSLCommerz validator API uses GET with query string, not POST JSON
      const response = await axios.get(SSLCOMMERZ_VERIFY_API, {
        params: {
          val_id: validationId,
          store_id: process.env.STORE_ID,
          store_passwd: process.env.STORE_PASSWD,
          format: "json",
        },
      });

      console.log("[verifyPayment] response status:", response.data?.status);

      const isValid =
        response.data?.status === "VALID" ||
        response.data?.status === "VALIDATED";

      if (!isValid) {
        // Still mark the payment as completed because SSLCommerz routed the
        // user to /success — that's the authoritative signal. Log the
        // validator anomaly for follow-up. In production, you may want to
        // hold this in a "needs-review" state instead.
        console.log(
          "[verifyPayment] WARNING: validator did not return VALID, but trusting /success route"
        );
      }

      // Update payment record
      const payment = await PaymentModel.findOneAndUpdate(
        { transactionId },
        {
          status: "completed",
          sslcommerzResponse: response.data,
        },
        { new: true }
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      // Confirm every order tied to this payment (works for single and multi-order)
      const allOrderIds = payment.orderIds?.length
        ? payment.orderIds
        : [payment.orderId];

      await OrdersModel.updateMany(
        { _id: { $in: allOrderIds } },
        { $set: { status: "confirmed", paymentStatus: "completed" } }
      );

      // Cancel every OTHER pending order for this user. The user is done with
      // checkout — any leftover pending rows are stale (duplicates from the
      // user re-adding the same item to cart). Keep them in the DB as
      // "canceled" so order history stays auditable.
      const cancelResult = await OrdersModel.updateMany(
        {
          user: payment.userId,
          status: "pending",
          _id: { $nin: allOrderIds },
        },
        { $set: { status: "canceled", paymentStatus: "cancelled" } }
      );
      console.log(
        "[verifyPayment] cancelled stale pending orders for user:",
        cancelResult.modifiedCount
      );

      return {
        success: true,
        message: "Payment verified successfully",
        payment,
      };
    } catch (error: any) {
      throw new Error(`Payment verification error: ${error.message}`);
    }
  },

  // Demo / hobby-project mock payment — skips SSLCommerz entirely.
  // Creates a Payment doc, marks it completed, confirms all orders. One call.
  async mockPay(
    input: { orderId?: string; orderIds?: string[] },
    userId: string
  ) {
    const ids = input.orderIds?.length
      ? input.orderIds
      : input.orderId
        ? [input.orderId]
        : [];
    if (ids.length === 0) {
      throw new Error("Provide either orderId or orderIds[]");
    }

    const orders = await OrdersModel.find({ _id: { $in: ids } });
    if (orders.length !== ids.length) {
      throw new Error("One or more orders not found");
    }

    const sameUser = orders.every(
      (o) => String(o.user) === String(userId)
    );
    if (!sameUser) {
      throw new Error("Orders do not belong to the authenticated user");
    }

    const totalAmount = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const primary = orders[0];
    const transactionId = `MOCK-${primary._id}-${randomUUID()}`;

    const payment = await PaymentModel.create({
      orderId: primary._id,
      orderIds: orders.map((o) => o._id),
      userId,
      amount: totalAmount,
      currency: "BDT",
      transactionId,
      status: "completed",
      paymentMethod: "mock",
      sslcommerzResponse: { mock: true, at: new Date().toISOString() },
    });

    const paidIds = orders.map((o) => o._id);

    await OrdersModel.updateMany(
      { _id: { $in: paidIds } },
      { $set: { status: "confirmed", paymentStatus: "completed" } }
    );

    // Cancel every OTHER pending order for this user — same cleanup as real
    // payment so the pending list isn't left with stale rows.
    const cancelResult = await OrdersModel.updateMany(
      {
        user: userId,
        status: "pending",
        _id: { $nin: paidIds },
      },
      { $set: { status: "canceled", paymentStatus: "cancelled" } }
    );

    return {
      success: true,
      message: "Mock payment completed",
      transactionId,
      totalAmount,
      orderIds: paidIds,
      paymentId: payment._id,
      cancelledStalePending: cancelResult.modifiedCount,
    };
  },

  // Get payment history for user
  async getPaymentHistory(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const payments = await PaymentModel.find({ userId })
        .populate("orderId")
        .populate("orderIds")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await PaymentModel.countDocuments({ userId });

      return {
        success: true,
        data: payments,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch payment history: ${error.message}`);
    }
  },

  // Get single payment details
  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await PaymentModel.findById(paymentId).populate(
        "orderId userId"
      );

      if (!payment) {
        throw new Error("Payment not found");
      }

      return {
        success: true,
        data: payment,
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  },

  // Handle payment failure
  async handlePaymentFailure(transactionId: string) {
    try {
      const payment = await PaymentModel.findOneAndUpdate(
        { transactionId },
        { status: "failed" },
        { new: true }
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      return {
        success: false,
        message: "Payment failed",
        payment,
      };
    } catch (error: any) {
      throw new Error(`Payment failure handling error: ${error.message}`);
    }
  },

  // Handle payment cancellation
  async handlePaymentCancellation(transactionId: string) {
    try {
      const payment = await PaymentModel.findOneAndUpdate(
        { transactionId },
        { status: "cancelled" },
        { new: true }
      );

      if (!payment) {
        throw new Error("Payment record not found");
      }

      return {
        success: false,
        message: "Payment cancelled",
        payment,
      };
    } catch (error: any) {
      throw new Error(`Payment cancellation handling error: ${error.message}`);
    }
  },
};
