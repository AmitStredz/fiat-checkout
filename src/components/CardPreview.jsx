import './CardPreview.css';

const CardPreview = ({ cardNumber, cardholderName, expiry, cvv, cardType, isFlipped }) => {
  const formatDisplayNumber = () => {
    const digits = cardNumber.replace(/\s/g, '');
    const template = cardType === 'amex' ? '•••• •••••• •••••' : '•••• •••• •••• ••••';
    let result = '';
    let dIdx = 0;
    for (let i = 0; i < template.length; i++) {
      if (template[i] === '•') {
        result += dIdx < digits.length ? digits[dIdx] : '•';
        dIdx++;
      } else {
        result += ' ';
      }
    }
    return result;
  };

  const gradients = {
    visa: 'linear-gradient(135deg, #1a1f71 0%, #2e4da7 100%)',
    mastercard: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    amex: 'linear-gradient(135deg, #006fcf 0%, #00aeef 100%)',
    discover: 'linear-gradient(135deg, #4a1a6b 0%, #7c3aed 100%)',
    jcb: 'linear-gradient(135deg, #1a472a 0%, #2d6a4f 100%)',
    diners: 'linear-gradient(135deg, #004e92 0%, #000428 100%)',
    unionpay: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)',
  };

  const gradient = gradients[cardType] || 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)';

  const typeLabel = {
    visa: 'VISA',
    mastercard: 'MasterCard',
    amex: 'AMEX',
    discover: 'DISCOVER',
    jcb: 'JCB',
    diners: 'Diners',
    unionpay: 'UnionPay',
  };

  return (
    <div className="card-preview-container">
      <div className={`card-preview ${isFlipped ? 'card-preview--flipped' : ''}`}>
        <div className="card-preview__inner">
          <div className="card-preview__front" style={{ background: gradient }}>
            <div className="card-preview__row-top">
              <div className="card-preview__chip">
                <svg viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="48" height="38" rx="5" fill="#d4a73a" stroke="#c49a2f" strokeWidth="1"/>
                  <line x1="1" y1="14" x2="49" y2="14" stroke="#b8941f" strokeWidth="0.8"/>
                  <line x1="1" y1="26" x2="49" y2="26" stroke="#b8941f" strokeWidth="0.8"/>
                  <line x1="18" y1="1" x2="18" y2="14" stroke="#b8941f" strokeWidth="0.8"/>
                  <line x1="32" y1="1" x2="32" y2="14" stroke="#b8941f" strokeWidth="0.8"/>
                  <line x1="18" y1="26" x2="18" y2="39" stroke="#b8941f" strokeWidth="0.8"/>
                  <line x1="32" y1="26" x2="32" y2="39" stroke="#b8941f" strokeWidth="0.8"/>
                </svg>
              </div>
              <div className="card-preview__contactless">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z" fill="rgba(255,255,255,0.6)"/>
                  <path d="M8.5 8.2c2-2 5-2 7 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M6.5 6c3-3 8-3 11 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M10.5 10.5c1-1 2.5-1 3.5 0" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            </div>

            <div className="card-preview__number">
              {formatDisplayNumber()}
            </div>

            <div className="card-preview__row-bottom">
              <div className="card-preview__info">
                <span className="card-preview__label">CARD HOLDER</span>
                <span className="card-preview__value card-preview__name">
                  {cardholderName.trim().toUpperCase() || 'YOUR NAME'}
                </span>
              </div>
              <div className="card-preview__info card-preview__info--right">
                <span className="card-preview__label">EXPIRES</span>
                <span className="card-preview__value">{expiry || 'MM/YY'}</span>
              </div>
              {cardType && (
                <span className="card-preview__brand">{typeLabel[cardType]}</span>
              )}
            </div>
          </div>

          <div className="card-preview__back" style={{ background: gradient }}>
            <div className="card-preview__magnetic" />
            <div className="card-preview__sig-section">
              <div className="card-preview__sig-strip">
                <div className="card-preview__sig-lines" />
              </div>
              <div className="card-preview__cvv-display">
                {cvv || '•••'}
              </div>
            </div>
            <div className="card-preview__back-bottom">
              <p className="card-preview__disclaimer">
                Authorized use only. This card remains the property of the issuing bank.
              </p>
              {cardType && (
                <span className="card-preview__brand card-preview__brand--back">
                  {typeLabel[cardType]}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
