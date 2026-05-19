import { Router } from "express";
import { paymentControllers } from "./payment.controller";
import validateRequest from "../../utils/validateRequest";
import { paymentValidations } from "./payment.validation";
import auth from "../../middlewares/auth";
import { USER_ROLE } from "../../constants";

const router = Router();

// Initiate payment (authenticated users)
router.post(
  "/initiate",
  auth(USER_ROLE.USER),
  validateRequest(paymentValidations.initiatePaymentSchema),
  paymentControllers.handleInitiatePayment
);

// Demo / portfolio mock pay — instant success, no gateway
router.post(
  "/mock-pay",
  auth(USER_ROLE.USER),
  validateRequest(paymentValidations.initiatePaymentSchema),
  paymentControllers.handleMockPay
);

// SSL Commerz callback URLs (public). SSLCommerz uses POST for these,
// but we accept GET too for easy manual testing.
router.get("/success", paymentControllers.handlePaymentSuccess);
router.post("/success", paymentControllers.handlePaymentSuccess);
router.get("/fail", paymentControllers.handlePaymentFail);
router.post("/fail", paymentControllers.handlePaymentFail);
router.get("/cancel", paymentControllers.handlePaymentCancel);
router.post("/cancel", paymentControllers.handlePaymentCancel);

// IPN handler (webhook from SSL Commerz)
router.post("/ipn", paymentControllers.handleIPN);

// Get payment history (authenticated users)
router.get(
  "/history",
  auth(USER_ROLE.USER),
  paymentControllers.handleGetPaymentHistory
);

// Get payment details (authenticated users)
router.get(
  "/:paymentId",
  auth(USER_ROLE.USER),
  paymentControllers.handleGetPaymentDetails
);

export const paymentRoutes = router;
