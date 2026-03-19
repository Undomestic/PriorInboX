# Forgot Password - Visual Guide

## User Interface Changes

### 1. Login Form (Updated)
```
┌─────────────────────────────────┐
│  Welcome Back 👋               │
│  Sign in to continue            │
├─────────────────────────────────┤
│ Email                           │
│ [demo@priorinbox.com          ] │
│                                  │
│ Password                        │
│ [Demo@123                     ] │
│                                  │
│         ← Forgot password? →     │ ← NEW LINK
│                                  │
│    [Sign In Button]             │
│                                  │
│ New here? Create Account        │
└─────────────────────────────────┘
```

### 2. Forgot Password Form (Step 1)
```
┌─────────────────────────────────┐
│  Reset Password 🔐              │
│  Enter your email to receive     │
│  a reset code                   │
├─────────────────────────────────┤
│ Email Address                   │
│ [your@email.com               ] │
│  ❌ Error message (if any)      │
│                                  │
│  [Send Reset Code Button]       │
│                                  │
│ Remember your password?         │
│           ← Sign In             │
└─────────────────────────────────┘
```

### 3. Verify Code Form (Step 2)
```
┌─────────────────────────────────┐
│  Verify Code ✔️                 │
│  Enter the code sent to your    │
│  email                          │
├─────────────────────────────────┤
│ Verification Code (6 digits)    │
│ [000000                        ] │
│  ❌ Error message (if any)      │
│                                  │
│  [Verify Code Button]           │
│                                  │
│        ← Back                   │
└─────────────────────────────────┘
```

**Backend Console Shows:**
```
==================================================
📧 PASSWORD RESET CODE FOR user@example.com
Reset Code: 123456
Valid until: 2026-02-05 10:30:45
==================================================
```

### 4. Reset Password Form (Step 3)
```
┌─────────────────────────────────┐
│  New Password 🆕                │
│  Create a new strong password   │
├─────────────────────────────────┤
│ New Password                    │
│ [Enter new password           ] │
│                                  │
│ Password Strength:              │
│ ████░░░░░░  Medium strength    │
│                                  │
│ Confirm Password                │
│ [Confirm password             ] │
│  ❌ Error message (if any)      │
│                                  │
│  [Reset Password Button]        │
│                                  │
│     ← Back to Sign In           │
└─────────────────────────────────┘
```

## Password Strength Indicator

### Visual Feedback:
```
Password: "123"
Strength: ██░░░░░░░░  Weak password (RED)

Password: "MyPass123"
Strength: ██████░░░░  Medium strength (ORANGE)

Password: "Str0ng!P@ss"
Strength: ██████████  Strong password (GREEN)
```

## Modal Dialogs

### Success Modals:
```
╔═════════════════════════════════╗
│          ✓ Code Sent            │
│ ✅                               │
│                                  │
│ Check your email for the        │
│ reset code                      │
│                                  │
│       [Okay Button]             │
╚═════════════════════════════════╝
```

```
╔═════════════════════════════════╗
│       ✓ Code Verified           │
│ ✅                               │
│                                  │
│ Now create your new password    │
│                                  │
│       [Okay Button]             │
╚═════════════════════════════════╝
```

```
╔═════════════════════════════════╗
│         ✓ Success               │
│ ✅                               │
│                                  │
│ Your password has been reset!   │
│ Please log in with your new     │
│ password.                       │
│                                  │
│       [Okay Button]             │
╚═════════════════════════════════╝
```

### Error Modals:
```
╔═════════════════════════════════╗
│        ✕ Invalid Code           │
│ ❌                               │
│                                  │
│ The code you entered is         │
│ invalid or has expired          │
│                                  │
│       [Okay Button]             │
╚═════════════════════════════════╝
```

