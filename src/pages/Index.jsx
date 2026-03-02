import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';
import headphonesImg from '../assets/headphone.png';
import CardPreview from '../components/CardPreview';
import useNetworkStatus from '../hooks/useNetworkStatus';

const PAYMENT_API = 'https://fiat-checkout2.free.beeceptor.com/api/payment';
const REQUEST_TIMEOUT = 30000;
const SUBMIT_COOLDOWN = 3000;

const detectCardType = (number) => {
  const digits = number.replace(/\s/g, '');
  if (!digits) return null;
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^6(?:011|5)/.test(digits)) return 'discover';
  if (/^35(?:2[89]|[3-8])/.test(digits)) return 'jcb';
  if (/^3(?:0[0-5]|[68])/.test(digits)) return 'diners';
  if (/^62/.test(digits)) return 'unionpay';
  return null;
};

const luhnCheck = (number) => {
  const digits = number.replace(/\s/g, '');
  if (!/^\d+$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
};

const cardConfig = {
  visa: { maxLength: 16, cvvLength: 3 },
  mastercard: { maxLength: 16, cvvLength: 3 },
  amex: { maxLength: 15, cvvLength: 4 },
  discover: { maxLength: 16, cvvLength: 3 },
  jcb: { maxLength: 16, cvvLength: 3 },
  diners: { maxLength: 14, cvvLength: 3 },
  unionpay: { maxLength: 19, cvvLength: 3 },
};

const validators = {
  cardholderName: (v) => {
    if (!v.trim()) return 'Cardholder name is required';
    if (v.trim().length < 3) return 'Name must be at least 3 characters';
    if (!/^[a-zA-Z\s]+$/.test(v.trim())) return 'Name must contain only letters';
    return '';
  },
  cardNumber: (v) => {
    const digits = v.replace(/\s/g, '');
    if (!digits) return 'Card number is required';
    if (!/^\d+$/.test(digits)) return 'Card number must contain only digits';
    if (digits.length < 13 || digits.length > 19) return 'Card number must be 13–19 digits';
    if (digits.length >= 13 && !luhnCheck(digits)) return 'Invalid card number';
    return '';
  },
  expiry: (v) => {
    if (!v.trim()) return 'Expiry date is required';
    if (!/^\d{2}\/\d{2}$/.test(v.trim())) return 'Use MM/YY format';
    const [mm, yy] = v.split('/').map(Number);
    if (mm < 1 || mm > 12) return 'Invalid month';
    const now = new Date();
    const expDate = new Date(2000 + yy, mm);
    if (expDate <= now) return 'Card has expired';
    return '';
  },
  cvv: (v) => {
    if (!v.trim()) return 'CVV is required';
    if (!/^\d{3,4}$/.test(v.trim())) return 'CVV must be 3 or 4 digits';
    return '';
  },
};

const formatCardNumber = (value, cardType) => {
  const max = cardType && cardConfig[cardType] ? cardConfig[cardType].maxLength : 16;
  const digits = value.replace(/\D/g, '').slice(0, max);
  if (cardType === 'amex') {
    return digits.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  }
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const SuccessCheck = () => (
  <svg className="field-success-icon" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#22c55e"/>
    <path d="M6 10.5l2.5 2.5 5.5-5.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Index = () => {
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();

  const [form, setForm] = useState({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cvvFocused, setCvvFocused] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  const expiryRef = useRef(null);
  const cvvRef = useRef(null);
  const lastSubmitRef = useRef(0);
  const abortRef = useRef(null);
  const toastTimerRef = useRef(null);

  const cardType = detectCardType(form.cardNumber);
  const cvvMax = cardType && cardConfig[cardType] ? cardConfig[cardType].cvvLength : 4;

  const showToast = useCallback((message, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => setApiError(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [apiError]);

  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const isFieldValid = (field) => touched[field] && !validators[field](form[field]);

  const handleChange = (field, raw) => {
    let value = raw;
    if (field === 'cardNumber') {
      const type = detectCardType(raw);
      value = formatCardNumber(raw, type);
      const digits = value.replace(/\s/g, '');
      const max = type && cardConfig[type] ? cardConfig[type].maxLength : 16;
      if (digits.length >= max) {
        setTimeout(() => expiryRef.current?.focus(), 0);
      }
    }
    if (field === 'expiry') {
      value = formatExpiry(raw);
      if (value.length === 5) {
        setTimeout(() => cvvRef.current?.focus(), 0);
      }
    }
    if (field === 'cvv') value = raw.replace(/\D/g, '').slice(0, cvvMax);

    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    handleChange('cardNumber', pasted);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }));
    if (field === 'cvv') setCvvFocused(false);
  };

  const validateAll = () => {
    const next = {};
    for (const key of Object.keys(validators)) {
      next[key] = validators[key](form[key]);
    }
    setErrors(next);
    setTouched({ cardholderName: true, cardNumber: true, expiry: true, cvv: true });
    return Object.values(next).every((e) => e === '');
  };

  const handleSubmit = () => {
    setApiError('');
    if (!validateAll()) return;

    const now = Date.now();
    if (now - lastSubmitRef.current < SUBMIT_COOLDOWN) {
      showToast('Please wait before trying again', 'warning');
      return;
    }

    if (!isOnline) {
      showToast('You are offline. Check your connection.', 'error');
      return;
    }

    setShowConfirm(true);
  };

  const confirmPayment = async () => {
    setShowConfirm(false);
    setLoading(true);
    lastSubmitRef.current = Date.now();

    abortRef.current = new AbortController();
    const timeoutId = setTimeout(() => abortRef.current?.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          cardholderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber.replace(/\s/g, ''),
          expiry: form.expiry,
          amount: 14900,
          currency: 'INR',
        }),
      });

      clearTimeout(timeoutId);

      const text = await res.text();
      const cleaned = text.replace(/,\s*([\]}])/g, '$1');
      const data = JSON.parse(cleaned);

      if (data.success) {
        navigate('/success', { state: { transaction: data } });
      } else {
        setApiError(data.error || 'Payment declined. Please try again.');
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setApiError('Request timed out. Please try again.');
      } else if (err instanceof SyntaxError) {
        setApiError('Invalid response from server. Please try again.');
      } else {
        setApiError('Network error. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) handleSubmit();
  };

  const lastFour = form.cardNumber.replace(/\s/g, '').slice(-4);

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        {!isOnline && (
          <div className="offline-banner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
            </svg>
            <span>You're offline. Check your connection.</span>
          </div>
        )}

        {toast && (
          <div className={`toast toast--${toast.type}`} role="alert">
            <span>{toast.message}</span>
          </div>
        )}

        <div className="checkout-header">
          <button className="checkout-back-btn" aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="checkout-title">Secure Checkout</span>
          <div className="checkout-header-spacer" />
        </div>

        <div className="checkout-main" onKeyDown={handleKeyDown}>
          <div className="item-summary">
            <img src={headphonesImg} alt="Premium Wireless Headphones" className="item-image" />
            <div className="item-details">
              <span className="item-label">Item Summary</span>
              <span className="item-name">Premium Wireless Headphones</span>
              <span className="item-price">₹14,900</span>
            </div>
          </div>

          <div className="payment-section">
            <div className="payment-header">
              <span className="payment-title">Card Payment</span>
              <div className="payment-icons">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                </svg>
              </div>
            </div>

            {apiError && (
              <div className="api-error-banner" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{apiError}</span>
                <button className="error-dismiss" onClick={() => setApiError('')} aria-label="Dismiss error">&times;</button>
              </div>
            )}

            <div className={`form-group ${errors.cardholderName && touched.cardholderName ? 'has-error' : ''} ${isFieldValid('cardholderName') ? 'has-success' : ''}`}>
              <label className="form-label" htmlFor="cardholderName">Cardholder Name</label>
              <div className="form-input-wrapper">
                <input
                  id="cardholderName"
                  type="text"
                  className="form-input"
                  placeholder="Enter name on card"
                  autoComplete="cc-name"
                  aria-required="true"
                  aria-invalid={!!(errors.cardholderName && touched.cardholderName)}
                  value={form.cardholderName}
                  onChange={(e) => handleChange('cardholderName', e.target.value)}
                  onBlur={() => handleBlur('cardholderName')}
                  disabled={loading}
                />
                {isFieldValid('cardholderName') && <SuccessCheck />}
              </div>
              {errors.cardholderName && touched.cardholderName && (
                <span className="field-error" role="alert">{errors.cardholderName}</span>
              )}
            </div>

            <div className={`form-group ${errors.cardNumber && touched.cardNumber ? 'has-error' : ''} ${isFieldValid('cardNumber') ? 'has-success' : ''}`}>
              <label className="form-label" htmlFor="cardNumber">Card Number</label>
              <div className="form-input-wrapper">
                <input
                  id="cardNumber"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder={cardType === 'amex' ? '0000 000000 00000' : '0000 0000 0000 0000'}
                  maxLength={cardType === 'amex' ? 17 : 19}
                  autoComplete="cc-number"
                  aria-required="true"
                  aria-invalid={!!(errors.cardNumber && touched.cardNumber)}
                  value={form.cardNumber}
                  onChange={(e) => handleChange('cardNumber', e.target.value)}
                  onPaste={handlePaste}
                  onBlur={() => handleBlur('cardNumber')}
                  disabled={loading}
                />
                <span className="input-icon card-brand-icon">
                  {cardType ? (
                    <span className={`card-brand card-brand--${cardType}`}>
                      {cardType === 'visa' && (
                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="32" rx="4" fill="#1A1F71"/>
                          <path d="M19.5 21H16.8L18.5 11H21.2L19.5 21ZM14.8 11L12.2 18L11.9 16.5L11 12C11 12 10.9 11 9.5 11H5.1L5 11.2C5 11.2 6.5 11.5 8.3 12.6L10.7 21H13.5L17.7 11H14.8ZM37.5 21H40L37.8 11H35.6C34.4 11 34.1 12 34.1 12L30 21H32.8L33.3 19.5H36.8L37.5 21ZM34.1 17.3L35.6 13.2L36.4 17.3H34.1ZM30 13.5L30.4 11.2C30.4 11.2 29 10.7 27.5 10.7C26 10.7 22.5 11.4 22.5 14.5C22.5 17.3 26.5 17.3 26.5 18.8C26.5 20.3 23 20 21.7 19L21.3 21.4C21.3 21.4 22.7 22 24.7 22C26.7 22 30 20.8 30 18C30 15.1 26 14.8 26 13.5C26 12.2 28.7 12.4 30 13.5Z" fill="white"/>
                        </svg>
                      )}
                      {cardType === 'mastercard' && (
                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="32" rx="4" fill="#252525"/>
                          <circle cx="19" cy="16" r="8" fill="#EB001B"/>
                          <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
                          <path d="M24 9.8a8 8 0 010 12.4 8 8 0 000-12.4z" fill="#FF5F00"/>
                        </svg>
                      )}
                      {cardType === 'amex' && (
                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="32" rx="4" fill="#2E77BC"/>
                          <text x="24" y="20" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold" fontFamily="sans-serif">AMEX</text>
                        </svg>
                      )}
                      {cardType === 'discover' && (
                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="32" rx="4" fill="#F6F6F6"/>
                          <circle cx="28" cy="16" r="7" fill="#F47216"/>
                          <text x="14" y="19" fill="#1A1A2E" fontSize="7" fontWeight="bold" fontFamily="sans-serif">D</text>
                        </svg>
                      )}
                      {!['visa', 'mastercard', 'amex', 'discover'].includes(cardType) && (
                        <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect width="48" height="32" rx="4" fill="#E2E8F0"/>
                          <text x="24" y="19" textAnchor="middle" fill="#64748B" fontSize="7" fontWeight="600" fontFamily="sans-serif">{cardType.toUpperCase()}</text>
                        </svg>
                      )}
                    </span>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                    </svg>
                  )}
                </span>
              </div>
              {errors.cardNumber && touched.cardNumber && (
                <span className="field-error" role="alert">{errors.cardNumber}</span>
              )}
            </div>

            <div className="form-row">
              <div className={`form-group ${errors.expiry && touched.expiry ? 'has-error' : ''} ${isFieldValid('expiry') ? 'has-success' : ''}`}>
                <label className="form-label" htmlFor="expiry">Expiry Date</label>
                <div className="form-input-wrapper">
                  <input
                    id="expiry"
                    ref={expiryRef}
                    type="text"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="MM/YY"
                    maxLength={5}
                    autoComplete="cc-exp"
                    aria-required="true"
                    aria-invalid={!!(errors.expiry && touched.expiry)}
                    value={form.expiry}
                    onChange={(e) => handleChange('expiry', e.target.value)}
                    onBlur={() => handleBlur('expiry')}
                    disabled={loading}
                  />
                  {isFieldValid('expiry') && <SuccessCheck />}
                </div>
                {errors.expiry && touched.expiry && (
                  <span className="field-error" role="alert">{errors.expiry}</span>
                )}
              </div>
              <div className={`form-group ${errors.cvv && touched.cvv ? 'has-error' : ''} ${isFieldValid('cvv') ? 'has-success' : ''}`}>
                <label className="form-label" htmlFor="cvv">CVV</label>
                <div className="form-input-wrapper">
                  <input
                    id="cvv"
                    ref={cvvRef}
                    type="password"
                    inputMode="numeric"
                    className="form-input"
                    placeholder="123"
                    maxLength={cvvMax}
                    autoComplete="cc-csc"
                    aria-required="true"
                    aria-invalid={!!(errors.cvv && touched.cvv)}
                    value={form.cvv}
                    onChange={(e) => handleChange('cvv', e.target.value)}
                    onFocus={() => setCvvFocused(true)}
                    onBlur={() => handleBlur('cvv')}
                    disabled={loading}
                  />
                  {isFieldValid('cvv') ? <SuccessCheck /> : (
                    <span className="input-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                      </svg>
                    </span>
                  )}
                </div>
                {errors.cvv && touched.cvv && (
                  <span className="field-error" role="alert">{errors.cvv}</span>
                )}
              </div>
            </div>

            <div className="security-notice">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              YOUR PAYMENT IS SECURED WITH 256-BIT ENCRYPTION
            </div>

            <div className="other-methods">
              <a href="#">Other Payment Methods &rsaquo;</a>
            </div>

            <p className="terms-text">
              By tapping Pay Now, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </p>
          </div>
        </div>

        <div className="pay-button-wrapper">
          <button
            className={`pay-button ${loading ? 'pay-button--loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading || !isOnline}
            aria-label={loading ? 'Processing payment' : 'Pay ₹14,900'}
          >
            {loading ? (
              <span className="spinner-wrapper">
                <span className="spinner" />
                Processing…
              </span>
            ) : (
              'Pay Now  ·  ₹14,900'
            )}
          </button>
        </div>

      </div>

      <div className="card-preview-side">
        <CardPreview
          cardNumber={form.cardNumber}
          cardholderName={form.cardholderName}
          expiry={form.expiry}
          cvv={form.cvv}
          cardType={cardType}
          isFlipped={cvvFocused}
        />
      </div>

      {showConfirm && (
        <div className="confirm-overlay" onClick={() => setShowConfirm(false)}>
          <div className="confirm-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Confirm payment">
            <div className="confirm-handle" />
            <h3 className="confirm-heading">Confirm Payment</h3>

            <div className="confirm-amount-display">
              <span className="confirm-currency">₹</span>
              <span className="confirm-amount-value">14,900</span>
            </div>

            <div className="confirm-details">
              <div className="confirm-row">
                <span className="confirm-label">Card</span>
                <span className="confirm-value">{cardType ? cardType.charAt(0).toUpperCase() + cardType.slice(1) : 'Card'} •••• {lastFour}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Name</span>
                <span className="confirm-value">{form.cardholderName.trim()}</span>
              </div>
              <div className="confirm-row">
                <span className="confirm-label">Item</span>
                <span className="confirm-value">Premium Wireless Headphones</span>
              </div>
            </div>

            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="confirm-pay" onClick={confirmPayment}>Confirm & Pay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
