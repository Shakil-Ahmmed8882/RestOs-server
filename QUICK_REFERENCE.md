# 🚀 Quick Reference Card

## API Endpoints Summary

### Registration
```
POST /api/auth/register
Content-Type: multipart/form-data

Scenario 1: Manual with image
- name: required
- email: required
- password: required
- photo: file (optional)

Scenario 2: Manual without image
- name: required
- email: required
- password: required
(no photo)

Scenario 3: OAuth
- name: required
- email: required
- password: (skip)
- photo: file (optional)

Response:
✓ accessToken
✓ refreshToken
✓ user (with Cloudinary photo URL)
```

### Forget Password (Password Reset Request)
```
POST /api/auth/forget-password
Headers: Authorization: Bearer {accessToken}
Body: {} (empty)

Requirements:
✓ User must be logged in
✓ Valid access token required

Response:
✓ Email sent with reset link
✓ Reset token expires in 10 minutes
```

### Reset Password
```
POST /api/auth/reset-password
Headers: Authorization: Bearer {resetToken}
Body: {
  "userId": "USER_ID",
  "newPassword": "new_password"
}

Requirements:
✓ Reset token from email (10 min window)
✓ userId must match token
✓ Both fields required

Response:
✓ Password updated
✓ Ready to login with new password
```

---

## 📋 Postman Cheat Sheet

### Step 1: Register User
```
URL: http://localhost:3000/api/auth/register
Method: POST
Body Type: form-data

Fields:
| Key | Type | Value |
|-----|------|-------|
| name | text | John Doe |
| email | text | john@example.com |
| password | text | SecurePass123 |
| photo | file | [select image] |

Copy accessToken from response
```

### Step 2: Request Password Reset
```
URL: http://localhost:3000/api/auth/forget-password
Method: POST
Headers: Authorization: Bearer {accessToken}
Body Type: raw (JSON)

Body:
{}

Check email for reset link
Extract resetToken from link
```

### Step 3: Reset Password
```
URL: http://localhost:3000/api/auth/reset-password
Method: POST
Headers: Authorization: Bearer {resetToken}
Body Type: raw (JSON)

Body:
{
  "userId": "USER_ID",
  "newPassword": "NewPassword456"
}

Success response = password changed
```

### Step 4: Verify Login
```
URL: http://localhost:3000/api/auth/login
Method: POST
Body Type: raw (JSON)

Body:
{
  "email": "john@example.com",
  "password": "NewPassword456"
}

Should succeed with new password
```

---

## 🔑 Token Reference

### Access Token
- Use for: Authenticated API requests
- Header: `Authorization: Bearer {accessToken}`
- Expires: 1 hour
- Location: Response + httpOnly cookie

### Refresh Token
- Use for: Getting new access token
- Endpoint: `/api/auth/refresh-token`
- Expires: 7 days
- Location: httpOnly cookie

### Reset Token
- Use for: Password reset only
- Endpoint: `/api/auth/reset-password`
- Expires: 10 minutes
- Location: Email link

---

## ⚠️ Common Errors & Solutions

### 400 Bad Request
**Cause:** Missing required field
**Solution:** Check all required fields are provided

### 401 Unauthorized
**Cause:** Invalid or expired token
**Solution:** Get fresh token by logging in again

### 403 Forbidden
**Cause:** User blocked or token mismatch
**Solution:** Contact admin or request new reset

### 404 Not Found
**Cause:** User doesn't exist
**Solution:** Register first or check email

### 500 Server Error
**Cause:** Cloudinary or email service issue
**Solution:** Check .env credentials

---

## 📁 Documentation Files

| File | Purpose | When to Read |
|------|---------|--------------|
| README.md | Overview & guide | First |
| REGISTER.md | Registration guide | Testing registration |
| FORGET_PASSWORD.md | Reset request guide | Testing forget password |
| RESET_PASSWORD.md | Reset guide | Testing reset password |
| IMPLEMENTATION_SUMMARY.md | Technical details | Understanding code |

**Location:** `src/app/modules/auth/docs/`

---

## 🔐 .env Configuration

Required variables:
```bash
# JWT
JWT_ACCESS_SECRET=your_key
JWT_REFRESH_SECRET=your_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=email@gmail.com
SMTP_PASS=app_password

# Other
RESET_PASS_UI_LINK=http://localhost:3000/reset-password
BCRYPT_SALT_ROUNDS=10
```

---

## 🎯 Testing Checklist

