import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import './Success.css';

const Success = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const txn = state?.transaction;

  // Guard: if someone lands here without transaction data, send them home
  useEffect(() => {
    if (!txn) navigate('/', { replace: true });
  }, [txn, navigate]);

  if (!txn) return null;

  return (
    <div className="success-wrapper">
      <div className="success-container">
        {/* Animated check icon */}
        <div className="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="success-heading">Payment Successful!</h1>
        <p className="success-message">{txn.message}</p>

        <div className="success-details">
          {txn.transaction_Id && (
            <div className="success-row">
              <span className="success-label">Transaction ID</span>
              <span className="success-value">{txn.transaction_Id}</span>
            </div>
          )}
          {txn.to && (
            <div className="success-row">
              <span className="success-label">Paid To</span>
              <span className="success-value">{txn.to}</span>
            </div>
          )}
          <div className="success-row">
            <span className="success-label">Amount</span>
            <span className="success-value success-amount">₹14,900</span>
          </div>
          {txn.created_at && (
            <div className="success-row">
              <span className="success-label">Date</span>
              <span className="success-value">{new Date(txn.created_at).toLocaleString()}</span>
            </div>
          )}
        </div>

        <button className="success-home-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default Success;
