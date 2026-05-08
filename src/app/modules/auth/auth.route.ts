import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { AuthValidation } from './auth.validation';
import { AuthControllers } from './auth.controller';
import { upload } from '../../utils/sendImageToCloudinary';
import auth from '../../middlewares/auth';


const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthControllers.loginUser,
);

router.post(
  '/register',
  upload.single('photo'),
  validateRequest(AuthValidation.registerUserValidationSchema),
  AuthControllers.registerUser,
);


router.post(
  '/refresh-token',
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthControllers.refreshToken,
);


router.post(
  '/forget-password',
  auth(),
  AuthControllers.forgetPassword,
);



router.post(
  '/reset-password',
  validateRequest(AuthValidation.resetPasswordValidationSchema),
  AuthControllers.resetPassword,
);

export const authRoutes = router;
