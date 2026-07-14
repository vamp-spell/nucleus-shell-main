import { useState, useEffect, useCallback, useMemo, useRef, type MutableRefObject } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  Tooltip,
  Input,
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

// ─── Types ─────────────────────────────────────────────────────────────────────

type Stage = 'mapping' | 'verification';

interface FormField {
  fieldId: string;
  label: string;
  value: string | null;
  status: 'clean' | 'warning' | 'missing';
  confidenceReason: string | null;
  sourceDocId: string | null;
  resolved: boolean;
}

interface FormSection {
  sectionId: 'personal' | 'passport' | 'travel' | 'accommodation';
  label: string;
  fields: FormField[];
}

interface TravellerDocument {
  docId: string;
  travellerId: string;
  label: string;
  thumbnailColor: string;
  relatedSectionIds: ('personal' | 'passport' | 'travel' | 'accommodation')[];
}

interface DocumentSyncState {
  mode: 'auto' | 'manual';
  activeSectionId: string | null;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

type SectionId = 'personal' | 'passport' | 'travel' | 'accommodation';

const PERSONAL_FIELDS: { label: string; sourceDocId: string | null }[] = [
  { label: 'Surname', sourceDocId: 'doc-passport-front' },
  { label: 'Given name(s)', sourceDocId: 'doc-passport-front' },
  { label: 'Other names', sourceDocId: 'doc-passport-front' },
  { label: 'Sex', sourceDocId: 'doc-passport-front' },
  { label: 'Date of birth', sourceDocId: 'doc-passport-front' },
  { label: 'Place of birth', sourceDocId: 'doc-passport-front' },
  { label: 'Country of birth', sourceDocId: 'doc-passport-front' },
  { label: 'Nationality', sourceDocId: 'doc-passport-front' },
  { label: 'Occupation', sourceDocId: null },
  { label: 'Employer name', sourceDocId: null },
];

const PASSPORT_FIELDS: { label: string }[] = [
  { label: 'Passport number' },
  { label: 'Passport type' },
  { label: 'Country of issue' },
  { label: 'Date of issue' },
  { label: 'Date of expiry' },
  { label: 'Place of issue' },
  { label: 'Issuing authority' },
  { label: 'MRZ line 1' },
];

const TRAVEL_FIELDS: { label: string }[] = [
  { label: 'Intended departure date' },
  { label: 'Intended return date' },
  { label: 'Purpose of visit' },
  { label: 'Duration of stay (days)' },
  { label: 'Port of entry' },
  { label: 'Transiting countries' },
  { label: 'Number of previous visits' },
  { label: 'Date of last visit' },
];

const ACCOMMODATION_FIELDS: { label: string }[] = [
  { label: 'Hotel / host name' },
  { label: 'Hotel address' },
  { label: 'City' },
  { label: 'Check-in date' },
  { label: 'Check-out date' },
];

const SAMPLE_VALUES: Record<string, string[]> = {
  'Surname': ['Smith', 'Chen', 'Vega', 'Sharma'],
  'Given name(s)': ['John Michael', 'Emily Rose', 'Carlos Andres', 'Priya'],
  'Other names': ['', 'Marie', '', 'Devi'],
  'Sex': ['M', 'F', 'M', 'F'],
  'Date of birth': ['12 Mar 1985', '24 Jul 1990', '05 Nov 1978', '18 Jan 1995'],
  'Place of birth': ['London', 'Sydney', 'Bogotá', 'Mumbai'],
  'Country of birth': ['United Kingdom', 'Australia', 'Colombia', 'India'],
  'Nationality': ['British', 'Australian', 'Canadian', 'Indian'],
  'Occupation': ['Software Engineer', 'Marketing Manager', 'Teacher', 'Doctor'],
  'Employer name': ['Acme Corp', 'Global Media Ltd', 'City Academy', 'Apollo Hospital'],
  'Passport number': ['GB123456789', 'AU987654321', 'CA112233445', 'IN556677889'],
  'Passport type': ['Regular', 'Regular', 'Regular', 'Official'],
  'Country of issue': ['United Kingdom', 'Australia', 'Canada', 'India'],
  'Date of issue': ['10 Jan 2020', '15 Mar 2019', '22 Aug 2021', '04 Dec 2018'],
  'Date of expiry': ['09 Jan 2030', '14 Mar 2029', '21 Aug 2031', '03 Dec 2028'],
  'Place of issue': ['London', 'Sydney', 'Toronto', 'Mumbai'],
  'Issuing authority': ['HM Passport Office', 'DFAT', 'IRCC', 'MEA India'],
  'MRZ line 1': ['P<GBRSMITH<<JOHN<MICHAEL<<<<<<<<<<<<<<<<<<<', 'P<AUSCHEN<<EMILY<ROSE<<<<<<<<<<<<<<<<<<<<<', 'P<CANVEGA<<CARLOS<ANDRES<<<<<<<<<<<<<<<<<<', 'P<INDSHARMA<<PRIYA<<<<<<<<<<<<<<<<<<<<<<'],
  'Intended departure date': ['14 Aug 2026', '22 Sep 2026', '01 Oct 2026', '18 Nov 2026'],
  'Intended return date': ['28 Aug 2026', '05 Oct 2026', '15 Oct 2026', '02 Dec 2026'],
  'Purpose of visit': ['Tourism', 'Business', 'Family visit', 'Conference'],
  'Duration of stay (days)': ['14', '13', '14', '14'],
  'Port of entry': ['Changi Airport', 'Dubai International', 'JFK Airport', 'Heathrow'],
  'Transiting countries': ['None', 'UAE', 'None', 'None'],
  'Number of previous visits': ['0', '2', '1', '0'],
  'Date of last visit': ['', '10 Jan 2025', '05 Mar 2024', ''],
  'Hotel / host name': ['Marina Bay Sands', 'Burj Al Arab', 'The Plaza Hotel', 'The Savoy'],
  'Hotel address': ['10 Bayfront Ave, Singapore', 'Jumeirah Beach Rd, Dubai', '768 5th Ave, New York', 'Strand, London'],
  'City': ['Singapore', 'Dubai', 'New York', 'London'],
  'Check-in date': ['14 Aug 2026', '22 Sep 2026', '01 Oct 2026', '18 Nov 2026'],
  'Check-out date': ['28 Aug 2026', '05 Oct 2026', '15 Oct 2026', '02 Dec 2026'],
};

function generateFormSections(travellerIdx: number): FormSection[] {
  let globalIndex = 0;

  function makeField(
    label: string,
    sourceDocId: string | null,
  ): FormField {
    const idx = globalIndex++;
    const combined = travellerIdx * 31 + idx;
    const isWarning = combined % 5 === 2;
    const isMissing = combined % 11 === 4;

    const vals = SAMPLE_VALUES[label] ?? ['Sample value'];
    const sampleValue = vals[travellerIdx % vals.length] ?? vals[0];

    let status: 'clean' | 'warning' | 'missing' = 'clean';
    let value: string | null = sampleValue || null;
    let confidenceReason: string | null = null;

    if (isMissing) {
      status = 'missing';
      value = null;
      confidenceReason = null;
    } else if (isWarning) {
      status = 'warning';
      confidenceReason = 'Low confidence extraction';
    }

    return {
      fieldId: `t${travellerIdx}_${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`,
      label,
      value,
      status,
      confidenceReason,
      sourceDocId,
      resolved: false,
    };
  }

  const personalFields = PERSONAL_FIELDS.map((f) => makeField(f.label, f.sourceDocId));

  const passportFields = PASSPORT_FIELDS.map((f, i) =>
    makeField(f.label, i % 2 === 0 ? 'doc-passport-front' : 'doc-passport-back')
  );

  const travelFields = TRAVEL_FIELDS.map((f) => makeField(f.label, 'doc-flight'));

  const accommodationFields = ACCOMMODATION_FIELDS.map((f) => makeField(f.label, 'doc-hotel'));

  return [
    { sectionId: 'personal', label: 'Personal details', fields: personalFields },
    { sectionId: 'passport', label: 'Passport details', fields: passportFields },
    { sectionId: 'travel', label: 'Travel details', fields: travelFields },
    { sectionId: 'accommodation', label: 'Accommodation', fields: accommodationFields },
  ];
}

function generateTravellerDocuments(travellerId: string): TravellerDocument[] {
  return [
    { docId: 'doc-passport-front', travellerId, label: 'Passport — front', thumbnailColor: '#E3F0FF', relatedSectionIds: ['personal', 'passport'] },
    { docId: 'doc-passport-back', travellerId, label: 'Passport — back', thumbnailColor: '#D6E8FF', relatedSectionIds: ['passport'] },
    { docId: 'doc-photo', travellerId, label: 'Photograph', thumbnailColor: '#FFF3E3', relatedSectionIds: ['personal'] },
    { docId: 'doc-flight', travellerId, label: 'Flight itinerary', thumbnailColor: '#E8F5E9', relatedSectionIds: ['travel'] },
    { docId: 'doc-hotel', travellerId, label: 'Hotel booking', thumbnailColor: '#F3E8FF', relatedSectionIds: ['accommodation'] },
  ];
}

// ─── StageSwitcher ────────────────────────────────────────────────────────────

function StageSwitcher({
  active,
  mappingComplete,
  verificationComplete,
  onChange,
}: {
  active: Stage;
  mappingComplete: boolean;
  verificationComplete: boolean;
  onChange: (s: Stage) => void;
}) {
  const { token } = useToken();

  const stages: { key: Stage; label: string; complete: boolean }[] = [
    { key: 'mapping', label: 'Map documents', complete: mappingComplete },
    { key: 'verification', label: 'Verify form', complete: verificationComplete },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: token.colorFillTertiary,
        borderRadius: 6,
        padding: 3,
        gap: 2,
      }}
    >
      {stages.map((s) => {
        const isActive = active === s.key;
        return (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              background: isActive ? token.colorBgContainer : 'transparent',
              boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              fontWeight: isActive ? 600 : 400,
              fontSize: 12,
              color: token.colorText,
              transition: 'all 0.15s',
            }}
          >
            {s.complete ? (
              <span style={{ color: token.colorSuccess, fontSize: 11 }}>✓</span>
            ) : (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: isActive ? token.colorPrimary : token.colorBorderSecondary,
                  flexShrink: 0,
                }}
              />
            )}
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

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

// ─── Verification stage components ───────────────────────────────────────────

function WarningNavigator({
  sections,
  warningIndex,
  onIndexChange,
  onScrollToField,
}: {
  sections: FormSection[];
  warningIndex: number;
  onIndexChange: (i: number) => void;
  onScrollToField: (fieldId: string) => void;
}) {
  const { token } = useToken();
  const warningFields = sections.flatMap((s) => s.fields).filter((f) => f.status !== 'clean' && !f.resolved);

  if (warningFields.length === 0) return null;

  const clampedIndex = Math.min(warningIndex, warningFields.length - 1);

  const go = (next: number) => {
    const idx = Math.max(0, Math.min(next, warningFields.length - 1));
    onIndexChange(idx);
    const field = warningFields[idx];
    if (field) onScrollToField(field.fieldId);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: '#FFFBF0',
        border: `1px solid ${token.colorWarning}`,
        borderRadius: 6,
        padding: '2px 8px',
      }}
    >
      <Button
        type="text"
        size="small"
        onClick={() => go(clampedIndex - 1)}
        disabled={clampedIndex <= 0}
        style={{ padding: '0 4px', fontSize: 12 }}
      >
        ‹
      </Button>
      <span style={{ fontSize: 11, color: token.colorWarning, fontWeight: 500, whiteSpace: 'nowrap' }}>
        Warning {clampedIndex + 1} of {warningFields.length}
      </span>
      <Button
        type="text"
        size="small"
        onClick={() => go(clampedIndex + 1)}
        disabled={clampedIndex >= warningFields.length - 1}
        style={{ padding: '0 4px', fontSize: 12 }}
      >
        ›
      </Button>
    </div>
  );
}