### Registration
- [ ] Register with image
- [ ] Register without image
- [ ] Register without password (OAuth)
- [ ] Get access token
- [ ] Check photo URL in response
- [ ] Duplicate email error
- [ ] Missing fields error

### Password Reset
- [ ] Login successfully
- [ ] Request password reset
- [ ] Receive email
- [ ] Extract reset token
- [ ] Reset password successfully
- [ ] Login with new password
- [ ] Old password doesn't work
- [ ] Expired token error (after 10 min)

### Security
- [ ] Token in httpOnly cookie
- [ ] Password hashed in DB
- [ ] No plain passwords in logs
- [ ] File auto-deleted locally
- [ ] Cloudinary URL stored
- [ ] File size validation
- [ ] File type validation

---

## 📝 Git Commit

**Copy-paste ready command:** `GIT_COMMIT_COMMAND.txt`

**Or use this message:**
```
feat(auth): implement image upload to cloudinary and fix password reset apis

[See COMMIT_MESSAGE.txt for full details]
```

---

## 🚀 Go-Live Checklist

- [ ] All APIs tested
- [ ] Email service configured
- [ ] Cloudinary credentials verified
- [ ] JWT secrets generated
- [ ] Environment variables set
- [ ] Error handling tested
- [ ] Security headers added
- [ ] CORS configured
- [ ] Rate limiting added (optional)
- [ ] Monitoring setup
- [ ] Documentation deployed
- [ ] Team trained
- [ ] Backup in place

---

## 📊 File Structure

```
RestOs-server/
├── src/app/modules/auth/
│   ├── docs/                    (NEW)
│   │   ├── README.md            (NEW)
│   │   ├── REGISTER.md          (NEW)
│   │   ├── FORGET_PASSWORD.md   (NEW)
│   │   ├── RESET_PASSWORD.md    (NEW)
│   │   └── IMPLEMENTATION_SUMMARY.md (NEW)
│   │
│   ├── auth.controller.ts       (MODIFIED)
│   ├── auth.service.ts          (MODIFIED)
│   ├── auth.route.ts            (MODIFIED)
│   ├── auth.validation.ts       (MODIFIED)
│   └── ...
│
├── src/app/modules/user/
│   └── user.model.ts            (MODIFIED)
│
├── POSTMAN_GUIDE.md             (CREATED)
├── COMMIT_MESSAGE.txt           (CREATED)
├── GIT_COMMIT_COMMAND.txt       (CREATED)
├── IMPLEMENTATION_COMPLETE.md   (CREATED)
├── FINAL_SUMMARY.md             (CREATED)
└── QUICK_REFERENCE.md           (THIS FILE)
```

---

## 🔗 Quick Links

### Start Here
- Read: `src/app/modules/auth/docs/README.md`
- Summary: `FINAL_SUMMARY.md`

### For Testing
- Register: `src/app/modules/auth/docs/REGISTER.md`
- Forget: `src/app/modules/auth/docs/FORGET_PASSWORD.md`
- Reset: `src/app/modules/auth/docs/RESET_PASSWORD.md`

### For Committing
- Message: `COMMIT_MESSAGE.txt`
- Command: `GIT_COMMIT_COMMAND.txt`

---

## 💡 Pro Tips

1. **Image Upload:**
   - Keep file under 10MB
   - Use JPG/PNG for best results
   - Check Cloudinary dashboard for uploads

2. **Password Reset:**
   - Reset token valid for 10 minutes only
   - Email takes 1-2 seconds to arrive
   - Can request multiple resets

3. **OAuth:**
   - No password field needed
   - Photo from provider optional
   - Default photo used if missing

4. **Testing:**
   - Use unique emails for each test
   - Save tokens for later requests
   - Check network tab for cookies

5. **Production:**
   - Use strong JWT secrets
   - Enable HTTPS for all endpoints
   - Set secure: true for cookies
   - Add rate limiting

---

## 🆘 Need Help?

1. **Check documentation:** See `src/app/modules/auth/docs/`
2. **Review error scenarios:** Each doc has error section
3. **Look at examples:** Each doc has cURL and code examples
4. **Check .env:** Verify all credentials
5. **Test step-by-step:** Don't skip any steps

---

## ✅ Status: COMPLETE ✅

All implementation complete and documented:
- ✓ Image upload to Cloudinary
- ✓ Forget password fix
- ✓ Reset password fix
- ✓ OAuth support
- ✓ 5 documentation files
- ✓ Testing guides
- ✓ Code examples
- ✓ Error handling

**Ready to test and deploy!**

