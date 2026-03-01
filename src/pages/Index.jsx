import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';
import headphonesImg from '../assets/headphone.png';

const PAYMENT_API = 'https://fiat-checkout2.free.beeceptor.com/api/payment';

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

const formatCardNumber = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
};

const formatExpiry = (value) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
};

const Index = () => {
  const navigate = useNavigate();

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

  const handleChange = (field, raw) => {
    let value = raw;
    if (field === 'cardNumber') value = formatCardNumber(raw);
    if (field === 'expiry') value = formatExpiry(raw);
    if (field === 'cvv') value = raw.replace(/\D/g, '').slice(0, 4);

    setForm((prev) => ({ ...prev, [field]: value }));

    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validators[field](form[field]) }));
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

  const handleSubmit = async () => {
    setApiError('');
    if (!validateAll()) return;

    setLoading(true);

    try {
      const res = await fetch(PAYMENT_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardholderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber.replace(/\s/g, ''),
          expiry: form.expiry,
          amount: 14900,
          currency: 'INR',
        }),
      });
      console.log("res", res);
      const data = await res.json();
      console.log("data", data);

      if (data.success) {
        navigate('/success', { state: { transaction: data } });
      } else {
        setApiError(data.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setApiError(err.message === 'Invalid response from server'
        ? 'Invalid response from server. Please try again.'
        : 'Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        <div className="checkout-header">
          <button className="checkout-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="checkout-title">Secure Checkout</span>
          <div className="checkout-header-spacer" />
        </div>

        <div className="checkout-main">
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
            <div className="api-error-banner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          <div className={`form-group ${errors.cardholderName && touched.cardholderName ? 'has-error' : ''}`}>
            <label className="form-label">Cardholder Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter name on card"
              value={form.cardholderName}
              onChange={(e) => handleChange('cardholderName', e.target.value)}
              onBlur={() => handleBlur('cardholderName')}
              disabled={loading}
            />
            {errors.cardholderName && touched.cardholderName && (
              <span className="field-error">{errors.cardholderName}</span>
            )}
          </div>

          <div className={`form-group ${errors.cardNumber && touched.cardNumber ? 'has-error' : ''}`}>
            <label className="form-label">Card Number</label>
            <div className="form-input-wrapper">
              <input
                type="text"
                className="form-input"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                value={form.cardNumber}
                onChange={(e) => handleChange('cardNumber', e.target.value)}
                onBlur={() => handleBlur('cardNumber')}
                disabled={loading}
              />
              <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
              </span>
            </div>
            {errors.cardNumber && touched.cardNumber && (
              <span className="field-error">{errors.cardNumber}</span>
            )}
          </div>

          <div className="form-row">
            <div className={`form-group ${errors.expiry && touched.expiry ? 'has-error' : ''}`}>
              <label className="form-label">Expiry Date</label>
              <input
                type="text"
                className="form-input"
                placeholder="MM/YY"
                maxLength={5}
                value={form.expiry}
                onChange={(e) => handleChange('expiry', e.target.value)}
                onBlur={() => handleBlur('expiry')}
                disabled={loading}
              />
              {errors.expiry && touched.expiry && (
                <span className="field-error">{errors.expiry}</span>
              )}
            </div>
            <div className={`form-group ${errors.cvv && touched.cvv ? 'has-error' : ''}`}>
              <label className="form-label">CVV</label>
              <div className="form-input-wrapper">
                <input
                  type="text"
                  className="form-input"
                  placeholder="123"
                  maxLength={4}
                  value={form.cvv}
                  onChange={(e) => handleChange('cvv', e.target.value)}
                  onBlur={() => handleBlur('cvv')}
                  disabled={loading}
                />
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </span>
              </div>
              {errors.cvv && touched.cvv && (
                <span className="field-error">{errors.cvv}</span>
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
            disabled={loading}
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
    </div>
  );
};

export default Index;