function TravellerList({
  travellers,
  fieldsByTraveller,
  selectedId,
  onSelect,
}: {
  travellers: TravellerDoc[];
  fieldsByTraveller: Record<string, FormSection[]>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { token } = useToken();

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      {travellers.map((t) => {
        const id = String(t.id);
        const sections = fieldsByTraveller[id] ?? [];
        const allFields = sections.flatMap((s) => s.fields);
        const warnings = allFields.filter((f) => f.status !== 'clean');
        const unresolved = warnings.filter((f) => !f.resolved).length;
        const isSelected = selectedId === id;
        const initials = t.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2);

        return (
          <div
            key={t.id}
            onClick={() => onSelect(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 10px',
              cursor: 'pointer',
              background: isSelected ? token.colorPrimaryBg : 'transparent',
              borderLeft: isSelected ? `2.5px solid ${token.colorPrimary}` : '2.5px solid transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) (e.currentTarget as HTMLElement).style.background = token.colorFillTertiary;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = isSelected ? token.colorPrimaryBg : 'transparent';
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: token.colorPrimaryBg,
                color: token.colorPrimary,
                fontSize: 9,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: token.colorText, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t.fullName}
              </div>
              <div style={{ fontSize: 9, color: token.colorTextTertiary }}>{t.role}</div>
              {unresolved > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: token.colorWarning, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, color: token.colorWarning }}>{unresolved} warning{unresolved !== 1 ? 's' : ''}</span>
                </div>
              ) : allFields.length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  <span style={{ fontSize: 9, color: token.colorSuccess }}>✓ All clean</span>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FormFieldRow({
  field,
  fieldRef,
  isWarningTarget,
  warningPosition,
  onEdit,
  onConfirm,
  onFormInteraction,
}: {
  field: FormField;
  fieldRef: (el: HTMLDivElement | null) => void;
  isWarningTarget: boolean;
  warningPosition: string | null;
  onEdit: (v: string) => void;
  onConfirm: () => void;
  onFormInteraction: () => void;
}) {
  const { token } = useToken();

  if (field.status === 'clean') {
    return (
      <div
        ref={fieldRef}
        style={{ display: 'flex', alignItems: 'flex-start', padding: '8px 12px', gap: 8 }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 3 }}>{field.label}</div>
          <Input
            size="small"
            value={field.value ?? ''}
            onChange={(e) => onEdit(e.target.value)}
            onFocus={onFormInteraction}
          />
        </div>
        {field.sourceDocId && (
          <div style={{ paddingTop: 20, flexShrink: 0 }}>
            <Tag style={{ fontSize: 10, background: token.colorFillTertiary, border: 'none', margin: 0 }}>
              from {field.sourceDocId.replace('doc-', '').replace(/-/g, ' ')}
            </Tag>
          </div>
        )}
      </div>
    );
  }

  if (field.status === 'warning') {
    const bg = isWarningTarget ? '#FFF3E0' : '#FFFBF0';
    return (
      <div
        ref={fieldRef}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          padding: '8px 12px',
          gap: 8,
          background: bg,
          borderLeft: `2.5px solid ${token.colorWarning}`,
          outline: isWarningTarget ? `2px solid ${token.colorWarning}40` : 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 3 }}>{field.label}</div>
          <Input
            size="small"
            value={field.value ?? ''}
            onChange={(e) => onEdit(e.target.value)}
            onFocus={onFormInteraction}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: token.colorWarning }}>{field.confidenceReason}</span>
            {warningPosition && (
              <span style={{ fontSize: 9, color: token.colorTextTertiary }}>{warningPosition}</span>
            )}
          </div>
          {field.resolved ? (
            <span style={{ fontSize: 11, color: token.colorSuccess }}>✓ Accepted</span>
          ) : (
            <Button
              type="text"
              size="small"
              onClick={() => { onConfirm(); onFormInteraction(); }}
              style={{ color: token.colorSuccess, fontSize: 11, padding: '0 0', height: 'auto' }}
            >
              Looks correct
            </Button>
          )}
        </div>
        {field.sourceDocId && (
          <div style={{ paddingTop: 20, flexShrink: 0 }}>
            <Tag style={{ fontSize: 10, background: token.colorFillTertiary, border: 'none', margin: 0 }}>
              from {field.sourceDocId.replace('doc-', '').replace(/-/g, ' ')}
            </Tag>
          </div>
        )}
      </div>
    );
  }

  // missing
  return (
    <div
      ref={fieldRef}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '8px 12px',
        gap: 8,
        background: '#FFF1F0',
        borderLeft: `2.5px solid ${token.colorError}`,
        outline: isWarningTarget ? `2px solid ${token.colorError}40` : 'none',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 3 }}>{field.label}</div>
        <Input
          size="small"
          value={field.value ?? ''}
          placeholder="Enter manually"
          onChange={(e) => onEdit(e.target.value)}
          onFocus={onFormInteraction}
          style={{ fontStyle: field.value ? 'normal' : 'italic' }}
        />
        <div style={{ marginTop: 4 }}>
          <span style={{ fontSize: 10, color: token.colorError }}>{field.confidenceReason ?? 'Not extracted'}</span>
        </div>
      </div>
    </div>
  );
}

