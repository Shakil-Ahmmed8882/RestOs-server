import { Request, Response } from "express";
import { paymentService } from "./payment.service";

export const paymentControllers = {
  // Initiate payment
  async handleInitiatePayment(req: Request, res: Response) {
    try {
      const { orderId } = req.body;
      const userId = (req.user as any)?._id || req.body.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "User not authenticated",
        });
        return;
      }

      const result = await paymentService.initiatePayment(orderId, userId);

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

  // Payment success callback from SSL Commerz
  async handlePaymentSuccess(req: Request, res: Response) {
    try {
      const { tran_id, val_id, amount, currency, status } = req.query;

      if (status === "VALID" || status === "VALIDATED") {
        await paymentService.verifyPayment(
          tran_id as string,
          val_id as string
        );

        res.redirect(
          `${process.env.CLIENT_URL}/payment-success?transactionId=${tran_id}`
        );
      } else {
        res.redirect(
          `${process.env.CLIENT_URL}/payment-failed?transactionId=${tran_id}`
        );
      }
    } catch (error: any) {
      res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
    }
  },

  // Payment failure callback from SSL Commerz
  async handlePaymentFail(req: Request, res: Response) {
    try {
      const { tran_id } = req.query;

      await paymentService.handlePaymentFailure(tran_id as string);

      res.redirect(
        `${process.env.CLIENT_URL}/payment-failed?transactionId=${tran_id}`
      );
    } catch (error: any) {
      res.redirect(`${process.env.CLIENT_URL}/payment-failed`);
    }
  },

  // Payment cancellation callback from SSL Commerz
  async handlePaymentCancel(req: Request, res: Response) {
    try {
      const { tran_id } = req.query;

      await paymentService.handlePaymentCancellation(tran_id as string);

      res.redirect(
        `${process.env.CLIENT_URL}/payment-cancelled?transactionId=${tran_id}`
      );
    } catch (error: any) {
      res.redirect(`${process.env.CLIENT_URL}/payment-cancelled`);
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
      const userId = (req.user as any)?._id;
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
        success: true,
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
        success: true,
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
