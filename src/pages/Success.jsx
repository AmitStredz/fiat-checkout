import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Success.css';

const REDIRECT_SECONDS = 15;

const Success = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const urlTransactionId = searchParams.get('transactionId');
  const stateTxn = state?.transaction;

  const txn = stateTxn || (urlTransactionId ? {
    transaction_Id: urlTransactionId,
    message: 'Payment completed successfully.',
    success: true,
  } : null);

  useEffect(() => {
    if (!txn) navigate('/', { replace: true });
  }, [txn, navigate]);

  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    if (!txn) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [txn, navigate]);

  const truncateId = (id) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 5)}...${id.slice(-5)}`;
  };

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadReceipt = () => {
    const date = txn.created_at ? new Date(txn.created_at).toLocaleString() : new Date().toLocaleString();
    const receipt = [
      '═══════════════════════════════',
      '        PAYMENT RECEIPT        ',
      '═══════════════════════════════',
      '',
      `Transaction ID : ${txn.transaction_Id || 'N/A'}`,
      `Date           : ${date}`,
      `Amount         : ₹14,900`,
      `Status         : Successful`,
      `Paid To        : ${txn.to || 'N/A'}`,
      `Item           : Premium Wireless Headphones`,
      '',
      '───────────────────────────────',
      '  Subtotal      : ₹12,627',
      '  GST (18%)     : ₹2,273',
      '  Total         : ₹14,900',
      '───────────────────────────────',
      '',
      '  Thank you for your purchase!',
      '',
      '═══════════════════════════════',
    ].join('\n');

    const blob = new Blob([receipt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${(txn.transaction_Id || 'payment').slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!txn) return null;

  const progress = ((REDIRECT_SECONDS - countdown) / REDIRECT_SECONDS) * 100;

  return (
    <div className="success-wrapper">
      <div className="success-container">
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
              <span className="success-value txn-id-value">
                {truncateId(txn.transaction_Id)}
                <button
                  className="copy-btn"
                  onClick={() => handleCopy(txn.transaction_Id)}
                  title="Copy full ID"
                  aria-label="Copy transaction ID"
                >
                  {copied ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="#22c55e" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="14" height="14">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3a2.25 2.25 0 00-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                    </svg>
                  )}
                </button>
              </span>
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

        <div className="success-actions">
          <button className="receipt-btn" onClick={downloadReceipt}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="18" height="18">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download Receipt
          </button>

          <button className="success-home-btn" onClick={() => navigate('/')}>
            Back to Home
          </button>
        </div>

        <div className="countdown-section">
          <div className="countdown-bar">
            <div className="countdown-progress" style={{ width: `${progress}%` }} />
          </div>
          <span className="countdown-text">Redirecting in {countdown}s</span>
        </div>
      </div>
    </div>
  );
};

export default Success;