function FormSectionBlock({
  section,
  sectionRef,
  fieldRefs,
  warningFieldId,
  warningFields,
  onFieldEdit,
  onFieldConfirm,
  onFormInteraction,
}: {
  section: FormSection;
  sectionRef: (el: HTMLDivElement | null) => void;
  fieldRefs: MutableRefObject<Record<string, HTMLDivElement | null>>;
  warningFieldId: string | null;
  warningFields: FormField[];
  onFieldEdit: (fId: string, v: string) => void;
  onFieldConfirm: (fId: string) => void;
  onFormInteraction: () => void;
}) {
  const { token } = useToken();

  return (
    <div ref={sectionRef}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px 6px',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>{section.label}</span>
        <div style={{ flex: 1, height: 1, background: token.colorBorderSecondary }} />
      </div>
      {section.fields.map((field) => {
        const wIdx = warningFields.findIndex((f) => f.fieldId === field.fieldId);
        const warningPosition = wIdx >= 0 ? `Warning ${wIdx + 1} of ${warningFields.length}` : null;
        return (
          <FormFieldRow
            key={field.fieldId}
            field={field}
            fieldRef={(el) => { fieldRefs.current[field.fieldId] = el; }}
            isWarningTarget={warningFieldId === field.fieldId}
            warningPosition={warningPosition}
            onEdit={(v) => onFieldEdit(field.fieldId, v)}
            onConfirm={() => onFieldConfirm(field.fieldId)}
            onFormInteraction={onFormInteraction}
          />
        );
      })}
    </div>
  );
}

