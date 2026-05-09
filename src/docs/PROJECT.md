# RestOs - Business Requirements Document (BRD)

## Project Overview
RestOs is a restaurant operations management system with user authentication and role-based access control.

---

# Authentication & Account Management

**Description**: Users can create accounts, log in, and manage their passwords

**Who can use it**: Public (any user)

**What can a User do:**
- Create a new account with email and password
- Upload a profile picture during registration
- Log in with email and password
- Reset a forgotten password via email link
- Change their password

**Limitations / Rules**:
- Email must be unique (cannot create duplicate accounts)
- Password reset link expires after a set time
- Users can only manage their own account

---

# User Management

**Description**: Admins can manage all user accounts, roles, and access levels

**Who can use it**: Admin only

**What can an Admin do:**
- View all users in the system
- Change a user's role (Admin / User / Manager)
- Deactivate or remove user accounts
- Reset user passwords (force password change)
- View user profile information and registration date

**Limitations / Rules**:
- Admins cannot be deleted (at least one admin must exist)
- Users cannot change their own role
- Deactivated accounts cannot access the system

---

# (Future Features - To be documented as added)

---

Last Updated: 2026-05-09
*Last Updated by: Claude Code*
