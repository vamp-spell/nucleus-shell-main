import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, ConfigProvider, Modal, Tag, Typography, theme } from 'antd';
import { newOrders, attentionOrders, progressOrders, submittedOrders } from '../data/orders';

const { Text } = Typography;
const { useToken } = theme;

export const AGENT_PREFILL_COUNTRIES = ['Indonesia', 'Vietnam'];

const ALL_ORDERS = [...newOrders, ...attentionOrders, ...progressOrders, ...submittedOrders];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TravellerCheckpointSummary {
  travellerId: string;
  name: string;
  role: 'primary' | 'spouse' | 'dependent';
  documentsMapped: number;
  documentsTotal: number;
  fieldsFilled: number;
  fieldsTotal: number;
  warningCount: number;
  unmappedDocumentCount: number;
  status: 'clean' | 'needs_attention';
}

interface OrderCheckpointState {
  orderId: string;
  country: string;
  travellers: TravellerCheckpointSummary[];
  allClean: boolean;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CHECKPOINT_STATES: Record<string, OrderCheckpointState> = {
  'SMV-IDN-12711': {
    orderId: 'SMV-IDN-12711',
    country: 'Indonesia',
    allClean: false,
    travellers: [
      {
        travellerId: 'TRV-001',
        name: 'Rahul Menon',
        role: 'primary',
        documentsMapped: 5,
        documentsTotal: 5,
        fieldsFilled: 22,
        fieldsTotal: 22,
        warningCount: 3,
        unmappedDocumentCount: 1,
        status: 'needs_attention',
      },
      {
        travellerId: 'TRV-002',
        name: 'Anita Menon',
        role: 'spouse',
        documentsMapped: 4,
        documentsTotal: 4,
        fieldsFilled: 22,
        fieldsTotal: 22,
        warningCount: 0,
        unmappedDocumentCount: 0,
        status: 'clean',
      },
      {
        travellerId: 'TRV-003',
        name: 'Dev Menon',
        role: 'dependent',
        documentsMapped: 3,
        documentsTotal: 3,
        fieldsFilled: 22,
        fieldsTotal: 22,
        warningCount: 1,
        unmappedDocumentCount: 0,
        status: 'needs_attention',
      },
    ],
  },
  'SMV-VNM-15621': {
    orderId: 'SMV-VNM-15621',
    country: 'Vietnam',
    allClean: true,
    travellers: [
      {
        travellerId: 'TRV-010',
        name: 'Priya Sharma',
        role: 'primary',
        documentsMapped: 4,
        documentsTotal: 4,
        fieldsFilled: 22,
        fieldsTotal: 22,
        warningCount: 0,
        unmappedDocumentCount: 0,
        status: 'clean',
      },
      {
        travellerId: 'TRV-011',
        name: 'Arun Sharma',
        role: 'spouse',
        documentsMapped: 4,
        documentsTotal: 4,
        fieldsFilled: 22,
        fieldsTotal: 22,
        warningCount: 0,
        unmappedDocumentCount: 0,
        status: 'clean',
      },
    ],
  },
};

// ─── TravellerSummaryCard ─────────────────────────────────────────────────────

function TravellerSummaryCard({
  t,
  onSpotCheck,
}: {
  t: TravellerCheckpointSummary;
  onSpotCheck: (t: TravellerCheckpointSummary) => void;
}) {
  const { token } = useToken();
  const isWarning = t.status === 'needs_attention';

  const initials = t.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const roleLabel = t.role === 'primary' ? 'Primary' : t.role === 'spouse' ? 'Spouse' : 'Dependent';
  const roleColor = t.role === 'primary' ? 'blue' : t.role === 'spouse' ? 'purple' : 'default';

  const cardStyle: React.CSSProperties = {
    background: isWarning ? '#FFFBF0' : token.colorBgContainer,
    border: isWarning ? `1px solid ${token.colorWarning}` : `1px solid ${token.colorBorderSecondary}`,
    borderRadius: 8,
    padding: 16,
  };

  return (
    <div style={cardStyle}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: token.colorPrimaryBg,
            color: token.colorPrimary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {initials}
        </div>
        <span style={{ fontSize: 14, fontWeight: 500, color: token.colorText }}>{t.name}</span>
        <Tag color={roleColor} style={{ margin: 0, fontSize: 11 }}>
          {roleLabel}
        </Tag>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          📄 {t.documentsMapped} docs mapped
        </Text>
        <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
          {t.fieldsFilled}/{t.fieldsTotal} fields filled
        </Text>
        {isWarning ? (
          <>
            {t.warningCount > 0 && (
              <Text style={{ fontSize: 12, color: token.colorWarning, fontWeight: 500 }}>
                ⚠ {t.warningCount} warning{t.warningCount !== 1 ? 's' : ''}
              </Text>
            )}
            {t.unmappedDocumentCount > 0 && (
              <Text style={{ fontSize: 12, color: token.colorWarning, fontWeight: 500 }}>
                {t.unmappedDocumentCount} unmapped
              </Text>
            )}
          </>
        ) : (
          <Text style={{ fontSize: 12, color: token.colorSuccess, fontWeight: 500 }}>
            ✓ 0 warnings
          </Text>
        )}
      </div>

      {/* Actions row */}
      <div
        style={{
          marginTop: 12,
          borderTop: `1px solid ${isWarning ? token.colorWarning + '44' : token.colorBorderSecondary}`,
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {isWarning ? (
          <Button type="primary" size="small" onClick={() => onSpotCheck(t)}>
            Resolve
          </Button>
        ) : (
          <Button type="default" size="small" onClick={() => onSpotCheck(t)}>
            Spot check
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Inner component (uses useToken inside ConfigProvider) ────────────────────

function CheckpointScreenInner() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { token } = useToken();

  const checkpointState = orderId ? MOCK_CHECKPOINT_STATES[orderId] : undefined;
  const order = ALL_ORDERS.find((o) => o.id === orderId);


  if (!checkpointState || !orderId) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}
      >
        <Text type="secondary">Order not found</Text>
        <Button onClick={() => navigate('/')}>Back to orders</Button>
      </div>
    );
  }

  const { allClean, travellers, country } = checkpointState;
  const attentionCount = travellers.filter((t) => t.status === 'needs_attention').length;
  const flag = order?.flag ?? '';

  function handleSpotCheck(t: TravellerCheckpointSummary) {
    const landingStage = t.unmappedDocumentCount > 0 ? 'mapping' : 'verification';
    const reason = [
      t.warningCount > 0 ? `${t.warningCount} warning${t.warningCount !== 1 ? 's' : ''}` : '',
      t.unmappedDocumentCount > 0
        ? `${t.unmappedDocumentCount} unmapped document${t.unmappedDocumentCount !== 1 ? 's' : ''}`
        : '',
    ]
      .filter(Boolean)
      .join(' and ');
    navigate(
      `/orders/${orderId}/classify-documents?spotCheck=1&travellerId=${t.travellerId}&reason=${encodeURIComponent(reason)}&landingStage=${landingStage}`
    );
  }

  function handleMarkReady() {
    if (allClean) {
      Modal.success({
        title: 'Order marked ready to submit',
        content: 'The order is ready to go.',
      });
    } else {
      Modal.confirm({
        title: 'Unresolved warnings',
        content: (
          <div>
            <p style={{ marginBottom: 8 }}>The following travellers have unresolved items:</p>
            <ul style={{ paddingLeft: 16, margin: 0 }}>
              {travellers
                .filter((t) => t.status === 'needs_attention')
                .map((t) => (
                  <li key={t.travellerId} style={{ fontSize: 13, marginBottom: 4 }}>
                    {t.name} —{' '}
                    {[
                      t.warningCount > 0 ? `${t.warningCount} warning${t.warningCount !== 1 ? 's' : ''}` : '',
                      t.unmappedDocumentCount > 0
                        ? `${t.unmappedDocumentCount} unmapped document${t.unmappedDocumentCount !== 1 ? 's' : ''}`
                        : '',
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </li>
                ))}
            </ul>
          </div>
        ),
        okText: 'Mark ready anyway',
        onOk: () => {
          Modal.success({
            title: 'Order marked ready to submit',
            content: 'The order is ready to go.',
          });
        },
      });
    }
  }

  // Status pill
  const statusPill = allClean ? (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#F6FFED',
        border: '1px solid #b7eb8f',
        color: '#52c41a',
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      ✓ All clean
    </span>
  ) : (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#FFFBF0',
        border: `1px solid ${token.colorWarning}`,
        color: token.colorWarning,
        borderRadius: 20,
        padding: '2px 10px',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {attentionCount} traveller{attentionCount !== 1 ? 's' : ''} need{attentionCount === 1 ? 's' : ''} attention
    </span>
  );

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: token.colorBgLayout,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          height: 52,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        <Button
          type="text"
          size="small"
          onClick={() => navigate(`/orders/${orderId}`)}
          style={{ fontSize: 13 }}
        >
          ← Back to order
        </Button>
        <div style={{ width: 1, height: 20, background: token.colorBorderSecondary }} />
        <span style={{ fontSize: 12, color: token.colorTextSecondary, fontFamily: 'monospace' }}>
          {orderId}
        </span>
        <span style={{ fontSize: 13 }}>
          {flag} {country}
        </span>
        <div style={{ flex: 1 }} />
        {statusPill}
      </div>

      {/* Content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '32px 24px',
          maxWidth: 720,
          margin: '0 auto',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {/* Description */}
        <p
          style={{
            fontSize: 14,
            color: token.colorTextSecondary,
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {allClean
            ? 'Agent mapped all documents and filled all form fields for every traveller. No warnings detected. This is a final check — confirm each traveller\'s summary, then mark the order ready to submit.'
            : `${attentionCount} traveller${attentionCount !== 1 ? 's' : ''} have warnings or unmapped documents and need a spot check before the order can be submitted.`}
        </p>

        {/* Traveller cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {travellers.map((t) => (
            <TravellerSummaryCard
              key={t.travellerId}
              t={t}
              onSpotCheck={handleSpotCheck}
            />
          ))}
        </div>
      </div>

      {/* Bottom action area */}
      <div
        style={{
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          padding: '16px 24px',
          background: token.colorBgContainer,
          position: 'sticky',
          bottom: 0,
          maxWidth: 720,
          width: '100%',
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {allClean ? (
          <Button type="primary" size="large" block onClick={handleMarkReady}>
            Mark ready to submit
          </Button>
        ) : (
          <>
            <Button
              type="default"
              size="large"
              block
              style={{ color: token.colorTextSecondary, borderColor: token.colorBorderSecondary }}
              onClick={handleMarkReady}
            >
              Mark ready to submit anyway
            </Button>
            <Text
              type="secondary"
              style={{
                fontSize: 12,
                display: 'block',
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              {attentionCount} traveller{attentionCount !== 1 ? 's' : ''} have unresolved items
            </Text>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Default export ───────────────────────────────────────────────────────────

export default function CheckpointScreen() {
  return (
    <ConfigProvider theme={{ algorithm: theme.defaultAlgorithm }}>
      <CheckpointScreenInner />
    </ConfigProvider>
  );
}