const SECTION_ANCHOR_LABELS: { id: SectionId; label: string }[] = [
  { id: 'personal', label: 'Personal details' },
  { id: 'passport', label: 'Passport details' },
  { id: 'travel', label: 'Travel details' },
  { id: 'accommodation', label: 'Accommodation' },
];

function FormScrollColumn({
  sections,
  travellerId: _travellerId,
  warningIndex: _warningIndex,
  onFieldEdit,
  onFieldConfirm,
  onSectionInView,
  warningScrollTrigger,
  onFormInteraction,
}: {
  sections: FormSection[];
  travellerId: string;
  warningIndex: number;
  onFieldEdit: (fId: string, v: string) => void;
  onFieldConfirm: (fId: string) => void;
  onSectionInView: (sectionId: string) => void;
  warningScrollTrigger: { fieldId: string; seq: number } | null;
  onFormInteraction: () => void;
}) {
  const { token } = useToken();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastSeqRef = useRef<number | null>(null);

  const warningFields = useMemo(
    () => sections.flatMap((s) => s.fields).filter((f) => f.status !== 'clean' && !f.resolved),
    [sections]
  );

  // Warning scroll trigger effect
  useEffect(() => {
    if (!warningScrollTrigger) return;
    if (warningScrollTrigger.seq === lastSeqRef.current) return;
    lastSeqRef.current = warningScrollTrigger.seq;
    const el = fieldRefs.current[warningScrollTrigger.fieldId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [warningScrollTrigger]);

  // IntersectionObserver for section spy
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const sectionId = (entry.target as HTMLElement).dataset.sectionId;
            if (sectionId) onSectionInView(sectionId);
          }
        }
      },
      { root: container, threshold: 0, rootMargin: '-10% 0px -60% 0px' }
    );

    for (const [sectionId, el] of Object.entries(sectionRefs.current)) {
      if (el) {
        el.dataset.sectionId = sectionId;
        observer.observe(el);
      }
    }

    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  const handleAnchorClick = (sectionId: string) => {
    onFormInteraction();
    const el = sectionRefs.current[sectionId];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Sticky anchor nav */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: token.colorBgContainer,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          display: 'flex',
          gap: 0,
          flexShrink: 0,
        }}
      >
        {SECTION_ANCHOR_LABELS.map((s) => (
          <button
            key={s.id}
            onClick={() => handleAnchorClick(s.id)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: 11,
              color: token.colorTextSecondary,
              whiteSpace: 'nowrap',
              borderBottom: '2px solid transparent',
              transition: 'color 0.1s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = token.colorPrimary; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = token.colorTextSecondary; }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div ref={scrollContainerRef} style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map((section) => (
          <FormSectionBlock
            key={section.sectionId}
            section={section}
            sectionRef={(el) => { sectionRefs.current[section.sectionId] = el; }}
            fieldRefs={fieldRefs}
            warningFieldId={warningScrollTrigger?.fieldId ?? null}
            warningFields={warningFields}
            onFieldEdit={onFieldEdit}
            onFieldConfirm={onFieldConfirm}
            onFormInteraction={onFormInteraction}
          />
        ))}
      </div>
    </div>
  );
}

