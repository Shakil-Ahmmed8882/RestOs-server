import { Request, Response } from "express";
import { paymentService } from "./payment.service";

// Resolve a callback redirect target. Prefer the dedicated env var; fall back
// to CLIENT_URL + path, then to localhost for dev.
function buildRedirect(envKey: string, fallbackPath: string): string {
  const direct = process.env[envKey];
  if (direct) return direct;
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  return `${base}${fallbackPath}`;
}

// Append transactionId to a URL, honoring whether it already has a query string.
function withTxn(url: string, tranId: unknown): string {
  if (!tranId) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}transactionId=${encodeURIComponent(String(tranId))}`;
}

export const paymentControllers = {
  // Initiate payment
  async handleInitiatePayment(req: Request, res: Response) {
    try {
      const { orderId, orderIds } = req.body;
      const userId = (req.user as any)?.userId || (req.user as any)?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await paymentService.initiatePayment(
        { orderId, orderIds },
        userId
      );

      res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Demo mock payment — instant success, no gateway
  async handleMockPay(req: Request, res: Response) {
    try {
      const { orderId, orderIds } = req.body;
      const userId = (req.user as any)?.userId || (req.user as any)?._id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await paymentService.mockPay(
        { orderId, orderIds },
        userId
      );

      res.status(200).json({
        success: true,
        message: "Mock payment completed",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Payment success callback from SSL Commerz (POST in production, GET for manual tests)
  async handlePaymentSuccess(req: Request, res: Response) {
    const successUrl = buildRedirect(
      "CLIENT_SUCCESS_URL",
      "/payments/success"
    );
    const failUrl = buildRedirect(
      "CLIENT_FAILED_URL",
      "/payments/error?variant=failed"
    );
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id, val_id, status } = src;

      if (status === "VALID" || status === "VALIDATED") {
        await paymentService.verifyPayment(
          tran_id as string,
          val_id as string
        );
        res.redirect(withTxn(successUrl, tran_id));
      } else {
        res.redirect(withTxn(failUrl, tran_id));
      }
    } catch (error: any) {
      res.redirect(failUrl);
    }
  },

  // Payment failure callback from SSL Commerz
  async handlePaymentFail(req: Request, res: Response) {
    const failUrl = buildRedirect(
      "CLIENT_FAILED_URL",
      "/payments/error?variant=failed"
    );
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id } = src;

      await paymentService.handlePaymentFailure(tran_id as string);
      res.redirect(withTxn(failUrl, tran_id));
    } catch (error: any) {
      res.redirect(failUrl);
    }
  },

  // Payment cancellation callback from SSL Commerz
  async handlePaymentCancel(req: Request, res: Response) {
    const cancelUrl = buildRedirect(
      "CLIENT_CANCELLED_URL",
      "/payments/error?variant=cancelled"
    );
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id } = src;

      await paymentService.handlePaymentCancellation(tran_id as string);
      res.redirect(withTxn(cancelUrl, tran_id));
    } catch (error: any) {
      res.redirect(cancelUrl);
    }
  },

  // IPN (Instant Payment Notification) handler
  async handleIPN(req: Request, res: Response) {
    try {
      const { tran_id, val_id, status } = req.body;

      if (status === "VALID" || status === "VALIDATED") {
        const result = await paymentService.verifyPayment(tran_id, val_id);
        res.status(200).json(result);
      } else {
        res.status(400).json({
          success: false,
          message: "Payment validation failed",
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get payment history
  async handleGetPaymentHistory(req: Request, res: Response) {
    try {
      const userId = (req.user as any)?.userId || (req.user as any)?._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await paymentService.getPaymentHistory(userId, page, limit);

      res.status(200).json({
        message: "Payment history retrieved successfully",
        ...result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  // Get payment details
  async handleGetPaymentDetails(req: Request, res: Response) {
    try {
      const { paymentId } = req.params;

      const result = await paymentService.getPaymentDetails(paymentId);

      res.status(200).json({
        message: "Payment details retrieved successfully",
        ...result,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },
};