## Form Navigation Flow

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│   Sign In Form                                               │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ Email: [                                          ]  │    │
│   │ Password: [                                       ]  │    │
│   │          ← Forgot password? (CLICK)               │    │
│   └─────────────────────────────────────────────────────┘    │
│                  ↓                                             │
│   Forgot Password Form                                        │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ Email: [                                          ]  │    │
│   │ [Send Reset Code] → Backend sends code to console   │    │
│   └─────────────────────────────────────────────────────┘    │
│                  ↓                                             │
│   Verify Code Form                                            │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ Code: [                                           ]  │    │
│   │ [Verify Code] → Backend validates code             │    │
│   └─────────────────────────────────────────────────────┘    │
│                  ↓                                             │
│   Reset Password Form                                         │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ New Password: [                                   ]  │    │
│   │ Confirm: [                                        ]  │    │
│   │ [Reset Password] → Password updated! ✅            │    │
│   └─────────────────────────────────────────────────────┘    │
│                  ↓                                             │
│   Back to Sign In                                             │
│   ┌─────────────────────────────────────────────────────┐    │
│   │ Email: [user@example.com                          ]  │    │
│   │ Password: [NewPassword123                         ]  │    │
│   │ [Sign In] → SUCCESS ✅                            │    │
│   └─────────────────────────────────────────────────────┘    │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Color Scheme (Matches Existing Theme)

### Dark Mode:
- Background: `#0f172a` (slate-900)
- Cards: `rgba(255,255,255,0.08)` (with blur)
- Text: `#f8fafc` (slate-50)
- Accent: `#38bdf8` (cyan-400)
- Success: `#10b981` (emerald-500)
- Error: `#ef4444` (red-500)
- Warning: `#f59e0b` (amber-500)

### Light Mode:
- Background: `#f1f5f9` (slate-100)
- Cards: `#ffffff` (white)
- Text: `#020617` (slate-950)
- Accent: `#0284c7` (blue-600)
- Success: `#059669` (emerald-600)
- Error: `#dc2626` (red-600)
- Warning: `#d97706` (amber-600)

## Input Fields

```
Standard Text Input:
┌─────────────────────────────────┐
│ Label Text                      │
│ [Input field with blur effect ] │
└─────────────────────────────────┘

Input with Error:
┌─────────────────────────────────┐
│ Label Text                      │
│ [Input field - RED BORDER    ] │
│ ❌ Error message text           │
└─────────────────────────────────┘

Password Input:
┌─────────────────────────────────┐
│ Password                        │
│ [●●●●●●●●●●●●●●●●●●●●      ] │
│                                  │
│ Password Strength:              │
│ ██████░░░░░░  Medium strength  │
│ Medium strength (text)          │
└─────────────────────────────────┘
```

## Responsive Design

### Mobile (380px width):
```
Portrait view takes full width with max height
Max height: 90vh (scrollable if needed)
Padding: 30px
Border radius: 20px
```

### Desktop (1920px width):
```
Centered on screen
Fixed width: 380px
Centered vertically and horizontally
Same responsive behavior
```

## Animation Effects

### Form Transitions:
```
Fade in: opacity 0→1 in 0.6s ease
Slide down: translateY -20px → 0 in 0.6s ease
```

### Modal Dialogs:
```
Fade in overlay: opacity 0→1 in 0.3s
Slide and scale: translateY -30px, scale 0.95 → scale 1 in 0.4s
```

### Password Strength:
```
Width change: smooth transition 0.3s ease
Color change: smooth transition 0.3s ease
```

## Accessibility Features

- ✅ Semantic HTML5 labels
- ✅ Clear error messages
- ✅ Visual feedback on all interactions
- ✅ Focus states on inputs
- ✅ High contrast text
- ✅ Clear button labels
- ✅ Modal backdrop to focus attention

## Summary

The forgot password feature integrates seamlessly with the existing PriorInboX UI:
- Uses same color scheme and styling
- Matches existing form layouts
- Consistent animations and transitions
- Professional modal dialogs
- Clear error handling
- Full mobile responsiveness
