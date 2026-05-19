/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import globalErrorHandler from './app/middlewares/globalErrorhandler';
import router from './route';
import notFound from './app/middlewares/notFound';
import { paymentControllers } from './app/modules/payment/payment.controller';


const app: Application = express();

//parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// SSLCommerz callback routes are mounted BEFORE CORS so they accept
// server-to-server POSTs from any origin (sandbox.sslcommerz.com etc.).
// These are public-by-design webhooks, not browser-fetched APIs.
app.get('/api/v1/payments/success', paymentControllers.handlePaymentSuccess);
app.post('/api/v1/payments/success', paymentControllers.handlePaymentSuccess);
app.get('/api/v1/payments/fail', paymentControllers.handlePaymentFail);
app.post('/api/v1/payments/fail', paymentControllers.handlePaymentFail);
app.get('/api/v1/payments/cancel', paymentControllers.handlePaymentCancel);
app.post('/api/v1/payments/cancel', paymentControllers.handlePaymentCancel);
app.post('/api/v1/payments/ipn', paymentControllers.handleIPN);

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://rest-os-client.vercel.app',
  'https://rest-os-server-lyart.vercel.app',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// application routes (CORS-protected). Payment callbacks above bypass CORS.
app.use('/api/v1', router);


app.get('/', (req: Request, res: Response) => {
  res.send('Restaurant Operating System Server!');
});

app.use(globalErrorHandler);

//Not Found
app.use(notFound);

export default app;