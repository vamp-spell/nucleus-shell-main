import { useState } from 'react';
import {
  Segmented, Input, Button, Divider, Tooltip, message,
  ConfigProvider, theme, Tag,
} from 'antd';
import {
  InboxOutlined, FileExclamationOutlined, ShoppingCartOutlined,
  PlusOutlined, SendOutlined, SearchOutlined,
  BoldOutlined, ItalicOutlined, LinkOutlined, PaperClipOutlined,
  MailOutlined,
} from '@ant-design/icons';
import {
  TEMPLATES, TEMPLATE_BODIES, TEMPLATE_ICON_COLORS, getMockHistory, getMockSuggestion,
  type CommHistoryItem,
} from '../data/comms';

const { useToken } = theme;

const TEMPLATE_ICONS: Record<string, React.ReactNode> = {
  package: <InboxOutlined />,
  file_exclamation: <FileExclamationOutlined />,
  shopping_cart: <ShoppingCartOutlined />,
};

// Resolve template variables from order data
function resolveVariables(
  text: string,
  vars: Record<string, string>
): string {
  return text.replace(/{{(\w+)}}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

interface CommsTabProps {
  orderId: string;
  orderCountry: string;
  orderAgency: string;
  orderTravelDates: string;
}

export default function CommsTab(props: CommsTabProps) {
  return (
    <ConfigProvider>
      <CommsTabInner {...props} />
    </ConfigProvider>
  );
}

function CommsTabInner({ orderId, orderCountry, orderAgency, orderTravelDates }: CommsTabProps) {
  const { token } = useToken();
  const [messageApi, contextHolder] = message.useMessage();

  // Left panel state
  const [leftPanel, setLeftPanel] = useState<'Templates' | 'History'>('Templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedHistoryItemId, setSelectedHistoryItemId] = useState<string | null>(null);

  // Right panel compose state
  const [recipients, setRecipients] = useState<string[]>(['agent@travelagency.com']);
  const [cc, setCc] = useState<string[]>(['ops@stampmyvisa.com']);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [recipientInput, setRecipientInput] = useState('');
  const [ccInput, setCcInput] = useState('');
  const [showRecipientInput, setShowRecipientInput] = useState(false);
  const [showCcInput, setShowCcInput] = useState(false);

  // View mode
  const [rightPanel, setRightPanel] = useState<'empty' | 'compose' | 'view'>('empty');

  // History
  const [history, setHistory] = useState<CommHistoryItem[]>(() => getMockHistory(orderId));
  const suggestion = getMockSuggestion(orderId);

  // Template variables
  const baseVars: Record<string, string> = {
    ta_name: orderAgency,
    order_id: orderId,
    country: orderCountry,
    travel_dates: orderTravelDates,
    estimate_id: 'EST-' + orderId.split('-').pop(),
    pendency_list: '• Passport copy (clear scan)\n• Photograph (white background)',
  };

  function loadTemplate(templateId: string) {
    const tmpl = TEMPLATE_BODIES[templateId];
    if (!tmpl) return;
    setSelectedTemplateId(templateId);
    setIsCustom(false);
    setSelectedHistoryItemId(null);
    setSubject(resolveVariables(tmpl.subject, baseVars));
    setBody(resolveVariables(tmpl.body, baseVars));
    setRightPanel('compose');
  }

  function loadCustom() {
    setSelectedTemplateId(null);
    setIsCustom(true);
    setSelectedHistoryItemId(null);
    setSubject('');
    setBody('');
    setRightPanel('compose');
  }

  function discard() {
    setSelectedTemplateId(null);
    setIsCustom(false);
    setSubject('');
    setBody('');
    setRightPanel('empty');
  }

  function selectHistoryItem(item: CommHistoryItem) {
    setSelectedHistoryItemId(item.id);
    setRightPanel('view');
    setSelectedTemplateId(null);
    setIsCustom(false);
  }

  async function sendEmail() {
    if (recipients.length === 0) {
      messageApi.error('Add at least one recipient');
      return;
    }
    if (!subject.trim()) {
      messageApi.error('Subject cannot be empty');
      return;
    }
    setIsSending(true);
    await new Promise(r => setTimeout(r, 900));
    // Optimistic add
    const newItem: CommHistoryItem = {
      id: 'ch-' + Date.now(),
      type: 've_sent',
      templateId: selectedTemplateId,
      templateName: selectedTemplateId
        ? (TEMPLATES.find(t => t.id === selectedTemplateId)?.name ?? 'Template')
        : 'Custom message',
      sender: 'You',
      senderEmail: 'you@stampmyvisa.com',
      recipients,
      cc,
      subject,
      body,
      sentAt: 'Just now',
      sentAtDate: new Date(),
      status: 'delivered',
    };
    setHistory(prev => [newItem, ...prev]);
    messageApi.success(`Email sent to ${recipients[0]}`);
    setIsSending(false);
    discard();
    setLeftPanel('History');
  }

  const selectedHistoryItem = history.find(h => h.id === selectedHistoryItemId);
  const filteredHistory = history.filter(h =>
    !historySearch ||
    h.templateName.toLowerCase().includes(historySearch.toLowerCase()) ||
    h.sender.toLowerCase().includes(historySearch.toLowerCase())
  );

  // ─── Layout ───────────────────────────────────────────────────────────────
  return (
    <>
      {contextHolder}
      <div style={{ display: 'flex', height: '100%', minHeight: 0, overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{
          width: 260,
          flexShrink: 0,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Toggle header */}
          <div style={{
            padding: '10px 10px 8px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <Segmented
              size="small"
              value={leftPanel}
              onChange={v => setLeftPanel(v as 'Templates' | 'History')}
              options={['Templates', 'History']}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: token.colorSuccess }} />
              <span style={{ fontSize: 10, color: token.colorSuccess }}>Gmail connected</span>
            </div>
          </div>

          {/* List area — scrollable */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 4px' }}>
            {leftPanel === 'Templates' ? (
              <>
                {/* Suggested template */}
                {suggestion && (
                  <>
                    <div style={{ fontSize: 10, color: token.colorTextTertiary, fontWeight: 500, marginBottom: 4, paddingLeft: 2, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Suggested</div>
                    <div
                      onClick={() => loadTemplate(suggestion.templateId)}
                      style={{
                        background: token.colorWarningBg,
                        border: `1px solid ${token.colorWarningBorder}`,
                        borderRadius: token.borderRadius,
                        padding: '8px 10px',
                        marginBottom: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 16, color: token.colorWarning, flexShrink: 0, marginTop: 1 }}>
                        {TEMPLATE_ICONS[TEMPLATES.find(t => t.id === suggestion.templateId)?.icon ?? '']}
                      </span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: token.colorTextBase, marginBottom: 2 }}>
                          {TEMPLATES.find(t => t.id === suggestion.templateId)?.name}
                        </div>
                        <div style={{ fontSize: 10, color: token.colorWarning }}>{suggestion.reason}</div>
                      </div>
                    </div>
                    <Divider style={{ margin: '4px 0 8px' }} />
                  </>
                )}

                {/* Template list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {TEMPLATES.map(tmpl => {
                    const colors = TEMPLATE_ICON_COLORS[tmpl.category];
                    const isActive = selectedTemplateId === tmpl.id;
                    return (
                      <div
                        key={tmpl.id}
                        onClick={() => loadTemplate(tmpl.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '9px 10px',
                          borderRadius: token.borderRadius,
                          border: `1px solid ${isActive ? token.colorPrimary : token.colorBorderSecondary}`,
                          background: isActive ? token.colorPrimaryBg : 'white',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary; }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'white'; }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: colors.bg, color: colors.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, flexShrink: 0,
                        }}>
                          {TEMPLATE_ICONS[tmpl.icon]}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 500, color: token.colorTextBase }}>{tmpl.name}</div>
                          <div style={{ fontSize: 10, color: token.colorTextTertiary, marginTop: 1 }}>{tmpl.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Divider style={{ margin: '10px 0 6px' }} />

                {/* Custom message */}
                <div
                  onClick={loadCustom}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 10px',
                    borderRadius: token.borderRadius,
                    border: `1px dashed ${token.colorBorderSecondary}`,
                    cursor: 'pointer',
                    color: token.colorTextSecondary,
                    fontSize: 12,
                    transition: 'background 0.15s',
                    background: isCustom ? token.colorFillSecondary : 'transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isCustom ? token.colorFillSecondary : 'transparent'; }}
                >
                  <PlusOutlined style={{ fontSize: 12 }} />
                  Write custom message
                </div>
              </>
            ) : (
              /* History mode */
              <>
                <div style={{ marginBottom: 8 }}>
                  <Input
                    size="small"
                    prefix={<SearchOutlined style={{ fontSize: 11, color: token.colorTextTertiary }} />}
                    placeholder="Search history"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    style={{ fontSize: 11 }}
                    allowClear
                  />
                </div>
                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 8px', color: token.colorTextTertiary, fontSize: 11 }}>
                    <MailOutlined style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                    No emails sent yet.
                    <br />
                    <span
                      style={{ color: token.colorPrimary, cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => setLeftPanel('Templates')}
                    >
                      Choose a template
                    </span>
                    {' '}to get started.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {filteredHistory.map(item => {
                      const isActive = selectedHistoryItemId === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => selectHistoryItem(item)}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            borderRadius: token.borderRadius,
                            background: isActive ? token.colorFillTertiary : 'transparent',
                            borderLeft: isActive ? `2px solid ${token.colorPrimary}` : '2px solid transparent',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary; }}
                          onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <Tag
                              style={{
                                fontSize: 9, fontWeight: 600, padding: '0 4px', margin: 0,
                                background: item.type === 've_sent' ? token.colorInfoBg : token.colorSuccessBg,
                                color: item.type === 've_sent' ? token.colorInfo : token.colorSuccess,
                                border: 'none', lineHeight: '16px',
                              }}
                            >
                              {item.type === 've_sent' ? 'VE' : 'TA'}
                            </Tag>
                            <span style={{ fontSize: 11, fontWeight: 500, color: token.colorTextBase, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.templateName}
                            </span>
                            <span style={{ fontSize: 10, color: token.colorTextTertiary, flexShrink: 0 }}>{item.sentAt}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 10, color: token.colorTextSecondary }}>{item.sender}</span>
                            {item.type === 've_sent' && (
                              <div style={{
                                width: 6, height: 6, borderRadius: '50%',
                                background: item.status === 'delivered' ? token.colorSuccess : item.status === 'failed' ? token.colorError : token.colorTextQuaternary,
                                marginLeft: 'auto',
                              }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {rightPanel === 'empty' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: token.colorTextTertiary }}>
              <MailOutlined style={{ fontSize: 32, marginBottom: 12 }} />
              <div style={{ fontSize: 13, marginBottom: 4 }}>Choose a template from the left panel</div>
              <div style={{ fontSize: 11 }}>or write a custom message</div>
            </div>
          )}

          {rightPanel === 'compose' && (
            <ComposePanel
              token={token}
              recipients={recipients}
              setRecipients={setRecipients}
              cc={cc}
              setCc={setCc}
              subject={subject}
              setSubject={setSubject}
              body={body}
              setBody={setBody}
              recipientInput={recipientInput}
              setRecipientInput={setRecipientInput}
              ccInput={ccInput}
              setCcInput={setCcInput}
              showRecipientInput={showRecipientInput}
              setShowRecipientInput={setShowRecipientInput}
              showCcInput={showCcInput}
              setShowCcInput={setShowCcInput}
              isSending={isSending}
              onDiscard={discard}
              onSend={sendEmail}
            />
          )}

          {rightPanel === 'view' && selectedHistoryItem && (
            <ViewPanel
              token={token}
              item={selectedHistoryItem}
              onResend={() => {
                setSelectedTemplateId(selectedHistoryItem.templateId);
                setIsCustom(!selectedHistoryItem.templateId);
                setSubject(selectedHistoryItem.subject);
                setBody(selectedHistoryItem.body);
                setRecipients(selectedHistoryItem.recipients);
                setCc(selectedHistoryItem.cc);
                setRightPanel('compose');
              }}
              onReply={() => {
                setSelectedTemplateId(null);
                setIsCustom(true);
                setSubject(`Re: ${selectedHistoryItem.subject}`);
                setBody('');
                setRecipients(selectedHistoryItem.recipients);
                setCc([]);
                setRightPanel('compose');
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

// ─── ComposePanel ───────────────────────────────────────────────────────────
function ComposePanel({
  token, recipients, setRecipients, cc, setCc, subject, setSubject, body, setBody,
  recipientInput, setRecipientInput, ccInput, setCcInput,
  showRecipientInput, setShowRecipientInput, showCcInput, setShowCcInput,
  isSending, onDiscard, onSend,
}: {
  token: ReturnType<typeof useToken>['token'];
  recipients: string[];
  setRecipients: (v: string[]) => void;
  cc: string[];
  setCc: (v: string[]) => void;
  subject: string;
  setSubject: (v: string) => void;
  body: string;
  setBody: (v: string) => void;
  recipientInput: string;
  setRecipientInput: (v: string) => void;
  ccInput: string;
  setCcInput: (v: string) => void;
  showRecipientInput: boolean;
  setShowRecipientInput: (v: boolean) => void;
  showCcInput: boolean;
  setShowCcInput: (v: boolean) => void;
  isSending: boolean;
  onDiscard: () => void;
  onSend: () => void;
}) {
  const addRecipient = (email: string) => {
    if (email.trim() && !recipients.includes(email.trim())) {
      setRecipients([...recipients, email.trim()]);
    }
    setRecipientInput('');
    setShowRecipientInput(false);
  };
  const addCc = (email: string) => {
    if (email.trim() && !cc.includes(email.trim())) {
      setCc([...cc, email.trim()]);
    }
    setCcInput('');
    setShowCcInput(false);
  };

  const fieldLabelStyle: React.CSSProperties = { fontSize: 11, color: token.colorTextTertiary, width: 44, flexShrink: 0 };
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    background: token.colorFillSecondary, borderRadius: 4,
    padding: '1px 6px', fontSize: 11, color: token.colorTextBase,
    border: `1px solid ${token.colorBorderSecondary}`,
  };

  return (
    <>
      {/* Recipient fields */}
      <div style={{ background: token.colorFillQuaternary, borderBottom: `1px solid ${token.colorBorderSecondary}`, flexShrink: 0, padding: '0 14px' }}>
        {/* To row */}
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 36, borderBottom: `1px solid ${token.colorBorderSecondary}`, gap: 8, flexWrap: 'wrap', padding: '4px 0' }}>
          <span style={fieldLabelStyle}>To</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, alignItems: 'center' }}>
            {recipients.map(r => (
              <span key={r} style={chipStyle}>
                {r}
                <span
                  onClick={() => setRecipients(recipients.filter(x => x !== r))}
                  style={{ cursor: 'pointer', color: token.colorTextTertiary, fontSize: 12, lineHeight: 1 }}
                >×</span>
              </span>
            ))}
            {showRecipientInput ? (
              <Input
                size="small"
                autoFocus
                value={recipientInput}
                onChange={e => setRecipientInput(e.target.value)}
                onPressEnter={() => addRecipient(recipientInput)}
                onBlur={() => { if (recipientInput) addRecipient(recipientInput); else setShowRecipientInput(false); }}
                style={{ width: 160, fontSize: 11, height: 22 }}
                placeholder="email@example.com"
              />
            ) : (
              <span
                onClick={() => setShowRecipientInput(true)}
                style={{ fontSize: 11, color: token.colorPrimary, cursor: 'pointer', padding: '1px 4px' }}
              >+ Add</span>
            )}
          </div>
        </div>
        {/* CC row */}
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 32, borderBottom: `1px solid ${token.colorBorderSecondary}`, gap: 8, flexWrap: 'wrap', padding: '4px 0' }}>
          <span style={fieldLabelStyle}>CC</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1, alignItems: 'center' }}>
            {cc.map(r => (
              <span key={r} style={chipStyle}>
                {r}
                <span onClick={() => setCc(cc.filter(x => x !== r))} style={{ cursor: 'pointer', color: token.colorTextTertiary, fontSize: 12, lineHeight: 1 }}>×</span>
              </span>
            ))}
            {showCcInput ? (
              <Input
                size="small"
                autoFocus
                value={ccInput}
                onChange={e => setCcInput(e.target.value)}
                onPressEnter={() => addCc(ccInput)}
                onBlur={() => { if (ccInput) addCc(ccInput); else setShowCcInput(false); }}
                style={{ width: 160, fontSize: 11, height: 22 }}
                placeholder="email@example.com"
              />
            ) : (
              <span onClick={() => setShowCcInput(true)} style={{ fontSize: 11, color: token.colorPrimary, cursor: 'pointer', padding: '1px 4px' }}>+ Add</span>
            )}
          </div>
        </div>
        {/* Subject row */}
        <div style={{ display: 'flex', alignItems: 'center', minHeight: 32, gap: 8 }}>
          <span style={fieldLabelStyle}>Subject</span>
          <Input
            variant="borderless"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            style={{ fontSize: 12, padding: 0, flex: 1 }}
            placeholder="Email subject…"
          />
        </div>
      </div>

      {/* Body editor */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <Input.TextArea
          value={body}
          onChange={e => setBody(e.target.value)}
          autoSize={false}
          style={{
            border: 'none', outline: 'none', resize: 'none',
            width: '100%', height: '100%', minHeight: 200,
            fontSize: 13, lineHeight: 1.7, padding: '14px',
            fontFamily: 'inherit',
            boxShadow: 'none',
          }}
          placeholder="Write your message here…"
        />
      </div>

      {/* Formatting toolbar */}
      <div style={{
        background: token.colorFillQuaternary,
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
      }}>
        {[
          { icon: <BoldOutlined />, label: 'Bold' },
          { icon: <ItalicOutlined />, label: 'Italic' },
          { icon: <LinkOutlined />, label: 'Link' },
          { icon: <PaperClipOutlined />, label: 'Attach file' },
        ].map(({ icon, label }) => (
          <Tooltip key={label} title={label} placement="top">
            <button
              type="button"
              style={{
                width: 28, height: 28, border: 'none', background: 'transparent',
                cursor: 'pointer', borderRadius: 4, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: token.colorTextSecondary, fontSize: 14,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              {icon}
            </button>
          </Tooltip>
        ))}
      </div>

      {/* Action row */}
      <div style={{
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 10, color: token.colorTextTertiary }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={onDiscard}>Discard</Button>
          <Tooltip title={recipients.length === 0 ? 'Add at least one recipient' : ''}>
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              loading={isSending}
              disabled={recipients.length === 0 || !subject.trim()}
              onClick={onSend}
            >
              Send email
            </Button>
          </Tooltip>
        </div>
      </div>
    </>
  );
}

// ─── ViewPanel ──────────────────────────────────────────────────────────────
function ViewPanel({
  token, item, onResend, onReply,
}: {
  token: ReturnType<typeof useToken>['token'];
  item: CommHistoryItem;
  onResend: () => void;
  onReply: () => void;
}) {
  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center',
    background: token.colorFillSecondary, borderRadius: 4,
    padding: '1px 6px', fontSize: 11, color: token.colorTextBase,
    border: `1px solid ${token.colorBorderSecondary}`, marginRight: 4,
  };

  return (
    <>
      {/* Header row */}
      <div style={{
        background: token.colorFillQuaternary,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        <Tag style={{
          fontSize: 9, fontWeight: 600, padding: '0 4px', margin: 0,
          background: item.type === 've_sent' ? token.colorInfoBg : token.colorSuccessBg,
          color: item.type === 've_sent' ? token.colorInfo : token.colorSuccess,
          border: 'none', lineHeight: '16px',
        }}>
          {item.type === 've_sent' ? 'VE' : 'TA'}
        </Tag>
        <span style={{ fontSize: 12, fontWeight: 500, flex: 1 }}>{item.templateName}</span>
        <span style={{ fontSize: 11, color: token.colorTextTertiary }}>{item.sentAt}</span>
      </div>

      {/* Metadata row */}
      <div style={{
        background: token.colorFillQuaternary,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: '8px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ color: token.colorTextTertiary, width: 44 }}>From</span>
          <span style={{ color: token.colorTextBase }}>{item.sender} &lt;{item.senderEmail}&gt;</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ color: token.colorTextTertiary, width: 44 }}>To</span>
          <div>{item.recipients.map(r => <span key={r} style={chipStyle}>{r}</span>)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
          <span style={{ color: token.colorTextTertiary, width: 44 }}>Subject</span>
          <span style={{ color: token.colorTextBase, fontWeight: 500 }}>{item.subject}</span>
        </div>
      </div>

      {/* Email body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14, minHeight: 0 }}>
        {item.type === 'ta_initiated' && (
          <div style={{ fontSize: 11, color: token.colorTextTertiary, marginBottom: 10, fontStyle: 'italic' }}>
            Received via portal / email
          </div>
        )}
        <div style={{ fontSize: 13, lineHeight: 1.7, color: token.colorTextBase, whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
          {item.body || <span style={{ color: token.colorTextTertiary }}>No content available</span>}
        </div>
      </div>

      {/* Action row */}
      <div style={{
        borderTop: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 8,
        flexShrink: 0,
      }}>
        {item.type === 've_sent' ? (
          <>
            <Button size="small" onClick={onResend}>Resend</Button>
            <Button size="small" onClick={onReply}>Reply</Button>
          </>
        ) : (
          <Button size="small" onClick={onReply}>Reply to TA</Button>
        )}
      </div>
    </>
  );
}
