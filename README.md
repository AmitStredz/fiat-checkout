# Fiat Checkout

A payment checkout page built with React and Vite. It validates card details, sends a payment request to a mock API, and handles success/failure responses.

**Live behavior:** The mock API returns success or failure randomly (50/50), so the same card details may succeed or fail on different attempts.

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
├── main.jsx              # Entry point, renders App
├── App.jsx               # Router setup (3 routes)
├── index.css             # Global reset & font
├── assets/
│   └── headphone.png     # Product image
└── pages/
    ├── Index.jsx          # Checkout page (form, validation, API call)
    ├── Checkout.css       # Styles for checkout page
    ├── Success.jsx        # Success page (transaction details)
    ├── Success.css        # Styles for success page
    └── NotFound.jsx       # 404 page
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Index | Checkout form |
| `/success` | Success | Payment success screen (receives data via router state) |
| `*` | NotFound | 404 page |

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

1. User fills in card details
2. Clicks "Pay Now"
3. Button shows spinner and "Processing…", all inputs are disabled
4. POST request is sent to the mock API
5. **On success:** navigates to `/success` with transaction data (ID, recipient, amount, timestamp)
6. **On failure:** red error banner appears at the top of the form with the error message
7. **On network error:** shows a connection error message

## Success Page

- Green checkmark with animation
- Transaction ID (truncated to first 5 and last 5 characters with copy-to-clipboard button)
- Paid To, Amount, Date fields
- "Back to Home" button
- If accessed directly without transaction data, redirects to `/`
