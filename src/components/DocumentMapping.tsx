import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Segmented,
  Select,
  Tag,
  Progress,
  Modal,
  Typography,
  Divider,
  ConfigProvider,
  message,
  theme,
} from 'antd';
import {
  generateMockDocs,
  getMockTravellers,
  getOrderCountry,
  JURISDICTION_DOC_TYPES,
  ISSUE_LABELS,
  REJECT_REASONS,
  docTypeColour,
  type UploadedDocument,
  type TravellerDoc,
} from '../data/documentMapping';
import { newOrders, attentionOrders, progressOrders, submittedOrders } from '../data/orders';

const { Text } = Typography;
const { useToken } = theme;

const ALL_ORDERS = [...newOrders, ...attentionOrders, ...progressOrders, ...submittedOrders];

// ─── Document thumbnail ──────────────────────────────────────────────────────

function DocThumbnail({
  doc,
  size = 'sm',
}: {
  doc: UploadedDocument;
  size?: 'sm' | 'md';
}) {
  const type = doc.assignedType ?? doc.aiClassification.suggestedType;
  const { bg, text } = docTypeColour(type);
  const w = size === 'sm' ? 28 : 32;
  const h = size === 'sm' ? 36 : 40;
  const label = type ? type.slice(0, 2).toUpperCase() : '?';
  const isPdf = doc.mimeType === 'application/pdf';

  return (
    <div
      style={{
        width: w,
        height: h,
        background: bg,
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {isPdf && (
        <div style={{ fontSize: 8, color: text, opacity: 0.6, lineHeight: 1 }}>PDF</div>
      )}
      <div style={{ fontSize: isPdf ? 9 : 11, fontWeight: 600, color: text, lineHeight: 1 }}>
        {label}
      </div>
    </div>
  );
}

// ─── Left panel ──────────────────────────────────────────────────────────────

function DocListItem({
  doc,
  isActive,
  travellers,
  onClick,
}: {
  doc: UploadedDocument;
  isActive: boolean;
  travellers: TravellerDoc[];
  onClick: () => void;
}) {
  const { token } = useToken();
  const assignedTraveller = travellers.find((t) => t.id === doc.assignedTo);
  const aiTraveller = doc.aiClassification.suggestedTravellerId
    ? travellers.find((t) => t.id === doc.aiClassification.suggestedTravellerId)
    : null;

  const bg = isActive
    ? token.colorFillTertiary
    : doc.status === 'rejected'
    ? '#FFFBF0'
    : 'transparent';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        cursor: 'pointer',
        background: bg,
        borderLeft: isActive ? `2.5px solid ${token.colorPrimary}` : '2.5px solid transparent',
        opacity: doc.status === 'assigned' ? 0.5 : 1,
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLElement).style.background = token.colorFillSecondary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = bg;
      }}
    >
      <DocThumbnail doc={doc} size="md" />
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            color: token.colorText,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {doc.filename}
        </div>

        {doc.status === 'assigned' && (
          <div style={{ fontSize: 9, color: token.colorSuccess, marginTop: 1 }}>
            ✓ {doc.assignedType} · {assignedTraveller?.fullName ?? 'All travellers'}
          </div>
        )}

        {doc.status === 'rejected' && (
          <div style={{ fontSize: 9, color: token.colorWarning, marginTop: 1 }}>
            ✕ {doc.rejectReason}
          </div>
        )}

        {doc.status === 'unassigned' && (
          <>
            {doc.aiClassification.suggestedType ? (
              <div style={{ fontSize: 9, color: token.colorPrimary, marginTop: 1 }}>
                AI: {doc.aiClassification.suggestedType}
                {aiTraveller ? ` · ${aiTraveller.fullName.split(' ')[0]}` : ' · All'}
              </div>
            ) : (
              <div style={{ fontSize: 9, color: token.colorTextQuaternary, marginTop: 1 }}>
                not classified
              </div>
            )}
            {doc.issue && (
              <div style={{ fontSize: 9, color: token.colorWarning, marginTop: 1 }}>
                ⚠ {ISSUE_LABELS[doc.issue] ?? doc.issue}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function LeftDocsList({
  docs,
  currentDocId,
  travellers,
  onSelect,
}: {
  docs: UploadedDocument[];
  currentDocId: number | null;
  travellers: TravellerDoc[];
  onSelect: (id: number) => void;
}) {
  const { token } = useToken();
  const unassigned = docs.filter((d) => d.status === 'unassigned');
  const assigned = docs.filter((d) => d.status === 'assigned');
  const rejected = docs.filter((d) => d.status === 'rejected');

  const SectionLabel = ({ label, count }: { label: string; count: number }) => (
    <div
      style={{
        padding: '4px 10px',
        fontSize: 10,
        fontWeight: 500,
        color: token.colorTextTertiary,
        background: token.colorFillTertiary,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      {label} ({count})
    </div>
  );

  if (docs.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: token.colorTextQuaternary, fontSize: 12 }}>
        No documents uploaded yet.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {unassigned.length > 0 && (
        <>
          <SectionLabel label="Unassigned" count={unassigned.length} />
          {unassigned.map((d) => (
            <DocListItem key={d.id} doc={d} isActive={d.id === currentDocId} travellers={travellers} onClick={() => onSelect(d.id)} />
          ))}
        </>
      )}
      {assigned.length > 0 && (
        <>
          <SectionLabel label="Assigned" count={assigned.length} />
          {assigned.map((d) => (
            <DocListItem key={d.id} doc={d} isActive={d.id === currentDocId} travellers={travellers} onClick={() => onSelect(d.id)} />
          ))}
        </>
      )}
      {rejected.length > 0 && (
        <>
          <SectionLabel label="Rejected" count={rejected.length} />
          {rejected.map((d) => (
            <DocListItem key={d.id} doc={d} isActive={d.id === currentDocId} travellers={travellers} onClick={() => onSelect(d.id)} />
          ))}
        </>
      )}
    </div>
  );
}

function TravellerStatusDot({ filled }: { filled: boolean }) {
  const { token } = useToken();
  return (
    <div
      style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: filled ? token.colorSuccess : token.colorBorderSecondary,
        flexShrink: 0,
      }}
    />
  );
}

function LeftTravellersList({
  travellers,
  docs,
}: {
  travellers: TravellerDoc[];
  docs: UploadedDocument[];
}) {
  const { token } = useToken();

  return (
    <div style={{ overflowY: 'auto', flex: 1, padding: '6px 0' }}>
      {travellers.map((t) => {
        const assignedDocs = docs.filter(
          (d) => d.status === 'assigned' && (d.assignedTo === t.id || d.assignedTo === null)
        );
        const assignedTypes = new Set(assignedDocs.map((d) => d.assignedType).filter(Boolean));
        const missingCount = t.requiredDocTypes.filter((type) => !assignedTypes.has(type)).length;
        const hasNone = assignedDocs.length === 0;
        const borderColor = hasNone ? token.colorWarning : 'transparent';

        return (
          <div
            key={t.id}
            style={{
              margin: '4px 8px',
              border: `1px solid ${borderColor}`,
              borderRadius: 6,
              padding: '8px 10px',
              background: token.colorBgContainer,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: token.colorPrimaryBg,
                    color: token.colorPrimary,
                    fontSize: 10,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {t.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: token.colorText }}>{t.fullName}</div>
                  <div style={{ fontSize: 9, color: token.colorTextTertiary }}>{t.role}</div>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: hasNone ? 700 : 400, color: hasNone ? token.colorWarning : missingCount === 0 ? token.colorSuccess : token.colorText }}>
                {missingCount === 0 ? '✓' : hasNone ? 'nothing yet' : `${missingCount} left`}
              </div>
            </div>
            {t.requiredDocTypes.map((type) => (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                <TravellerStatusDot filled={assignedTypes.has(type)} />
                <span style={{ fontSize: 10, color: token.colorTextSecondary }}>{type}</span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Center panel ────────────────────────────────────────────────────────────

function DocViewer({
  doc,
  zoom,
  rotation,
  enhanced,
  cropMode,
}: {
  doc: UploadedDocument | undefined;
  zoom: number;
  rotation: number;
  enhanced: boolean;
  cropMode: boolean;
}) {
  const { token } = useToken();
  if (!doc) {
    return (
      <div style={{ flex: 1, background: token.colorFillTertiary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">No document selected</Text>
      </div>
    );
  }

  const type = doc.assignedType ?? doc.aiClassification.suggestedType;
  const { bg, text } = docTypeColour(type);
  const isPdf = doc.mimeType === 'application/pdf';
  const isRotated = rotation === 90 || rotation === 270;

  return (
    <div
      style={{
        flex: 1,
        background: token.colorFillTertiary,
        overflow: 'auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          transform: `rotate(${rotation}deg) scale(${zoom / 100})`,
          transformOrigin: 'center',
          transition: 'transform 0.2s',
          width: isRotated ? 440 : 320,
          height: isRotated ? 320 : 440,
          background: bg,
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
          filter: enhanced ? 'brightness(1.18) contrast(1.12) saturate(1.08)' : 'none',
          position: 'relative',
        }}
      >
        {isPdf && (
          <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 700, color: text, opacity: 0.5, letterSpacing: 1 }}>
            PDF
          </div>
        )}
        <div style={{ fontSize: 48, color: text, opacity: 0.15, fontWeight: 700, lineHeight: 1 }}>
          {type ? type.slice(0, 2).toUpperCase() : '?'}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: text }}>{type ?? 'Unclassified'}</div>
        <div style={{ fontSize: 11, color: text, opacity: 0.6, textAlign: 'center', padding: '0 20px', wordBreak: 'break-all' as const }}>
          {doc.filename}
        </div>
        {doc.issue && (
          <div style={{ marginTop: 8, padding: '4px 10px', background: '#FAEEDA', borderRadius: 4, fontSize: 10, color: '#854F0B' }}>
            ⚠ {ISSUE_LABELS[doc.issue] ?? doc.issue}
          </div>
        )}

        {/* Crop overlay */}
        {cropMode && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px dashed #1677ff',
              borderRadius: 6,
              pointerEvents: 'none',
            }}
          >
            {/* Corner handles */}
            {[
              { top: -4, left: -4 },
              { top: -4, right: -4 },
              { bottom: -4, left: -4 },
              { bottom: -4, right: -4 },
            ].map((pos, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 10,
                  height: 10,
                  background: '#1677ff',
                  borderRadius: 2,
                  ...pos,
                }}
              />
            ))}
            {/* Shade overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(22,119,255,0.06)', borderRadius: 4 }} />
          </div>
        )}
      </div>
    </div>
  );
}


// ─── Right panel ─────────────────────────────────────────────────────────────

function AIBanner({ doc }: { doc: UploadedDocument | undefined }) {
  const { token } = useToken();
  if (!doc) return null;

  const hasAI = doc.aiClassification.suggestedType !== null;

  if (!hasAI) {
    return (
      <div
        style={{
          padding: '8px 13px',
          background: token.colorFillTertiary,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          fontSize: 11,
          color: token.colorTextTertiary,
        }}
      >
        🤖 AI couldn't classify this — assign manually below
      </div>
    );
  }

  const confidenceColor =
    doc.aiClassification.confidence === 'high'
      ? token.colorSuccess
      : doc.aiClassification.confidence === 'medium'
      ? token.colorWarning
      : token.colorError;

  return (
    <div
      style={{
        padding: '8px 13px',
        background: token.colorInfoBg,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <div style={{ fontSize: 10, color: token.colorInfoText, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>🤖</span>
        <span>AI suggestion ·</span>
        <span style={{ color: confidenceColor, fontWeight: 500 }}>
          {doc.aiClassification.confidence} confidence
        </span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: token.colorInfoText, marginTop: 3 }}>
        {doc.aiClassification.suggestedType} · {doc.aiClassification.suggestedTravellerId ? 'traveller pre-selected' : 'all travellers'}
      </div>
      {doc.issue && (
        <div
          style={{
            marginTop: 6,
            padding: '4px 8px',
            background: '#FAEEDA',
            borderRadius: 4,
            fontSize: 10,
            color: '#854F0B',
          }}
        >
          ⚠ Issue detected: {ISSUE_LABELS[doc.issue] ?? doc.issue}
        </div>
      )}
    </div>
  );
}

function DocTypeRadioList({
  types,
  selected,
  filledTypes,
  onChange,
}: {
  types: string[];
  selected: string | null;
  filledTypes: Set<string>;
  onChange: (t: string) => void;
}) {
  const { token } = useToken();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {types.map((type) => {
        const isSelected = selected === type;
        const isFilled = filledTypes.has(type);
        const { bg, text } = docTypeColour(type);
        return (
          <div
            key={type}
            onClick={() => onChange(type)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              border: `1px solid ${isSelected ? token.colorPrimary : token.colorBorderSecondary}`,
              borderRadius: 5,
              background: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
              cursor: 'pointer',
              opacity: isFilled && !isSelected ? 0.45 : 1,
              transition: 'all 0.1s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? token.colorPrimary : token.colorBorderSecondary}`,
                  background: isSelected ? token.colorPrimary : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSelected && (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    background: bg,
                    border: `1px solid ${text}22`,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? 600 : 400,
                    color: isSelected ? token.colorPrimary : token.colorText,
                  }}
                >
                  {type}
                </span>
              </div>
            </div>
            {isFilled && (
              <Tag color="success" style={{ fontSize: 9, lineHeight: '14px', margin: 0, padding: '0 5px' }}>
                ✓ filled
              </Tag>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Reject modal ────────────────────────────────────────────────────────────

function RejectModal({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const { token } = useToken();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    if (!open) setReason(null);
  }, [open]);

  return (
    <Modal
      open={open}
      title="Reject document"
      footer={null}
      closable
      onCancel={onCancel}
      width={360}
      destroyOnHidden
    >
      <Text type="secondary" style={{ fontSize: 12 }}>
        The TA will be notified and asked to re-upload.
      </Text>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {REJECT_REASONS.map((r) => {
          const isSelected = reason === r;
          return (
            <div
              key={r}
              onClick={() => setReason(r)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 10px',
                border: `1px solid ${isSelected ? token.colorPrimary : token.colorBorderSecondary}`,
                borderRadius: 5,
                background: isSelected ? token.colorPrimaryBg : token.colorBgContainer,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 13,
                  height: 13,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? token.colorPrimary : token.colorBorderSecondary}`,
                  background: isSelected ? token.colorPrimary : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isSelected && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 400, color: token.colorText }}>
                {r}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <Button style={{ flex: 1 }} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          danger
          type="primary"
          style={{ flex: 1 }}
          disabled={!reason}
          onClick={() => reason && onConfirm(reason)}
        >
          Reject and notify TA
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DocumentMapping() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [messageApi, contextHolder] = message.useMessage();

  const order = ALL_ORDERS.find((o) => o.id === orderId);

  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  const [travellers, setTravellers] = useState<TravellerDoc[]>([]);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [currentDocId, setCurrentDocId] = useState<number | null>(null);
  const [leftMode, setLeftMode] = useState<'docs' | 'travellers'>('docs');
  const [selectedTravellerId, setSelectedTravellerId] = useState<number | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  const [cropMode, setCropMode] = useState(false);

  // Load mock data
  useEffect(() => {
    if (!orderId) return;
    const mockTravellers = getMockTravellers(orderId, order?.pax ?? 2);
    const mockDocs = generateMockDocs(orderId, mockTravellers);
    const country = getOrderCountry(orderId);
    const types = JURISDICTION_DOC_TYPES[country] ?? JURISDICTION_DOC_TYPES.default;
    setTravellers(mockTravellers);
    setDocs(mockDocs);
    setDocTypes(types);
    const first = mockDocs.find((d) => d.status === 'unassigned');
    if (first) setCurrentDocId(first.id);
  }, [orderId]);

  // Sync AI suggestions + reset tool state when current doc changes
  useEffect(() => {
    const doc = docs.find((d) => d.id === currentDocId);
    if (!doc) return;
    setSelectedTravellerId(doc.aiClassification.suggestedTravellerId);
    setSelectedDocType(doc.aiClassification.suggestedType);
    setZoom(100);
    setRotation(0);
    setEnhanced(false);
    setCropMode(false);
  }, [currentDocId, docs.length]);

  const currentDoc = docs.find((d) => d.id === currentDocId);

  const nextUnassigned = useCallback(
    (excludeId?: number) => docs.find((d) => d.status === 'unassigned' && d.id !== excludeId) ?? null,
    [docs]
  );

  const handleConfirm = useCallback(() => {
    if (!selectedDocType) {
      messageApi.warning('Pick a document type first');
      return;
    }
    if (!currentDocId) return;
    const traveller = selectedTravellerId ? travellers.find((t) => t.id === selectedTravellerId) : null;
    const travellerName = traveller ? traveller.fullName : 'all travellers';
    setDocs((prev) =>
      prev.map((d) =>
        d.id === currentDocId
          ? { ...d, status: 'assigned', assignedTo: selectedTravellerId, assignedType: selectedDocType }
          : d
      )
    );
    const next = nextUnassigned(currentDocId);
    if (next) setCurrentDocId(next.id);
    messageApi.success(`Assigned as ${selectedDocType} for ${travellerName}`);
  }, [selectedDocType, currentDocId, selectedTravellerId, travellers, nextUnassigned, messageApi]);

  const handleSkip = useCallback(() => {
    if (!currentDocId) return;
    const next = nextUnassigned(currentDocId);
    if (next) setCurrentDocId(next.id);
  }, [currentDocId, nextUnassigned]);

  const handleReject = useCallback(
    (reason: string) => {
      if (!currentDocId) return;
      setDocs((prev) =>
        prev.map((d) =>
          d.id === currentDocId ? { ...d, status: 'rejected', rejectReason: reason } : d
        )
      );
      const next = nextUnassigned(currentDocId);
      if (next) setCurrentDocId(next.id);
      messageApi.warning('Rejected — TA will be notified');
      setRejectModalOpen(false);
    },
    [currentDocId, nextUnassigned, messageApi]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      if (rejectModalOpen) return;
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 's' || e.key === 'S') handleSkip();
      if (e.key === 'r' || e.key === 'R') setRejectModalOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleConfirm, handleSkip, rejectModalOpen]);

  // Derived stats
  const handled = docs.filter((d) => d.status !== 'unassigned').length;
  const rejected = docs.filter((d) => d.status === 'rejected').length;
  const total = docs.length;
  const pct = total > 0 ? Math.round((handled / total) * 100) : 0;
  const allHandled = total > 0 && handled === total;

  // Filled types for the selected traveller (to show ✓ filled in radio list)
  const filledTypes = useMemo(() => {
    const s = new Set<string>();
    docs.forEach((d) => {
      if (d.status === 'assigned' && d.id !== currentDocId) {
        if (d.assignedTo === selectedTravellerId || d.assignedTo === null) {
          if (d.assignedType) s.add(d.assignedType);
        }
      }
    });
    return s;
  }, [docs, selectedTravellerId, currentDocId]);

  return (
    <ConfigProvider>
      <InnerDocumentMapping
        orderId={orderId}
        order={order}
        docs={docs}
        travellers={travellers}
        docTypes={docTypes}
        currentDocId={currentDocId}
        leftMode={leftMode}
        selectedTravellerId={selectedTravellerId}
        selectedDocType={selectedDocType}
        rejectModalOpen={rejectModalOpen}
        zoom={zoom}
        rotation={rotation}
        enhanced={enhanced}
        cropMode={cropMode}
        handled={handled}
        rejected={rejected}
        total={total}
        pct={pct}
        allHandled={allHandled}
        filledTypes={filledTypes}
        currentDoc={currentDoc}
        contextHolder={contextHolder}
        onBack={() => navigate(`/orders/${orderId}`)}
        onDocSelect={setCurrentDocId}
        onLeftModeChange={(v) => setLeftMode(v as 'docs' | 'travellers')}
        onTravellerChange={setSelectedTravellerId}
        onDocTypeChange={setSelectedDocType}
        onZoomIn={() => setZoom((z) => Math.min(z + 25, 300))}
        onZoomOut={() => setZoom((z) => Math.max(z - 25, 25))}
        onRotate={() => setRotation((r) => (r + 90) % 360)}
        onToggleEnhance={() => setEnhanced((e) => !e)}
        onToggleCrop={() => setCropMode((c) => !c)}
        onConfirm={handleConfirm}
        onSkip={handleSkip}
        onOpenReject={() => setRejectModalOpen(true)}
        onCloseReject={() => setRejectModalOpen(false)}
        onReject={handleReject}
        onDone={() => navigate(`/orders/${orderId}`)}
      />
    </ConfigProvider>
  );
}

// Inner component uses useToken (must be inside ConfigProvider)
function InnerDocumentMapping({
  orderId,
  order,
  docs,
  travellers,
  docTypes,
  currentDocId,
  leftMode,
  selectedTravellerId,
  selectedDocType,
  rejectModalOpen,
  zoom,
  rotation,
  enhanced,
  cropMode,
  handled,
  rejected,
  total,
  pct,
  allHandled,
  filledTypes,
  currentDoc,
  contextHolder,
  onBack,
  onDocSelect,
  onLeftModeChange,
  onTravellerChange,
  onDocTypeChange,
  onZoomIn,
  onZoomOut,
  onRotate,
  onToggleEnhance,
  onToggleCrop,
  onConfirm,
  onSkip,
  onOpenReject,
  onCloseReject,
  onReject,
  onDone,
}: {
  orderId: string | undefined;
  order: ReturnType<typeof ALL_ORDERS.find>;
  docs: UploadedDocument[];
  travellers: TravellerDoc[];
  docTypes: string[];
  currentDocId: number | null;
  leftMode: 'docs' | 'travellers';
  selectedTravellerId: number | null;
  selectedDocType: string | null;
  rejectModalOpen: boolean;
  zoom: number;
  rotation: number;
  enhanced: boolean;
  cropMode: boolean;
  handled: number;
  rejected: number;
  total: number;
  pct: number;
  allHandled: boolean;
  filledTypes: Set<string>;
  currentDoc: UploadedDocument | undefined;
  contextHolder: React.ReactNode;
  onBack: () => void;
  onDocSelect: (id: number) => void;
  onLeftModeChange: (v: string) => void;
  onTravellerChange: (id: number | null) => void;
  onDocTypeChange: (t: string | null) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onToggleEnhance: () => void;
  onToggleCrop: () => void;
  onConfirm: () => void;
  onSkip: () => void;
  onOpenReject: () => void;
  onCloseReject: () => void;
  onReject: (reason: string) => void;
  onDone: () => void;
}) {
  const { token } = useToken();
  const country = orderId ? getOrderCountry(orderId) : '';
  const visaLabel = order ? `${order.country} ${order.visaCategory}` : 'Visa';

  const travellerOptions = [
    { label: 'All travellers', value: null as number | null },
    ...travellers.map((t) => ({ label: `${t.fullName} — ${t.role}`, value: t.id })),
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        background: token.colorBgLayout,
        fontFamily: token.fontFamily,
      }}
    >
      {contextHolder}

      {/* ── Header ── */}
      <div
        style={{
          height: 46,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Button size="small" onClick={onBack} style={{ fontSize: 12 }}>
            ← Back to order
          </Button>
          <Text strong style={{ fontSize: 13 }}>
            {order?.id ?? orderId}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
          <Text style={{ fontSize: 12 }}>{visaLabel}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>·</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {travellers.length} traveller{travellers.length !== 1 ? 's' : ''}
          </Text>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {handled} of {total} handled
          </Text>
          <Progress
            type="line"
            size="small"
            percent={pct}
            style={{ width: 80, margin: 0 }}
            showInfo={false}
            strokeColor={token.colorPrimary}
          />
          {rejected > 0 && (
            <Tag color="warning" style={{ margin: 0, fontSize: 11 }}>
              {rejected} rejected
            </Tag>
          )}
        </div>
      </div>

      {/* ── Body row ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Left panel (224px) ── */}
        <div
          style={{
            width: 224,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
          }}
        >
          {/* Toggle header */}
          <div
            style={{
              background: token.colorFillTertiary,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <Segmented
              size="small"
              value={leftMode}
              options={['docs', 'travellers']}
              onChange={onLeftModeChange}
              style={{ fontSize: 11 }}
            />
            <Text type="secondary" style={{ fontSize: 10 }}>
              {leftMode === 'docs' ? `${total} files` : `${travellers.length} pax`}
            </Text>
          </div>

          {leftMode === 'docs' ? (
            <LeftDocsList
              docs={docs}
              currentDocId={currentDocId}
              travellers={travellers}
              onSelect={onDocSelect}
            />
          ) : (
            <LeftTravellersList docs={docs} travellers={travellers} />
          )}
        </div>

        {/* ── Center panel (44%) ── */}
        <div
          style={{
            flex: '0 0 44%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRight: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              height: 38,
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              display: 'flex',
              alignItems: 'center',
              padding: '0 10px',
              gap: 2,
              flexShrink: 0,
            }}
          >
            {/* Zoom */}
            <Button size="small" type="text" onClick={onZoomOut} style={{ fontSize: 14, padding: '0 6px', fontWeight: 400 }} title="Zoom out">
              −
            </Button>
            <Text type="secondary" style={{ fontSize: 11, minWidth: 38, textAlign: 'center', userSelect: 'none' }}>
              {zoom}%
            </Text>
            <Button size="small" type="text" onClick={onZoomIn} style={{ fontSize: 14, padding: '0 6px', fontWeight: 400 }} title="Zoom in">
              +
            </Button>

            <div style={{ width: 1, height: 16, background: token.colorBorderSecondary, margin: '0 4px' }} />

            {/* Crop */}
            <Button
              size="small"
              type={cropMode ? 'primary' : 'text'}
              onClick={onToggleCrop}
              title="Crop"
              style={{ fontSize: 11 }}
            >
              ✂ Crop
            </Button>

            {/* Enhance */}
            <Button
              size="small"
              type={enhanced ? 'primary' : 'text'}
              onClick={onToggleEnhance}
              title="Enhance brightness & contrast"
              style={{ fontSize: 11 }}
            >
              ✦ Enhance
            </Button>

            {/* Rotate */}
            <Button
              size="small"
              type="text"
              onClick={onRotate}
              title={`Rotate 90° (currently ${rotation}°)`}
              style={{ fontSize: 11 }}
            >
              ↻ Rotate{rotation !== 0 ? ` (${rotation}°)` : ''}
            </Button>

            {/* Split */}
            <Button
              size="small"
              type="text"
              title="Split PDF pages into separate documents"
              style={{ fontSize: 11, opacity: currentDoc?.mimeType === 'application/pdf' ? 1 : 0.35, cursor: currentDoc?.mimeType === 'application/pdf' ? 'pointer' : 'not-allowed' }}
            >
              ⎘ Split
            </Button>

            <div style={{ flex: 1 }} />
            <Text type="secondary" style={{ fontSize: 10, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentDoc?.filename ?? '—'}
            </Text>
          </div>

          {/* Viewer */}
          <DocViewer doc={currentDoc} zoom={zoom} rotation={rotation} enhanced={enhanced} cropMode={cropMode} />
        </div>

        {/* ── Right panel (fill) ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minWidth: 280,
          }}
        >
          {/* AI banner */}
          <AIBanner doc={currentDoc} />

          {/* Scrollable assignment area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 13px' }}>
            {/* Traveller section */}
            <div style={{ marginBottom: 4 }}>
              <Text
                type="secondary"
                style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}
              >
                Traveller
              </Text>
            </div>
            <Select<number | null>
              style={{ width: '100%' }}
              size="middle"
              value={selectedTravellerId}
              onChange={onTravellerChange}
              options={travellerOptions as { label: string; value: number | null }[]}
              placeholder="Select traveller"
            />

            <Divider style={{ margin: '10px 0' }} />

            {/* Doc type section */}
            <div style={{ marginBottom: 8 }}>
              <Text
                type="secondary"
                style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}
              >
                Document type
              </Text>
            </div>
            <DocTypeRadioList
              types={docTypes}
              selected={selectedDocType}
              filledTypes={filledTypes}
              onChange={onDocTypeChange}
            />
          </div>

          {/* Action area */}
          <div
            style={{
              borderTop: `1px solid ${token.colorBorderSecondary}`,
              padding: '10px 13px',
              flexShrink: 0,
            }}
          >
            <Button
              type="primary"
              block
              disabled={!selectedDocType}
              onClick={onConfirm}
              style={{ marginBottom: 8 }}
            >
              Confirm — next document
            </Button>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button style={{ flex: 1 }} onClick={onSkip}>
                Skip
              </Button>
              <Button
                style={{
                  flex: 1,
                  color: token.colorWarning,
                  borderColor: token.colorWarning,
                }}
                onClick={onOpenReject}
              >
                Reject doc
              </Button>
            </div>
            <Text
              type="secondary"
              style={{ fontSize: 10, display: 'block', textAlign: 'center', marginTop: 8 }}
            >
              Enter — confirm · S — skip · R — reject
            </Text>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          height: 40,
          background: token.colorBgContainer,
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, overflow: 'hidden' }}>
          {travellers.map((t) => {
            const assignedDocs = docs.filter(
              (d) => d.status === 'assigned' && (d.assignedTo === t.id || d.assignedTo === null)
            );
            const assignedTypes = new Set(assignedDocs.map((d) => d.assignedType));
            const missing = t.requiredDocTypes.filter((type) => !assignedTypes.has(type)).length;
            const complete = missing === 0 && assignedDocs.length > 0;
            const hasNone = assignedDocs.length === 0;
            const firstName = t.fullName.split(' ')[0];
            return (
              <Text
                key={t.id}
                style={{
                  fontSize: 11,
                  color: complete ? token.colorSuccess : hasNone ? token.colorWarning : token.colorText,
                  fontWeight: hasNone ? 700 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {firstName}: {complete ? '✓' : hasNone ? 'nothing' : `${missing} left`}
              </Text>
            );
          })}
        </div>
        <Button type="primary" disabled={!allHandled} onClick={onDone}>
          Done — verify documents →
        </Button>
      </div>

      {/* ── Reject modal ── */}
      <RejectModal open={rejectModalOpen} onCancel={onCloseReject} onConfirm={onReject} />
    </div>
  );
}
