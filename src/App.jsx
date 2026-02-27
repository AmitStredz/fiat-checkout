import './Checkout.css';
import headphonesImg from '@/assets/headphones.png';

const App = () => {
  return (
    <div className="checkout-wrapper">
      <div className="checkout-container">
        {/* Header */}
        <div className="checkout-header">
          <button className="checkout-back-btn">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="checkout-title">Secure Checkout</span>
        </div>

        {/* Item Summary */}
        <div className="item-summary">
          <img src={headphonesImg} alt="Premium Wireless Headphones" className="item-image" />
          <div className="item-details">
            <span className="item-label">Item Summary</span>
            <span className="item-name">Premium Wireless Headphones</span>
            <span className="item-price">₹14,900</span>
          </div>
        </div>

        {/* Payment Form */}
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

          <div className="form-group">
            <label className="form-label">Cardholder Name</label>
            <input type="text" className="form-input" placeholder="Enter name on card" />
          </div>

          <div className="form-group">
            <label className="form-label">Card Number</label>
            <div className="form-input-wrapper">
              <input type="text" className="form-input" placeholder="0000 0000 0000 0000" maxLength={19} />
              <span className="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
              </span>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="text" className="form-input" placeholder="MM/YY" maxLength={5} />
            </div>
            <div className="form-group">
              <label className="form-label">CVV</label>
              <div className="form-input-wrapper">
                <input type="text" className="form-input" placeholder="123" maxLength={4} />
                <span className="input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </span>
              </div>
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

        {/* Pay Button */}
        <div className="pay-button-wrapper">
          <button className="pay-button">Pay Now · ₹14,900</button>
        </div>
      </div>
    </div>
  );
};

export default App;
