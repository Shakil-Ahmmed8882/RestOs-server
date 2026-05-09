# Project Documentation Instructions

This file explains how to maintain the Business Requirements Document (BRD) at `src/docs/PROJECT.md`.

## Purpose
The `PROJECT.md` file is a Business Requirements Document (BRD) that describes all features from a **business/product perspective**. It documents:
- What features exist in the system
- What actions each user role can perform
- What limitations and access controls exist
- What business processes are supported

**NOT included**: Technical implementation details, code patterns, architecture, or how features are built.

## When to Update
Whenever a new feature or capability is added to the system, add it to PROJECT.md.

## How to Update

### Format for New Features

**# Feature Name**

**Description**: One sentence describing what this feature does in business terms

**Who can use it**: User roles that have access (Admin / User / Guest / etc.)

**What can [Role] do:**
- Action 1
- Action 2
- Action 3

**Limitations / Rules**:
- Rule 1
- Rule 2

### Example Format
```
# User Management

**Description**: Admins can manage user accounts and assign roles within the system

**Who can use it**: Admin only

**What can Admin do:**
- View all users in the system
- Change user roles (Admin, User, Manager)
- Deactivate user accounts
- Reset user passwords

**Limitations / Rules**:
- Users cannot change their own role
- Deactivated accounts can be reactivated
- Only one admin must exist
```

## Keep It Simple
- Title and bullet points only
- Business language, not technical terms
- Focus on actions and permissions
- One line per action
- No code, no implementation details

## File Location
`src/docs/PROJECT.md` - This is the main BRD file for the project.
