import { useState, useEffect } from 'react';
import { Modal, Input, Button, Alert, message, Typography } from 'antd';
import { CheckOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';

const { Text } = Typography;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedCard {
  cardId: string;
  bankName: string;
  lastFour: string;
  cardholderLabel: string;
  isDefault?: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_SAVED_CARDS: SavedCard[] = [
  { cardId: 'card-001', bankName: 'HDFC', lastFour: '4521', cardholderLabel: 'Ops Team card', isDefault: true },
  { cardId: 'card-002', bankName: 'ICICI', lastFour: '8834', cardholderLabel: 'Farouk Patel' },
  { cardId: 'card-003', bankName: 'SBI', lastFour: '2209', cardholderLabel: 'Finance card' },
  { cardId: 'card-004', bankName: 'Axis', lastFour: '7761', cardholderLabel: 'Priya Sharma' },
  { cardId: 'card-005', bankName: 'Yes Bank', lastFour: '3345', cardholderLabel: 'Admin card' },
];

const BANK_COLORS: Record<string, { bg: string; text: string }> = {
  'HDFC':     { bg: '#E8F5E9', text: '#2E7D32' },
  'ICICI':    { bg: '#FFF3E0', text: '#E65100' },
  'SBI':      { bg: '#E3F2FD', text: '#1565C0' },
  'Axis':     { bg: '#EDE7F6', text: '#4527A0' },
  'Yes Bank': { bg: '#FCE4EC', text: '#880E4F' },
};

function bankColors(name: string) {
  return BANK_COLORS[name] ?? { bg: '#F5F5F5', text: '#666' };
}

// ─── Card helpers (unchanged from previous version) ───────────────────────────

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
  if (brand === 'amex') {
    return digits.slice(0, 4)
      + (digits.length > 4  ? ' ' + digits.slice(4, 10)  : '')
      + (digits.length > 10 ? ' ' + digits.slice(10, 15) : '');
  }
  return digits.match(/.{1,4}/g)?.join(' ') ?? digits;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function BankBadge({ bankName }: { bankName: string }) {
  const { bg, text } = bankColors(bankName);
  const abbr = bankName.length > 4 ? bankName.slice(0, 4) : bankName;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: bg, color: text,
      borderRadius: 4, padding: '1px 6px',
      fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      {abbr.toUpperCase()}
    </span>
  );
}

function SavedCardRow({
  card, isSelected, onClick,
}: { card: SavedCard; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '9px 12px', cursor: 'pointer', borderRadius: 4,
        background: isSelected ? '#E6F4FF' : 'transparent',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#F7F7F7'; }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      <BankBadge bankName={card.bankName} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#1a1a1a', fontWeight: isSelected ? 500 : 400 }}>
          {card.bankName} ···· {card.lastFour}
        </div>
        <div style={{ fontSize: 11, color: '#888' }}>{card.cardholderLabel}</div>
      </div>
      {isSelected
        ? <CheckOutlined style={{ color: '#1677FF', fontSize: 13, flexShrink: 0 }} />
        : <div style={{ width: 13 }} />}
    </div>
  );
}

// ─── Props (unchanged interface so OrderDetail.tsx needs no edits) ────────────

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

// ─── Main modal ───────────────────────────────────────────────────────────────

export default function CardModal({
  open, existingLast4, existingCardholderName, travellerName, onClose, onSave,
}: CardModalProps) {
  const savedCards = MOCK_SAVED_CARDS;
  const hasSavedCards = savedCards.length > 0;

  // derive current card from existingLast4
  const resolveCurrentCardId = () =>
    savedCards.find(c => c.lastFour === existingLast4)?.cardId ?? null;

  type Mode = 'dropdown_closed' | 'dropdown_open' | 'new_card_form';

  const [mode, setMode] = useState<Mode>(() =>
    hasSavedCards ? 'dropdown_closed' : 'new_card_form'
  );
  const [currentCardId] = useState<string | null>(resolveCurrentCardId);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(resolveCurrentCardId);

  // new-card form fields
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry]         = useState('');
  const [cvv, setCvv]               = useState('');
  const [holderName, setHolderName] = useState('');
  const [cardError, setCardError]   = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [saving, setSaving]         = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  // reset on open
  useEffect(() => {
    if (open) {
      const cId = resolveCurrentCardId();
      setSelectedCardId(cId);
      setMode(hasSavedCards ? 'dropdown_closed' : 'new_card_form');
      setCardNumber(''); setExpiry(''); setCvv('');
      setHolderName(existingCardholderName);
      setCardError(''); setExpiryError('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selectedCard = savedCards.find(c => c.cardId === selectedCardId) ?? null;
  const isChanged    = selectedCardId !== currentCardId;
  const showWarning  = isChanged && selectedCardId !== null && mode === 'dropdown_closed';

  // new-card form validation
  const brand      = detectBrand(cardNumber);
  const isAmex     = brand === 'amex';
  const maxCardLen = isAmex ? 17 : 19;
  const maxCvv     = isAmex ? 4 : 3;
  const newCardValid =
    mode === 'new_card_form' &&
    cardNumber.replace(/\D/g, '').length >= (isAmex ? 15 : 16) &&
    expiry.replace(/\D/g, '').length === 4 &&
    cvv.length >= (isAmex ? 4 : 3) &&
    holderName.trim().length > 0 &&
    !cardError && !expiryError;

  // derived button
  const primaryLabel   = mode === 'new_card_form' ? 'Save card' : 'Assign card';
  const primaryEnabled = mode === 'new_card_form'
    ? newCardValid
    : (selectedCardId !== null && isChanged);

  function handleCardChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, isAmex ? 15 : 16);
    setCardNumber(formatCard(digits, detectBrand(digits)));
    setCardError('');
  }
  function handleCardBlur() {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length > 0 && !luhn(digits)) setCardError("Card number doesn't look right");
  }
  function handleExpiryChange(raw: string) {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setExpiry(digits.length > 2 ? digits.slice(0, 2) + ' / ' + digits.slice(2) : digits);
    setExpiryError('');
  }
  function handleExpiryBlur() {
    const digits = expiry.replace(/\D/g, '');
    if (digits.length < 4) return;
    const month = parseInt(digits.slice(0, 2), 10);
    const year  = 2000 + parseInt(digits.slice(2, 4), 10);
    const now   = new Date();
    if (month < 1 || month > 12) { setExpiryError('Invalid month'); return; }
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
      setExpiryError('Card has expired');
    }
  }

  function collapseNewCardForm() {
    setMode('dropdown_closed');
    setCardNumber(''); setExpiry(''); setCvv(''); setHolderName('');
    setCardError(''); setExpiryError('');
  }

  async function handlePrimary() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    if (mode === 'new_card_form') {
      const last4 = cardNumber.replace(/\D/g, '').slice(-4);
      onSave(last4, holderName.trim(), brand);
      messageApi.success('Card saved');
    } else if (selectedCard) {
      onSave(selectedCard.lastFour, selectedCard.cardholderLabel, 'unknown');
      messageApi.success('Card assigned');
    }
    onClose();
  }

  // ── Closed-field header (shown in all modes) ──────────────────────────────
  const isNewCardMode = mode === 'new_card_form';
  const headerText = isNewCardMode
    ? 'Adding a new card'
    : selectedCard
      ? `${selectedCard.bankName} ···· ${selectedCard.lastFour}`
      : 'Select a card';

  const headerSubline = isNewCardMode
    ? null
    : selectedCard && isChanged
      ? (
        <span style={{ color: '#1677FF', fontSize: 11 }}>
          {selectedCard.cardholderLabel}
          {currentCardId && existingLast4 ? ` · changing from ····${existingLast4}` : ''}
        </span>
      )
      : selectedCard
        ? <span style={{ fontSize: 11, color: '#888' }}>{selectedCard.cardholderLabel}</span>
        : <span style={{ fontSize: 11, color: '#aaa' }}>No card selected</span>;

  const handleHeaderClick = () => {
    if (mode === 'dropdown_open')   { setMode('dropdown_closed'); return; }
    if (mode === 'dropdown_closed') { if (hasSavedCards) setMode('dropdown_open'); return; }
    if (mode === 'new_card_form')   { collapseNewCardForm(); if (hasSavedCards) setMode('dropdown_open'); }
  };

  // brand badge for new-card mode header
  const brandLabel = detectBrand(cardNumber) === 'visa' ? 'VISA'
    : detectBrand(cardNumber) === 'mastercard' ? 'MC'
    : detectBrand(cardNumber) === 'amex' ? 'AMEX' : null;

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
          <Button
            key="primary"
            type="primary"
            disabled={!primaryEnabled}
            loading={saving}
            onClick={handlePrimary}
          >
            {primaryLabel}
          </Button>,
        ]}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
          {/* Saving-for label */}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Saving for: <strong>{travellerName}</strong>
          </Text>

          {/* ── Card selector ──────────────────────────────────────────────── */}
          <div style={{
            border: '1px solid #d9d9d9',
            borderRadius: 6,
            overflow: 'hidden',
            boxShadow: mode === 'dropdown_open' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'box-shadow 0.15s',
          }}>
            {/* Closed field / header row */}
            <div
              onClick={handleHeaderClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', cursor: 'pointer',
                background: mode === 'dropdown_open' ? '#FAFAFA' : '#FFF',
                userSelect: 'none',
              }}
            >
              {isNewCardMode && brandLabel
                ? <span style={{
                    fontSize: 9, fontWeight: 700, background: '#F5F5F5', color: '#555',
                    padding: '1px 6px', borderRadius: 4,
                  }}>{brandLabel}</span>
                : selectedCard && !isNewCardMode
                  ? <BankBadge bankName={selectedCard.bankName} />
                  : <div style={{ width: 28 }} />}

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13,
                  color: isNewCardMode ? '#888' : '#1a1a1a',
                  fontStyle: isNewCardMode ? 'italic' : 'normal',
                }}>
                  {headerText}
                </div>
                {headerSubline}
              </div>

              <DownOutlined style={{
                fontSize: 11, color: '#999',
                transform: mode === 'dropdown_open' ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                flexShrink: 0,
              }} />
            </div>

            {/* Open dropdown list */}
            <div style={{
              display: 'grid',
              gridTemplateRows: mode === 'dropdown_open' ? '1fr' : '0fr',
              transition: 'grid-template-rows 200ms ease-out, opacity 200ms ease-out',
              opacity: mode === 'dropdown_open' ? 1 : 0,
            }}>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  borderTop: '1px solid #f0f0f0',
                  padding: '4px',
                  background: '#FAFAFA',
                }}>
                  {savedCards.map(card => (
                    <SavedCardRow
                      key={card.cardId}
                      card={card}
                      isSelected={card.cardId === selectedCardId}
                      onClick={() => {
                        setSelectedCardId(card.cardId);
                        setMode('dropdown_closed');
                      }}
                    />
                  ))}

                  {/* "Use a different card" row */}
                  <div
                    onClick={() => { setMode('new_card_form'); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px', cursor: 'pointer',
                      borderTop: '1px solid #e8e8e8', marginTop: 4,
                      color: '#1677FF',
                      borderRadius: 4,
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#F0F7FF'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    <PlusOutlined style={{ fontSize: 11 }} />
                    <span style={{ fontSize: 13 }}>Use a different card</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── New-card form (animated expand below the field) ─────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateRows: isNewCardMode ? '1fr' : '0fr',
            transition: 'grid-template-rows 220ms ease-out, opacity 220ms ease-out',
            opacity: isNewCardMode ? 1 : 0,
          }}>
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                borderTop: '1px dashed #d9d9d9',
                paddingTop: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}>
                {/* Card number */}
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>Card number</div>
                  <Input
                    value={cardNumber}
                    maxLength={maxCardLen}
                    onChange={e => handleCardChange(e.target.value)}
                    onBlur={handleCardBlur}
                    onPaste={e => {
                      e.preventDefault();
                      handleCardChange(e.clipboardData.getData('text').replace(/[\s-]/g, ''));
                    }}
                    placeholder="1234 5678 9012 3456"
                    status={cardError ? 'error' : undefined}
                  />
                  {cardError && <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3 }}>{cardError}</div>}
                </div>

                {/* Expiry + CVV */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>Expiry</div>
                    <Input
                      value={expiry}
                      onChange={e => handleExpiryChange(e.target.value)}
                      onBlur={handleExpiryBlur}
                      placeholder="MM / YY"
                      maxLength={7}
                      status={expiryError ? 'error' : undefined}
                    />
                    {expiryError && <div style={{ fontSize: 11, color: '#ff4d4f', marginTop: 3 }}>{expiryError}</div>}
                  </div>
                  <div>
                    <div style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>CVV</div>
                    <Input.Password
                      value={cvv}
                      onChange={e => setCvv(e.target.value.replace(/\D/g, '').slice(0, maxCvv))}
                      placeholder="CVV"
                      maxLength={maxCvv}
                      style={{ width: 88 }}
                      visibilityToggle={false}
                    />
                  </div>
                </div>

                {/* Cardholder name */}
                <div>
                  <div style={{ marginBottom: 4, fontSize: 12, color: '#555' }}>Cardholder name</div>
                  <Input
                    value={holderName}
                    onChange={e => setHolderName(e.target.value)}
                    placeholder="Name on card"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* Back to saved cards */}
                {hasSavedCards && (
                  <button
                    onClick={collapseNewCardForm}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#1677FF', fontSize: 12, padding: 0,
                      textAlign: 'left', width: 'fit-content',
                    }}
                  >
                    ← Back to saved cards
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Warning strip ──────────────────────────────────────────────── */}
          {showWarning && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '8px 12px',
              background: '#FFFBF0',
              border: '1px solid #FAAD14',
              borderRadius: 6,
              fontSize: 12,
              color: '#7A4A00',
              lineHeight: 1.5,
            }}>
              <span style={{ fontSize: 14, marginTop: 1 }}>⚠</span>
              <span>
                This will replace the card currently on file for <strong>{travellerName}</strong>.
                No charge happens until submission.
              </span>
            </div>
          )}

          {/* ── Encrypted-storage note (unchanged) ────────────────────────── */}
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
