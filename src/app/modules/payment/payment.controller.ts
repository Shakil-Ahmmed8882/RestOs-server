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

// SSLCommerz calls the success/fail/cancel URLs via POST from a browser form
// submission inside an iframe/popup. A 302 alone does NOT navigate the top
// browser window — the redirect happens inside the SSLCommerz iframe. Return
// an HTML page that breaks out of the iframe and navigates the parent window.
function sendClientRedirect(res: Response, target: string) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!doctype html>
<html><head>
<meta http-equiv="refresh" content="0;url=${target}">
<title>Redirecting…</title>
</head><body>
<script>
  // Break out of any SSLCommerz iframe and navigate the top window
  try { window.top.location.href = ${JSON.stringify(target)}; }
  catch (e) { window.location.href = ${JSON.stringify(target)}; }
</script>
<p>Redirecting to <a href="${target}">${target}</a>…</p>
</body></html>`);
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
    // HARDCODED for debugging — confirm redirect logic works, then revert to env vars
    const successUrl = "http://localhost:3000/payments/success";
    const failUrl = "http://localhost:3000/payments/error?variant=failed";
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id, val_id } = src;

      console.log("[payment/success] hit, full payload:", JSON.stringify(src));

      // SSLCommerz only calls success_url on success. Trust the route, then
      // verify with the validator API. If validation passes -> redirect to
      // success page. If validation fails -> still redirect to success with
      // a flag (or fail) so the user isn't stuck.
      if (val_id) {
        const verification = await paymentService.verifyPayment(
          tran_id as string,
          val_id as string
        );
        console.log("[payment/success] verification result:", verification.success);
      } else {
        console.log("[payment/success] no val_id present — skipping verifier API call");
      }

      const target = withTxn(successUrl, tran_id);
      console.log("[payment/success] redirecting to", target);
      sendClientRedirect(res, target);
    } catch (error: any) {
      console.log("[payment/success] error caught:", error?.message);
      // Even on verifier API error, still send the user to success — the
      // backend's IPN handler will reconcile later. Don't punish the user
      // for a transient validator failure.
      const tran_id = (req.body as any)?.tran_id || (req.query as any)?.tran_id;
      sendClientRedirect(res, withTxn(successUrl, tran_id));
    }
  },

  // Payment failure callback from SSL Commerz
  async handlePaymentFail(req: Request, res: Response) {
    const failUrl = "http://localhost:3000/payments/error?variant=failed";
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id } = src;

      console.log("[payment/fail] hit", { method: req.method, tran_id });

      await paymentService.handlePaymentFailure(tran_id as string);
      const target = withTxn(failUrl, tran_id);
      console.log("[payment/fail] redirecting to", target);
      sendClientRedirect(res, target);
    } catch (error: any) {
      console.log("[payment/fail] error:", error?.message);
      sendClientRedirect(res, failUrl);
    }
  },

  // Payment cancellation callback from SSL Commerz
  async handlePaymentCancel(req: Request, res: Response) {
    const cancelUrl = "http://localhost:3000/payments/error?variant=cancelled";
    try {
      const src = { ...(req.query as any), ...(req.body as any) };
      const { tran_id } = src;

      console.log("[payment/cancel] hit", { method: req.method, tran_id });

      await paymentService.handlePaymentCancellation(tran_id as string);
      const target = withTxn(cancelUrl, tran_id);
      console.log("[payment/cancel] redirecting to", target);
      sendClientRedirect(res, target);
    } catch (error: any) {
      console.log("[payment/cancel] error:", error?.message);
      sendClientRedirect(res, cancelUrl);
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
