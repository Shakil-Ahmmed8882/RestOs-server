import axios from "axios";
import PaymentModel from "./payment.model";
import OrdersModel from "../order/order.model";
import { TPayment, TSSLCommerzPayload } from "./payment.interface";
import { v4 as uuidv4 } from "uuid";

const SSLCOMMERZ_API = process.env.IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/gwprocess/v4/api.php"
  : "https://sandbox.sslcommerz.com/gwprocess/v4/api.php";

const SSLCOMMERZ_VERIFY_API = process.env.IS_LIVE === "true"
  ? "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php"
  : "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php";

export const paymentService = {
  // Initiate payment with SSL Commerz
  async initiatePayment(orderId: string, userId: string) {
    try {
      // Get order details
      const order = await OrdersModel.findById(orderId).populate("user food");
      if (!order) {
        throw new Error("Order not found");
      }

      // Generate unique transaction ID
      const transactionId = `TXN-${orderId}-${uuidv4()}`;

      // Create payment record
      const payment = new PaymentModel({
        orderId,
        userId,
        amount: order.totalPrice,
        currency: "BDT",
        transactionId,
        status: "pending",
      });

      await payment.save();

      // Prepare SSL Commerz payload
      const payload: TSSLCommerzPayload = {
        store_id: process.env.STORE_ID || "",
        store_passwd: process.env.STORE_PASSWD || "",
        total_amount: order.totalPrice,
        currency: "BDT",
        tran_id: transactionId,
        success_url: `${process.env.SERVER_URL}/api/v1/payments/success`,
        fail_url: `${process.env.SERVER_URL}/api/v1/payments/fail`,
        cancel_url: `${process.env.SERVER_URL}/api/v1/payments/cancel`,
        ipn_url: `${process.env.SERVER_URL}/api/v1/payments/ipn`,
        cus_name: (order.user as any).name || "Customer",
        cus_email: (order.user as any).email || "",
        cus_phone: (order.user as any).phone || "",
        product_name: (order.food as any).name || "Food Item",
        product_category: "food",
        product_profile: "general",
      };

      // Call SSL Commerz API
      const response = await axios.post(SSLCOMMERZ_API, payload);

      if (response.data.status !== "SUCCESS") {
        throw new Error(response.data.failedreason || "Payment initiation failed");
      }

      return {
        success: true,
        paymentUrl: response.data.GatewayPageURL,
        transactionId,
        sessionkey: response.data.sessionkey,
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
      const payload = {
        val_id: validationId,
        store_id: process.env.STORE_ID,
        store_passwd: process.env.STORE_PASSWD,
        format: "json",
      };

      const response = await axios.post(SSLCOMMERZ_VERIFY_API, payload);

      if (response.data.status !== "VALID") {
        return {
          success: false,
          message: "Payment validation failed",
        };
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

      // Update order status
      await OrdersModel.findByIdAndUpdate(
        payment.orderId,
        { status: "confirmed" }
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

  // Get payment history for user
  async getPaymentHistory(userId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const payments = await PaymentModel.find({ userId })
        .populate("orderId")
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
