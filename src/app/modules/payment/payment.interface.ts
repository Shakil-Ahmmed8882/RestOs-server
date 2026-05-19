import { Schema } from "mongoose";

export type TPayment = {
  _id?: string;
  orderId: Schema.Types.ObjectId;
  orderIds: Schema.Types.ObjectId[];
  userId: Schema.Types.ObjectId;
  amount: number;
  currency: string;
  transactionId: string;
  status: "pending" | "completed" | "failed" | "cancelled";
  paymentMethod: string;
  sslcommerzResponse?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TPaymentRequest = {
  orderId: string;
  amount: number;
};

export type TPaymentResponse = {
  success: boolean;
  message: string;
  data?: any;
};

export type TSSLCommerzPayload = {
  store_id: string;
  store_passwd: string;
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  cus_name: string;
  cus_email: string;
  cus_phone: string;
  product_name: string;
  product_category: string;
  product_profile: string;
};
