import { useState, useEffect } from 'react';
import { Modal, Input, Button, Alert, message, Typography } from 'antd';

const { Text } = Typography;

function luhn(num: string): boolean {
  const digits = num.replace(/\D/g, '');
  let sum = 0;
  let odd = true;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (!odd) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    odd = !odd;
  }
  return sum % 10 === 0;
}

function detectBrand(num: string): 'visa' | 'mastercard' | 'amex' | 'unknown' {
  const d = num.replace(/\D/g, '');
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5')) return 'mastercard';
  if (d.startsWith('3')) return 'amex';
  return 'unknown';
}

function formatCard(raw: string, brand: 'visa' | 'mastercard' | 'amex' | 'unknown'): string {
  const digits = raw.replace(/\D/g, '');
  const isAmex = brand === 'amex';
  if (isAmex) {
    // 4-6-5 format
    return digits.slice(0, 4) + (digits.length > 4 ? ' ' + digits.slice(4, 10) : '') + (digits.length > 10 ? ' ' + digits.slice(10, 15) : '');
  }
  // 4-4-4-4 format
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

interface CardModalProps {
  open: boolean;
  existingLast4: string;
  existingCardholderName: string;
  orderId: string;
  travellerId: string;
  travellerName: string;
  onClose: () => void;
  onSave: (last4: string, cardholderName: string, brand: string) => void;
}

export default function CardModal({ open, existingLast4, existingCardholderName, travellerName, onClose, onSave }: CardModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');
  const [cardError, setCardError] = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const brand = detectBrand(cardNumber);
  const isAmex = brand === 'amex';
  const maxCardLen = isAmex ? 17 : 19; // with spaces
  const maxCvv = isAmex ? 4 : 3;

  useEffect(() => {
    if (open) {
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setName(existingCardholderName);
      setCardError('');
      setExpiryError('');
    }
  }, [open, existingCardholderName]);

  function handleCardChange(raw: string) {
    // Strip and reformat
    const digits = raw.replace(/\D/g, '').slice(0, isAmex ? 15 : 16);
    const formatted = formatCard(digits, brand);
    setCardNumber(formatted);
    setCardError('');
  }

  function handleCardBlur() {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length > 0 && !luhn(digits)) {
      setCardError("Card number doesn't look right");
    } else {
      setCardError('');
    }
  }

  function handleExpiryChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    let formatted = digits;
    if (digits.length > 2) formatted = digits.slice(0, 2) + ' / ' + digits.slice(2);
    setExpiry(formatted);
    setExpiryError('');
  }

  function handleExpiryBlur() {
    const digits = expiry.replace(/\D/g, '');
    if (digits.length < 4) return;
    const month = parseInt(digits.slice(0, 2), 10);
    const year = 2000 + parseInt(digits.slice(2, 4), 10);
    const now = new Date();
    if (month < 1 || month > 12) { setExpiryError('Invalid month'); return; }
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      setExpiryError('Card has expired');
    }
  }

  const canSave = cardNumber.replace(/\D/g, '').length >= (isAmex ? 15 : 16)
    && expiry.replace(/\D/g, '').length === 4
    && cvv.length >= 3
    && name.trim().length > 0
    && !cardError
    && !expiryError;

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    const digits = cardNumber.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    onSave(last4, name.trim(), brand);
    messageApi.success('Card saved');
    onClose();
  }

  const brandLabel = brand === 'visa' ? 'VISA' : brand === 'mastercard' ? 'MC' : brand === 'amex' ? 'AMEX' : 'Card';
  const cardPrefix = (
    <span style={{ fontSize: 10, fontWeight: 700, color: brand === 'visa' ? '#1A1A8F' : brand === 'mastercard' ? '#CC0000' : brand === 'amex' ? '#2E77BC' : '#888886', letterSpacing: '0.5px' }}>
      {brandLabel}
    </span>
  );

  return (
    <>
      {contextHolder}
      <Modal
        title={existingLast4 ? 'Edit card details' : 'Add card details'}
        open={open}
        onCancel={onClose}
        width={440}
        centered
        maskClosable={false}
        destroyOnClose
        footer={[
          <Button key="cancel" onClick={onClose}>Cancel</Button>,
          <Button key="save" type="primary" disabled={!canSave} loading={saving} onClick={handleSave}>
            Save card
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Saving for: <strong>{travellerName}</strong>
            {existingLast4 && <span style={{ marginLeft: 8 }}>Current: ···{existingLast4}</span>}
          </Text>

          {/* Card number */}
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Card number</div>
            <Input
              autoFocus
              prefix={cardPrefix}
              value={cardNumber}
              maxLength={maxCardLen}
              onChange={e => handleCardChange(e.target.value)}
              onBlur={handleCardBlur}
              onPaste={e => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text').replace(/[\s-]/g, '');
                handleCardChange(pasted);
              }}
              placeholder="1234 5678 9012 3456"
              status={cardError ? 'error' : undefined}
            />
            {cardError && <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 4 }}>{cardError}</div>}
          </div>

          {/* Expiry + CVV row */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Expiry</div>
              <Input
                value={expiry}
                onChange={e => handleExpiryChange(e.target.value)}
                onBlur={handleExpiryBlur}
                placeholder="MM / YY"
                maxLength={7}
                style={{ width: 120 }}
                status={expiryError ? 'error' : undefined}
              />
              {expiryError && <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 4 }}>{expiryError}</div>}
            </div>
            <div>
              <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>CVV</div>
              <Input.Password
                value={cvv}
                onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, maxCvv))}
                placeholder="CVV"
                maxLength={maxCvv}
                style={{ width: 80 }}
                visibilityToggle={false}
              />
            </div>
          </div>

          {/* Cardholder name */}
          <div>
            <div style={{ marginBottom: 4, fontSize: 12, color: '#666' }}>Cardholder name</div>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Name on card"
              style={{ textTransform: 'uppercase' }}
            />
          </div>

          <Alert
            type="info"
            showIcon
            message="Card details are stored encrypted and only used to process the embassy visa fee. Do not enter personal cards."
            style={{ fontSize: 11 }}
          />
        </div>
      </Modal>
    </>
  );
}