function DocumentCard({
  doc,
  isSynced,
  cardRef,
  onExpand,
}: {
  doc: TravellerDocument;
  isSynced: boolean;
  cardRef: (el: HTMLDivElement | null) => void;
  onExpand: () => void;
}) {
  const { token } = useToken();
  const initials = doc.label.split(/[\s—]+/).map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase();

  return (
    <div
      ref={cardRef}
      onClick={onExpand}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: isSynced ? '14px 12px' : '8px 12px',
        cursor: 'pointer',
        position: 'relative',
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        transition: 'background 0.1s, padding 0.2s',
        background: isSynced ? token.colorPrimaryBg : 'transparent',
      }}
      onMouseEnter={(e) => { if (!isSynced) (e.currentTarget as HTMLElement).style.background = token.colorFillTertiary; }}
      onMouseLeave={(e) => { if (!isSynced) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
    >
      {isSynced && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            background: token.colorPrimary,
            color: '#fff',
            fontSize: 9,
            fontWeight: 600,
            borderRadius: 3,
            padding: '1px 5px',
          }}
        >
          synced
        </div>
      )}
      <div
        style={{
          /* Synced card fills ~90% of pane width; non-synced sits at ~55% */
          width: isSynced ? 'calc(100% - 24px)' : '55%',
          maxWidth: isSynced ? 480 : 160,
          aspectRatio: '3 / 4',
          borderRadius: isSynced ? 7 : 5,
          background: doc.thumbnailColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isSynced ? 32 : 16,
          fontWeight: 700,
          color: 'rgba(0,0,0,0.28)',
          border: isSynced ? `2.5px solid ${token.colorPrimary}` : `1.5px solid ${token.colorBorderSecondary}`,
          transition: 'width 0.2s, border 0.15s, border-radius 0.15s',
          flexShrink: 0,
        }}
      >
        {initials}
      </div>
      <div style={{ fontSize: isSynced ? 12 : 10, fontWeight: isSynced ? 500 : 400, color: token.colorText, textAlign: 'center', lineHeight: 1.3 }}>{doc.label}</div>
    </div>
  );
}

function DocumentScrollPane({
  documents,
  activeSectionId,
  syncMode,
  onManualScroll,
}: {
  documents: TravellerDocument[];
  activeSectionId: string | null;
  syncMode: 'auto' | 'manual';
  onManualScroll: () => void;
}) {
  const { token } = useToken();
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const docCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastSyncedDocIdRef = useRef<string | null>(null);

  // Find synced document
  const syncedDoc = useMemo(() => {
    if (!activeSectionId) return null;
    return documents.find((d) => d.relatedSectionIds.includes(activeSectionId as SectionId)) ?? null;
  }, [documents, activeSectionId]);

  // Auto-scroll effect
  useEffect(() => {
    if (syncMode !== 'auto') return;
    if (!syncedDoc) return;
    if (syncedDoc.docId === lastSyncedDocIdRef.current) return;
    lastSyncedDocIdRef.current = syncedDoc.docId;
    const container = scrollContainerRef.current;
    const cardEl = docCardRefs.current[syncedDoc.docId];
    if (container && cardEl) {
      container.scrollTo({ top: cardEl.offsetTop, behavior: 'smooth' });
    }
  }, [syncedDoc, syncMode]);

  if (documents.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
          No documents mapped yet — return to Map documents stage.
        </Text>
      </div>
    );
  }

  const expandedDoc = expandedDocId ? documents.find((d) => d.docId === expandedDocId) : null;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Expanded overlay */}
      {expandedDoc && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: token.colorBgContainer,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <button
            onClick={() => setExpandedDocId(null)}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: token.colorTextSecondary,
            }}
          >
            ×
          </button>
          <div
            style={{
              width: '80%',
              maxWidth: 200,
              aspectRatio: '3/4',
              background: expandedDoc.thumbnailColor,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.25)',
            }}
          >
            {expandedDoc.label.split(/[\s—]+/).map((w) => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase()}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, fontWeight: 500, color: token.colorText }}>{expandedDoc.label}</div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={onManualScroll}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {documents.map((doc) => (
          <DocumentCard
            key={doc.docId}
            doc={doc}
            isSynced={syncMode === 'auto' && syncedDoc?.docId === doc.docId}
            cardRef={(el) => { docCardRefs.current[doc.docId] = el; }}
            onExpand={() => setExpandedDocId(doc.docId)}
          />
        ))}
      </div>
    </div>
  );
}

