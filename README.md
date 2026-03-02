# Fiat Checkout

A production-grade payment checkout page built with React and Vite. Features real-time card validation, an interactive 3D card preview, payment confirmation flow, and a mock API integration with full error handling.

**Live behavior:** The mock API returns success or failure randomly (50/50), so the same card details may succeed or fail on different attempts.

**Deployed Site Link:** https://fiat-checkout-amit.vercel.app
**Figma Link:** [Figma](https://www.figma.com/design/uZbiHprmFW8KV4OjZE56tj/Untitled?node-id=0-1&t=0qlcaJDEuPfiIh3u-1)
## Tech Stack

- React 19 + React Router 7
- Vite 7
- CSS (no UI library)
- Inter font (Google Fonts)
- Beeceptor mock API

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Project Structure

```
src/
├── main.jsx                    # Entry point, renders App
├── App.jsx                     # Router setup (3 routes)
├── index.css                   # Global reset & font
├── assets/
│   └── headphone.png           # Product image
├── components/
│   ├── CardPreview.jsx         # 3D interactive card preview
│   └── CardPreview.css         # Card preview styles
├── hooks/
│   └── useNetworkStatus.js     # Online/offline detection hook
├── utils/
│   └── confetti.js             # Canvas-based confetti animation
└── pages/
    ├── Index.jsx               # Checkout page (form, validation, API call)
    ├── Checkout.css             # Styles for checkout page
    ├── Success.jsx             # Success page (transaction details)
    ├── Success.css             # Styles for success page
    └── NotFound.jsx            # 404 page
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Checkout form |
| `/success` | Success | Payment success screen (receives data via router state) |
| `*` | NotFound | 404 page |

## Features

### 3D Interactive Card Preview
A visual credit card that updates in real-time as the user types. Shows card number, cardholder name, expiry, and card type brand. The card flips to show the back (with CVV area) when the CVV field is focused. Card gradient color changes based on detected card type.

### Auto-Advance Fields
When the card number reaches its max length, focus automatically moves to the expiry field. When expiry reaches `MM/YY` format, focus moves to CVV.

### Field Success Indicators
Green checkmark icon appears next to each field once it passes validation. Input border turns green to provide visual confirmation.

### Paste Handling
Pasting a card number strips non-digit characters and auto-formats the result.

### Payment Confirmation Sheet
After clicking "Pay Now", a bottom sheet overlay appears showing the payment amount, card details (type + last 4 digits), and cardholder name. The user must confirm before the actual API call is made.

### Request Timeout
Uses `AbortController` with a 30-second timeout. If the API takes too long, the request is aborted and a timeout error is shown.

### Double-Submit Prevention
A 3-second cooldown between payment attempts to prevent duplicate submissions. Shows a toast warning if the user tries to pay again too quickly.

### Network Offline Detection
Uses a custom `useNetworkStatus` hook that listens for browser `online`/`offline` events. When offline, a yellow banner appears at the top, and the pay button is disabled. Toast warnings appear if the user tries to submit while offline.

### Toast Notifications
Transient notification banners that slide in from the top. Supports info, warning, error, and success variants. Auto-dismiss after 3.5 seconds.

### Amount Breakdown
Shows subtotal, GST (18%), and total in a card between the item summary and payment form.

### Dismissible API Errors
Error banners include a close button. Errors auto-dismiss after 8 seconds.

### Keyboard Support
Pressing Enter in any form field triggers the payment flow. All inputs have proper `inputMode="numeric"` for mobile keyboards.

### Accessibility
- All inputs have `htmlFor`/`id` label associations
- `aria-required`, `aria-invalid`, `aria-label` attributes throughout
- `role="alert"` on error messages and toasts
- `role="dialog"` and `aria-modal` on confirmation sheet
- `autoComplete` hints for card fields (`cc-name`, `cc-number`, `cc-exp`, `cc-csc`)

### CVV Masking
CVV field uses `type="password"` to hide the value, matching real payment forms.

### Confetti Animation
Canvas-based confetti burst on the success page with multiple waves for a celebratory effect.

### Auto-Redirect Countdown
Success page shows a progress bar that counts down from 15 seconds, then auto-redirects to home. Users can click "Back to Home" to go immediately.

### Receipt Download
A "Download Receipt" button on the success page generates a formatted text file with transaction ID, date, amount breakdown, and status.

## Form Validation

All validation runs on blur and on submit. Errors clear in real-time as the user corrects input.

### Cardholder Name
- Required
- Minimum 3 characters
- Letters and spaces only

### Card Number
- Required
- Digits only (auto-formatted with spaces)
- 13–19 digits depending on card type
- **Luhn algorithm** check — validates the card number is mathematically valid
- **Card type detection** — identifies the card network from the first digits:
  - `4` → Visa
  - `51-55` or `22-27` → Mastercard
  - `34` or `37` → Amex
  - `6011` or `65` → Discover
  - `3528-3589` → JCB
  - `300-305`, `36`, `38` → Diners
  - `62` → UnionPay
- The card brand logo appears inside the input field as you type
- Amex uses 4-6-5 formatting (`0000 000000 00000`), others use 4-4-4-4

### Expiry Date
- Required
- Must match `MM/YY` format (auto-formatted — typing `1226` becomes `12/26`)
- Month must be 01–12
- Must not be expired (compared against current date)

### CVV
- Required
- 3 digits for most cards, 4 digits for Amex
- CVV max length adjusts dynamically based on detected card type

## Payment API

**Endpoint:** `POST https://fiat-checkout2.free.beeceptor.com/api/payment`

### Request body
```json
{
  "cardholderName": "John Doe",
  "cardNumber": "4242424242424242",
  "expiry": "12/28",
  "amount": 14900,
  "currency": "INR"
}
```

### Success response (50% chance)
```json
{
  "success": true,
  "message": "Your Payment was Successful",
  "transaction_Id": "uuid",
  "created_at": "UTC timestamp",
  "to": "username"
}
```

### Failure response (50% chance)
```json
{
  "error": "Something went wrong"
}
```

The API response may contain trailing commas (invalid JSON). The app reads the response as raw text and strips trailing commas before parsing.

## Payment Flow

1. User fills in card details (card preview updates in real-time, card flips on CVV focus)
2. Fields auto-advance as each one is completed
3. Clicks "Pay Now"
4. Confirmation bottom sheet appears with payment summary
5. User clicks "Confirm & Pay"
6. Button shows spinner and "Processing…", all inputs are disabled
7. POST request is sent with a 30-second timeout via AbortController
8. **On success:** navigates to `/success` with transaction data, confetti animation fires
9. **On failure:** red error banner appears with dismiss button, auto-clears after 8 seconds
10. **On timeout:** shows timeout-specific error message
11. **On network error:** shows a connection error message

## Success Page

- Green checkmark with pop-in animation
- Confetti burst animation (two waves)
- Transaction ID (truncated to first 5 and last 5 characters with copy-to-clipboard button)
- Paid To, Amount, Date fields
- "Download Receipt" button (generates .txt file)
- "Back to Home" button
- Auto-redirect countdown (15 seconds) with progress bar
- If accessed directly without transaction data, redirects to `/`
