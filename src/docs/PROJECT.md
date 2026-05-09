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

# Food Management

**Description**: Admin can create and manage food items with images. Users can view all foods, see details, and leave reviews.

**Who can use it**: Everyone (view), Admin (manage)

**What can a User do:**
- View all available foods with pagination
- View top-selling foods
- Search and filter foods by category
- View detailed food information including ratings and reviews
- Add a review with rating and comment to any food item

**What can an Admin do:**
- Create new food items with images
- View all foods in the system
- Update food details and images
- Delete food items
- Manage food availability status

**Limitations / Rules**:
- Users cannot create, update, or delete foods
- Users can only add one review per food (or update existing review)
- Image uploads are optional but recommended
- Food names must be unique
- Prices must be greater than zero

---

# Food Categories

**Description**: Admin can organize foods into categories. Users can browse foods by category.

**Who can use it**: Everyone (view), Admin (manage)

**What can a User do:**
- View all food categories
- View single category details
- Browse foods within a category

**What can an Admin do:**
- Create new food categories with optional images
- View all categories
- Update category details and images
- Delete categories (if no foods assigned)

**Limitations / Rules**:
- Category names must be unique
- Cannot delete category if foods are assigned to it
- Categories help organize menu items

---

# (Future Features - To be documented as added)

---

Last Updated: 2026-05-09
*Last Updated by: Claude Code*
