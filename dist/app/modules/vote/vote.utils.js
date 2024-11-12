"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ROLE = exports.validateEmail = void 0;
/* eslint-disable no-useless-escape */
const validateEmail = function (email) {
    const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;
exports.USER_ROLE = {
    user: 'user',
    admin: 'admin',
};
