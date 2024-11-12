"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthValidation = exports.registerUserValidationSchema = void 0;
const zod_1 = require("zod");
const loginValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        photo: zod_1.z.string().optional(),
        email: zod_1.z.string({ required_error: 'User Email is required.' }),
        password: zod_1.z.string().optional(),
    }),
});
const refreshTokenValidationSchema = zod_1.z.object({
    cookies: zod_1.z.object({
        refreshToken: zod_1.z.string({
            required_error: 'Refresh token is required!',
        }),
    }),
});
exports.registerUserValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string(),
        email: zod_1.z.string().email(),
        photo: zod_1.z.string().optional(),
        password: zod_1.z.string().optional(),
    }),
});
const forgetPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User id is required!',
        }),
    }),
});
const resetPasswordValidationSchema = zod_1.z.object({
    body: zod_1.z.object({
        userId: zod_1.z.string({
            required_error: 'User id is required!',
        }),
        newPassword: zod_1.z.string({
            required_error: 'User password is required!',
        }),
    }),
});
exports.AuthValidation = {
    loginValidationSchema,
    refreshTokenValidationSchema,
    registerUserValidationSchema: exports.registerUserValidationSchema,
    resetPasswordValidationSchema,
    forgetPasswordValidationSchema
};
