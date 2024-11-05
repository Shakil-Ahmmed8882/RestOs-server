import { z } from 'zod';

const loginValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    photo: z.string().optional(),
    email: z.string({ required_error: 'User Email is required.' }),
    password: z.string().optional(),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({
      required_error: 'Refresh token is required!',
    }),
  }),
});

export const registerUserValidationSchema = z.object({
  body: z.object({
    name: z.string(),
    email: z.string().email(),
    photo: z.string().optional(), 
    password: z.string().optional(),
  }),
});



const forgetPasswordValidationSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User id is required!',
    }),
  }),
});

const resetPasswordValidationSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: 'User id is required!',
    }),
    newPassword: z.string({
      required_error: 'User password is required!',
    }),
  }),
});



export const AuthValidation = {
  loginValidationSchema,
  refreshTokenValidationSchema,
  registerUserValidationSchema,
  resetPasswordValidationSchema,
  forgetPasswordValidationSchema

};