function FormVerificationBody({
  travellers,
  fieldsByTraveller,
  docsByTraveller,
  selectedTravellerId,
  warningIndex,
  docSync,
  onSelectTraveller,
  onFieldEdit,
  onFieldConfirm,
  onWarningIndexChange,
  onDocSyncChange,
  navigate,
  exitPath,
}: {
  travellers: TravellerDoc[];
  fieldsByTraveller: Record<string, FormSection[]>;
  docsByTraveller: Record<string, TravellerDocument[]>;
  selectedTravellerId: string | null;
  warningIndex: Record<string, number>;
  docSync: DocumentSyncState;
  onSelectTraveller: (id: string) => void;
  onFieldEdit: (travellerId: string, fieldId: string, value: string) => void;
  onFieldConfirm: (travellerId: string, fieldId: string) => void;
  onWarningIndexChange: (travellerId: string, idx: number) => void;
  onDocSyncChange: (s: DocumentSyncState) => void;
  navigate: (path: string) => void;
  exitPath: string;
}) {
  const { token } = useToken();
  const [warningScrollTrigger, setWarningScrollTrigger] = useState<{ fieldId: string; seq: number } | null>(null);
  const [localActiveSectionId, setLocalActiveSectionId] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  const [docsVisible, setDocsVisible] = useState(true);

  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isNarrow = windowWidth < 1100;
  // Wide: always show. Narrow: toggle-able overlay.
  const showDocsPanel = !isNarrow || docsVisible;

  // Auto-select first traveller on mount
  useEffect(() => {
    if (!selectedTravellerId && travellers.length > 0) {
      onSelectTraveller(String(travellers[0].id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSections = selectedTravellerId ? (fieldsByTraveller[selectedTravellerId] ?? []) : [];
  const currentDocs = selectedTravellerId ? (docsByTraveller[selectedTravellerId] ?? []) : [];
  const currentWarningIdx = selectedTravellerId ? (warningIndex[selectedTravellerId] ?? 0) : 0;

  const warningFields = useMemo(
    () => currentSections.flatMap((s) => s.fields).filter((f) => f.status !== 'clean' && !f.resolved),
    [currentSections]
  );

  const handleSectionInView = useCallback((sectionId: string) => {
    setLocalActiveSectionId(sectionId);
    if (docSync.mode === 'auto') {
      onDocSyncChange({ mode: 'auto', activeSectionId: sectionId });
    }
  }, [docSync.mode, onDocSyncChange]);

  const handleFormInteraction = useCallback(() => {
    onDocSyncChange({ mode: 'auto', activeSectionId: localActiveSectionId });
  }, [localActiveSectionId, onDocSyncChange]);

  const handleScrollToField = useCallback((fieldId: string) => {
    setWarningScrollTrigger({ fieldId, seq: Date.now() });
    handleFormInteraction();
  }, [handleFormInteraction]);

  const handleManualScroll = useCallback(() => {
    onDocSyncChange({ ...docSync, mode: 'manual' });
  }, [docSync, onDocSyncChange]);

  const hasWarnings = warningFields.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Warning bar / top controls bar */}
      {(hasWarnings || isNarrow) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            padding: '6px 16px',
            flexShrink: 0,
            gap: 8,
            background: token.colorBgContainer,
          }}
        >
          <div style={{ width: 200, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            {hasWarnings && selectedTravellerId && (
              <WarningNavigator
                sections={currentSections}
                warningIndex={currentWarningIdx}
                onIndexChange={(i) => {
                  if (selectedTravellerId) onWarningIndexChange(selectedTravellerId, i);
                }}
                onScrollToField={handleScrollToField}
              />
            )}
          </div>
          {isNarrow && (
            <Button
              size="small"
              type={docsVisible ? 'primary' : 'default'}
              onClick={() => setDocsVisible((v) => !v)}
              style={{ fontSize: 11, flexShrink: 0 }}
            >
              {docsVisible ? 'Hide documents' : '📄 Documents'}
            </Button>
          )}
        </div>
      )}

      {/* Main 3-col layout */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {/* Left pane — traveller list */}
        <div
          style={{
            width: 200,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: token.colorTextTertiary,
              background: token.colorFillTertiary,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              flexShrink: 0,
            }}
          >
            TRAVELLERS
          </div>
          <TravellerList
            travellers={travellers}
            fieldsByTraveller={fieldsByTraveller}
            selectedId={selectedTravellerId}
            onSelect={(id) => {
              onSelectTraveller(id);
              onDocSyncChange({ mode: 'auto', activeSectionId: null });
            }}
          />
        </div>

        {/* Center pane — form scroll */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selectedTravellerId ? (
            <FormScrollColumn
              sections={currentSections}
              travellerId={selectedTravellerId}
              warningIndex={currentWarningIdx}
              onFieldEdit={(fId, v) => onFieldEdit(selectedTravellerId, fId, v)}
              onFieldConfirm={(fId) => onFieldConfirm(selectedTravellerId, fId)}
              onSectionInView={handleSectionInView}
              warningScrollTrigger={warningScrollTrigger}
              onFormInteraction={handleFormInteraction}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary" style={{ fontSize: 12 }}>Select a traveller</Text>
            </div>
          )}
        </div>

        {/* Right pane — documents */}
        {showDocsPanel && (
        <div
          style={isNarrow ? {
            // Narrow: overlay on right edge of the 3-col container
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: 320,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            background: token.colorBgContainer,
            zIndex: 20,
            boxShadow: '-4px 0 16px rgba(0,0,0,0.10)',
          } : {
            // Wide: equal split alongside center pane
            flex: 1,
            borderLeft: `1px solid ${token.colorBorderSecondary}`,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: '0.05em',
              color: token.colorTextTertiary,
              background: token.colorFillTertiary,
              borderBottom: `1px solid ${token.colorBorderSecondary}`,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>DOCUMENTS</span>
            {docSync.mode === 'manual' && (
              <button
                onClick={handleFormInteraction}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 9,
                  color: token.colorPrimary,
                  padding: 0,
                }}
              >
                Resume sync
              </button>
            )}
          </div>
          <DocumentScrollPane
            documents={currentDocs}
            activeSectionId={docSync.activeSectionId}
            syncMode={docSync.mode}
            onManualScroll={handleManualScroll}
          />
        </div>
        )}
      </div>

      {/* Verification footer */}
      {(() => {
        const allFields = Object.values(fieldsByTraveller).flat().flatMap((s) => s.fields);
        const totalWarnings = allFields.filter((f) => f.status !== 'clean').length;
        const unresolvedWarnings = allFields.filter((f) => f.status !== 'clean' && !f.resolved).length;
        const cleanCount = allFields.length - totalWarnings;

        const handleDone = () => {
          if (unresolvedWarnings > 0) {
            const currentFields = selectedTravellerId ? (fieldsByTraveller[selectedTravellerId] ?? []) : [];
            const unresolvedFields = currentFields.flatMap((s) => s.fields).filter((f) => f.status !== 'clean' && !f.resolved);
            const fieldNames = unresolvedFields.map((f) => `• ${f.label}`).join('\n');
            Modal.confirm({
              title: 'Unresolved warnings',
              content: (
                <div>
                  <p style={{ marginBottom: 8 }}>The following fields still have unresolved warnings:</p>
                  <pre style={{ fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{fieldNames}</pre>
                </div>
              ),
              okText: 'Continue anyway',
              cancelText: 'Cancel',
              onOk: () => navigate(exitPath),
            });
          } else {
            navigate(exitPath);
          }
        };

        return (
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
            <Text type="secondary" style={{ fontSize: 11 }}>
              {cleanCount} of {allFields.length} fields clean
              {unresolvedWarnings > 0 ? `, ${unresolvedWarnings} warning${unresolvedWarnings !== 1 ? 's' : ''} need attention` : ''}
            </Text>
            <Button type="primary" onClick={handleDone}>
              Done, return to order
            </Button>
          </div>
        );
      })()}
    </div>
  );
}

// ─── SpotCheckEntryBanner ─────────────────────────────────────────────────────

function SpotCheckEntryBanner({ reason, onDismiss }: { reason: string; onDismiss: () => void }) {
  const { token } = useToken();
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      background: '#E6F4FF',
      borderBottom: `1px solid ${token.colorPrimaryBorder}`,
      flexShrink: 0,
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>🔍</span>
        <span style={{ fontSize: 12, color: token.colorPrimaryText ?? token.colorPrimary }}>
          Spot check — {reason}
        </span>
      </div>
      <button
        onClick={onDismiss}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: token.colorTextSecondary, lineHeight: 1, padding: '0 2px' }}
      >
        ×
      </button>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DocumentMapping() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const spotCheck = searchParams.get('spotCheck') === '1';
  const spotCheckTravellerId = searchParams.get('travellerId');
  const spotCheckReason = searchParams.get('reason') ?? '';
  const spotCheckLandingStage = (searchParams.get('landingStage') as Stage | null) ?? 'mapping';

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

  // Stage
  const [activeStage, setActiveStage] = useState<Stage>(spotCheck ? spotCheckLandingStage : 'mapping');

  // Spot check banner
  const [showSpotCheckBanner, setShowSpotCheckBanner] = useState(spotCheck);

  // Verification state
  const [verifSelectedTravellerId, setVerifSelectedTravellerId] = useState<string | null>(spotCheck ? spotCheckTravellerId : null);
  const [verifFieldsByTraveller, setVerifFieldsByTraveller] = useState<Record<string, FormSection[]>>({});
  const [verifDocsByTraveller, setVerifDocsByTraveller] = useState<Record<string, TravellerDocument[]>>({});
  const [verifWarningIndex, setVerifWarningIndex] = useState<Record<string, number>>({});
  const [verifDocSync, setVerifDocSync] = useState<DocumentSyncState>({ mode: 'auto', activeSectionId: null });

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

    const fieldsByT: Record<string, FormSection[]> = {};
    const docsByT: Record<string, TravellerDocument[]> = {};
    mockTravellers.forEach((t, idx) => {
      fieldsByT[String(t.id)] = generateFormSections(idx);
      docsByT[String(t.id)] = generateTravellerDocuments(String(t.id));
    });
    setVerifFieldsByTraveller(fieldsByT);
    setVerifDocsByTraveller(docsByT);
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

  // Verification handlers
  const handleVerifFieldEdit = useCallback((travellerId: string, fieldId: string, value: string) => {
    setVerifFieldsByTraveller((prev) => ({
      ...prev,
      [travellerId]: (prev[travellerId] ?? []).map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.fieldId === fieldId ? { ...f, value, resolved: true } : f
        ),
      })),
    }));
  }, []);

  const handleVerifFieldConfirm = useCallback((travellerId: string, fieldId: string) => {
    setVerifFieldsByTraveller((prev) => ({
      ...prev,
      [travellerId]: (prev[travellerId] ?? []).map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.fieldId === fieldId ? { ...f, resolved: true } : f
        ),
      })),
    }));
  }, []);

  const handleVerifSelectTraveller = useCallback((id: string) => {
    setVerifSelectedTravellerId(id);
    setVerifDocSync({ mode: 'auto', activeSectionId: null });
  }, []);

  const handleVerifWarningIndexChange = useCallback((travellerId: string, idx: number) => {
    setVerifWarningIndex((prev) => ({ ...prev, [travellerId]: idx }));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) return;
      if (rejectModalOpen) return;
      if (activeStage !== 'mapping') return;
      if (e.key === 'Enter') handleConfirm();
      if (e.key === 's' || e.key === 'S') handleSkip();
      if (e.key === 'r' || e.key === 'R') setRejectModalOpen(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleConfirm, handleSkip, rejectModalOpen, activeStage]);

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

  const verificationComplete = Object.values(verifFieldsByTraveller).every((sections) =>
    sections.every((s) => s.fields.every((f) => f.status === 'clean' || f.resolved))
  );

  const exitPath = spotCheck ? `/orders/${orderId}/checkpoint` : '/';

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
        activeStage={activeStage}
        onStageChange={setActiveStage}
        mappingComplete={allHandled}
        verificationComplete={verificationComplete}
        verifSelectedTravellerId={verifSelectedTravellerId}
        verifFieldsByTraveller={verifFieldsByTraveller}
        verifDocsByTraveller={verifDocsByTraveller}
        verifWarningIndex={verifWarningIndex}
        verifDocSync={verifDocSync}
        onVerifSelectTraveller={handleVerifSelectTraveller}
        onVerifFieldEdit={handleVerifFieldEdit}
        onVerifFieldConfirm={handleVerifFieldConfirm}
        onVerifWarningIndexChange={handleVerifWarningIndexChange}
        onVerifDocSyncChange={setVerifDocSync}
        onBack={() => navigate(spotCheck ? `/orders/${orderId}/checkpoint` : `/orders/${orderId}`)}
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
        navigate={navigate}

        spotCheckReason={spotCheckReason}
        showSpotCheckBanner={showSpotCheckBanner}
        onDismissSpotCheckBanner={() => setShowSpotCheckBanner(false)}
        exitPath={exitPath}
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
  activeStage,
  onStageChange,
  mappingComplete,
  verificationComplete,
  verifSelectedTravellerId,
  verifFieldsByTraveller,
  verifDocsByTraveller,
  verifWarningIndex,
  verifDocSync,
  onVerifSelectTraveller,
  onVerifFieldEdit,
  onVerifFieldConfirm,
  onVerifWarningIndexChange,
  onVerifDocSyncChange,
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
  navigate,
  spotCheckReason,
  showSpotCheckBanner,
  onDismissSpotCheckBanner,
  exitPath,
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
  activeStage: Stage;
  onStageChange: (s: Stage) => void;
  mappingComplete: boolean;
  verificationComplete: boolean;
  verifSelectedTravellerId: string | null;
  verifFieldsByTraveller: Record<string, FormSection[]>;
  verifDocsByTraveller: Record<string, TravellerDocument[]>;
  verifWarningIndex: Record<string, number>;
  verifDocSync: DocumentSyncState;
  onVerifSelectTraveller: (id: string) => void;
  onVerifFieldEdit: (travellerId: string, fieldId: string, value: string) => void;
  onVerifFieldConfirm: (travellerId: string, fieldId: string) => void;
  onVerifWarningIndexChange: (travellerId: string, idx: number) => void;
  onVerifDocSyncChange: (s: DocumentSyncState) => void;
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
  navigate: (path: string) => void;
  spotCheckReason: string;
  showSpotCheckBanner: boolean;
  onDismissSpotCheckBanner: () => void;
  exitPath: string;
}) {
  const { token } = useToken();
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
        {/* Left: back + order info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
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

        {/* Center: stage switcher */}
        <StageSwitcher
          active={activeStage}
          mappingComplete={mappingComplete}
          verificationComplete={verificationComplete}
          onChange={onStageChange}
        />

        {/* Right: progress (mapping) or empty (verification) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
          {activeStage === 'mapping' ? (
            <>
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
            </>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* ── Spot check banner ── */}
      {showSpotCheckBanner && (
        <SpotCheckEntryBanner reason={spotCheckReason} onDismiss={onDismissSpotCheckBanner} />
      )}

      {/* ── Body row ── */}
      {activeStage === 'mapping' ? (
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
      ) : (
        <FormVerificationBody
          travellers={travellers}
          fieldsByTraveller={verifFieldsByTraveller}
          docsByTraveller={verifDocsByTraveller}
          selectedTravellerId={verifSelectedTravellerId}
          warningIndex={verifWarningIndex}
          docSync={verifDocSync}
          onSelectTraveller={onVerifSelectTraveller}
          onFieldEdit={onVerifFieldEdit}
          onFieldConfirm={onVerifFieldConfirm}
          onWarningIndexChange={onVerifWarningIndexChange}
          onDocSyncChange={onVerifDocSyncChange}
          navigate={navigate}
          exitPath={exitPath}
        />
      )}

      {/* ── Footer (mapping only) ── */}
      {activeStage === 'mapping' && (
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
      )}

      {/* ── Reject modal ── */}
      <RejectModal open={rejectModalOpen} onCancel={onCloseReject} onConfirm={onReject} />

      {/* Suppress unused tooltip import */}
      {false && <Tooltip title=""><span /></Tooltip>}
    </div>
  );
}
