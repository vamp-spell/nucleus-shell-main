import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Modal, Tooltip, Dropdown, ConfigProvider } from 'antd';
import {
  BackArrowIcon,
  CircleCheckIcon,
  CircleXIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  FileIcon,
  MinusIcon,
  PlusIcon,
  CheckIcon,
  WarningIcon,
} from './icons';
import { getVerdictQCData, type FieldCheck, type VerdictDocument } from '../data/verdictQC';

type Resolution = 'match' | 'confirmed_fail';

function docTypeIcon(_type: VerdictDocument['type']) {
  return <FileIcon className="w-[14px] h-[14px]" />;
}

function VerdictBadge({ verdict, overrides, confirmedFails, totalChecks, totalFails }: {
  verdict: 'approved' | 'rejected';
  overrides: number;
  confirmedFails: number;
  totalChecks: number;
  totalFails: number;
}) {
  const passCount = totalChecks - totalFails + overrides;
  let noteText = '';
  if (totalFails === 0) {
    noteText = `${totalChecks} checks passed · no issues found`;
  } else if (confirmedFails > 0) {
    noteText = `${confirmedFails} failure${confirmedFails > 1 ? 's' : ''} confirmed · logged`;
  } else if (overrides > 0) {
    noteText = `${passCount} checks passed · ${overrides} override${overrides > 1 ? 's' : ''} applied`;
  } else {
    noteText = `${totalFails} check${totalFails > 1 ? 's' : ''} failed · ${totalChecks - totalFails} checks passed`;
  }

  const isApproved = verdict === 'approved';
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: isApproved ? '#F0FAF0' : '#FEF2F2',
        border: `1px solid ${isApproved ? '#3B6D11' : '#A32D2D'}`,
        borderRadius: 20,
        padding: '5px 12px',
        fontSize: 11, fontWeight: 500,
        color: isApproved ? '#3B6D11' : '#A32D2D',
      }}>
        {isApproved
          ? <CircleCheckIcon className="w-[13px] h-[13px]" />
          : <CircleXIcon className="w-[13px] h-[13px]" />}
        {isApproved ? 'Visa approved' : 'Visa rejected'}
      </div>
      <div style={{ fontSize: 10, color: '#888886', marginTop: 5, textAlign: 'center' }}>{noteText}</div>
    </div>
  );
}

function FailingCheckCard({ check, onMarkMatch, onConfirmFail }: {
  check: FieldCheck;
  onMarkMatch: () => void;
  onConfirmFail: () => void;
}) {
  return (
    <div style={{
      borderLeft: '3px solid #A32D2D',
      background: '#FEF2F2',
      borderRadius: '0 8px 8px 0',
      padding: '10px 12px',
      marginBottom: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A' }}>{check.fieldName}</span>
        <span style={{ fontSize: 10, fontWeight: 500, color: '#A32D2D' }}>Mismatch</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
          <span style={{ minWidth: 70, color: '#888886' }}>{check.sourceLabel}</span>
          <span style={{ fontWeight: 500, color: '#1A1A1A' }}>{check.sourceValue}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
          <span style={{ minWidth: 70, color: '#888886' }}>{check.documentLabel}</span>
          <span style={{ fontWeight: 500, color: '#A32D2D' }}>{check.documentValue}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={onMarkMatch}
          style={{
            flex: 1, height: 28, fontSize: 10, fontWeight: 500,
            border: '1px solid #185FA5', borderRadius: 6, color: '#185FA5',
            background: 'white', cursor: 'pointer',
          }}
        >
          Mark as match
        </button>
        <button
          onClick={onConfirmFail}
          style={{
            width: 100, height: 28, fontSize: 10,
            border: '1px solid #A32D2D', borderRadius: 6, color: '#A32D2D',
            background: 'white', cursor: 'pointer',
          }}
        >
          Confirm fail
        </button>
      </div>
    </div>
  );
}

function ResolvedCheckCard({ check, resolution }: { check: FieldCheck; resolution: Resolution }) {
  const isMatch = resolution === 'match';
  return (
    <div style={{
      borderLeft: `3px solid ${isMatch ? '#3B6D11' : '#A32D2D'}`,
      background: isMatch ? '#F0FAF0' : '#FEF2F2',
      borderRadius: '0 8px 8px 0',
      padding: '10px 12px',
      marginBottom: 8,
      display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {isMatch
          ? <CheckIcon className="w-[12px] h-[12px] text-[#3B6D11]" />
          : <CircleXIcon className="w-[12px] h-[12px] text-[#A32D2D]" />}
        <span style={{ fontSize: 12, fontWeight: 500, color: isMatch ? '#3B6D11' : '#A32D2D' }}>
          {check.fieldName} — {isMatch ? 'marked as match' : 'mismatch confirmed'}
        </span>
      </div>
      {isMatch && (
        <span style={{ fontSize: 10, color: '#888886' }}>
          {check.documentValue} · overridden by you
        </span>
      )}
    </div>
  );
}

function PassingCheckRow({ check }: { check: FieldCheck }) {
  return (
    <div style={{
      height: 32, paddingLeft: 12, paddingRight: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#F7F7F5', border: '0.5px solid #E8E8E5', borderRadius: 6,
      marginBottom: 4, fontSize: 11, color: '#1A1A1A',
    }}>
      <span>{check.fieldName}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <CheckIcon className="w-[11px] h-[11px] text-[#3B6D11]" />
        <span style={{ fontSize: 10, fontWeight: 500, color: '#3B6D11' }}>Match</span>
      </div>
    </div>
  );
}

function DocumentFieldGrid({ doc, resolutions, large }: {
  doc: VerdictDocument;
  resolutions: Record<string, Resolution>;
  large?: boolean;
}) {
  const failingFieldNames = new Set(
    doc.checks.filter(c => c.aiResult === 'fail').map(c => c.fieldName)
  );

  const fields = doc.documentFields;
  const fontSize = large ? 13 : 11;
  const labelSize = large ? 10 : 10;

  if (!doc.isAIChecked && doc.checks.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 16px', gap: 8 }}>
        <FileIcon className="w-[24px] h-[24px] text-[#AAAAAA]" />
        <span style={{ fontSize: 12, color: '#888886', textAlign: 'center' }}>{doc.name}<br />Not used in AI QC checks</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, padding: large ? '16px' : '0' }}>
      {fields.map((f) => {
        const isFailCheck = failingFieldNames.has(f.name) || f.isFailingField;
        const check = doc.checks.find(c => c.fieldName === f.name);
        const res = check ? resolutions[check.id] : undefined;
        const isResolved = res === 'match';
        const isConfirmedFail = res === 'confirmed_fail';

        let bg = large ? '#F7F7F5' : '#F7F7F5';
        let outline = 'none';
        let tag: string | null = null;
        let valueColor = '#1A1A1A';

        if (isFailCheck && !isResolved && !isConfirmedFail) {
          bg = '#FEF2F2';
          if (large) { outline = '2px solid #A32D2D'; tag = 'Mismatch'; }
          valueColor = '#A32D2D';
        } else if (isResolved) {
          bg = '#F0FAF0';
          if (large) { outline = '2px solid #3B6D11'; tag = 'Overridden'; }
        } else if (isConfirmedFail) {
          bg = '#FEF2F2';
          if (large) { outline = '2px solid #A32D2D'; tag = 'Fail confirmed'; }
          valueColor = '#A32D2D';
        }

        return (
          <div key={f.name} style={{
            background: bg,
            outline,
            outlineOffset: 2,
            borderRadius: 6,
            padding: large ? '10px 12px' : '6px 10px',
            position: 'relative',
          }}>
            {tag && large && (
              <div style={{
                position: 'absolute', top: 6, right: 8,
                fontSize: 10, background: isResolved ? '#3B6D11' : '#A32D2D',
                color: 'white', borderRadius: 4, padding: '1px 5px',
              }}>
                {tag}
              </div>
            )}
            <div style={{ fontSize: labelSize, color: '#888886', marginBottom: 2 }}>{f.name}</div>
            <div style={{ fontSize, fontWeight: 500, color: valueColor, wordBreak: 'break-all' }}>{f.value}</div>
          </div>
        );
      })}
    </div>
  );
}

function VerdictQCPageInner() {
  const { orderId = '', travellerId = '' } = useParams<{ orderId: string; travellerId: string }>();
  const navigate = useNavigate();

  const data = getVerdictQCData(orderId, travellerId);

  const firstDocWithFailures = data?.documents.find(d => d.isAIChecked && (d.failCount ?? 0) > 0);
  const firstAIDoc = data?.documents.find(d => d.isAIChecked);
  const initialDocId = firstDocWithFailures?.id ?? firstAIDoc?.id ?? data?.documents[0]?.id ?? '';

  const [selectedDocId, setSelectedDocId] = useState(initialDocId);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [retryOpen, setRetryOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);

  const allChecks = useMemo(() => data?.documents.flatMap(d => d.checks) ?? [], [data]);
  const allFailing = allChecks.filter(c => c.aiResult === 'fail');
  const unresolved = allFailing.filter(c => !resolutions[c.id]);
  const overrides = allFailing.filter(c => resolutions[c.id] === 'match');
  const confirmedFails = allFailing.filter(c => resolutions[c.id] === 'confirmed_fail');

  const canConfirm = unresolved.length === 0 && !isConfirmed;
  const confirmVerdict: 'approved' | 'rejected' = confirmedFails.length > 0 ? 'rejected' : 'approved';
  const currentAIVerdict: 'approved' | 'rejected' = confirmedFails.length > 0 ? 'rejected'
    : (allFailing.length === 0 || allFailing.every(c => resolutions[c.id] === 'match')) ? 'approved'
    : 'rejected';

  const selectedDoc = data?.documents.find(d => d.id === selectedDocId) ?? data?.documents[0];

  const pendingTravellers = (data?.order.travellers ?? []).filter(
    t => t.hasPendingQC && t.id !== travellerId
  );

  function resolve(checkId: string, resolution: Resolution) {
    setResolutions(prev => ({ ...prev, [checkId]: resolution }));
  }

  function handleConfirm() {
    setIsConfirmed(true);
    setConfirmOpen(false);
    setTimeout(() => navigate(`/orders/${orderId}`, { replace: true }), 600);
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 14, color: '#888886' }}>QC data not found.</span>
      </div>
    );
  }

  const { traveller, documents, order } = data;
  const currentIdx = order.travellers.findIndex(t => t.id === travellerId);

  const selectedDocChecks = selectedDoc?.checks ?? [];
  const selectedDocFailing = selectedDocChecks.filter(c => c.aiResult === 'fail');
  const selectedDocPassing = selectedDocChecks.filter(c => c.aiResult === 'pass');
  const passedCount = selectedDocChecks.filter(c => c.aiResult === 'pass').length;
  const resolvedCount = selectedDocFailing.filter(c => resolutions[c.id]).length;

  const MAX_PASSING_SHOWN = 4;
  const passingToShow = selectedDocPassing.slice(0, MAX_PASSING_SHOWN);
  const extraPassing = selectedDocPassing.length - MAX_PASSING_SHOWN;

  const firstNamePart = traveller.name.split(' ')[0];

  const aiCheckedDocs = documents.filter(d => d.isAIChecked);
  const nonCheckedDocs = documents.filter(d => !d.isAIChecked);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#FFFFFF', overflow: 'hidden' }}>
      <style>{`
        @keyframes verdictPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>

      {/* Top bar */}
      <div style={{
        height: 48, borderBottom: '1px solid #E8E8E5',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0, background: 'white',
      }}>
        {/* Left: back + breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate(`/orders/${orderId}`)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#F1EFE8')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <BackArrowIcon className="w-4 h-4 text-[#888886]" />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: '#888886' }}>{order.orderRef}</span>
            <span style={{ color: '#CCCCCA' }}>/</span>
            <span style={{ color: '#1A1A1A', fontWeight: 500 }}>Verdict QC · {firstNamePart}</span>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Retry AI QC */}
          <button
            onClick={() => !isConfirmed && setRetryOpen(true)}
            disabled={isConfirmed}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', borderRadius: 6,
              border: '1px solid #E8E8E5', background: 'white',
              fontSize: 12, color: isConfirmed ? '#AAAAAA' : '#1A1A1A',
              cursor: isConfirmed ? 'not-allowed' : 'pointer',
            }}
          >
            <RefreshCwIcon className="w-[13px] h-[13px]" />
            Retry AI QC
          </button>

          {/* Pending travellers */}
          <Dropdown
            open={pendingOpen}
            onOpenChange={setPendingOpen}
            trigger={['click']}
            menu={{
              items: pendingTravellers.length === 0
                ? [{ key: 'none', label: <span style={{ fontSize: 12, color: '#888886' }}>No pending travellers</span>, disabled: true }]
                : pendingTravellers.map(t => ({
                    key: t.id,
                    label: <span style={{ fontSize: 12 }}>{t.name}</span>,
                    onClick: () => { setPendingOpen(false); navigate(`/orders/${orderId}/verdict-qc/${t.id}`); },
                  })),
            }}
          >
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 12px', borderRadius: 6,
              border: '1px solid #E8E8E5', background: 'white',
              fontSize: 12, color: '#1A1A1A', cursor: 'pointer',
            }}>
              <span>Pending travellers</span>
              {pendingTravellers.length > 0 && (
                <span style={{ background: '#E24B4A', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 600, padding: '0 5px', minWidth: 18, textAlign: 'center' }}>
                  {pendingTravellers.length}
                </span>
              )}
              <ChevronDownIcon className="w-[11px] h-[11px] text-[#888886]" />
            </button>
          </Dropdown>

          {/* Next */}
          <button
            onClick={() => {
              if (pendingTravellers.length > 0) navigate(`/orders/${orderId}/verdict-qc/${pendingTravellers[0].id}`);
            }}
            disabled={pendingTravellers.length === 0}
            style={{
              height: 32, padding: '0 14px', borderRadius: 6,
              border: '1px solid #E8E8E5', background: pendingTravellers.length > 0 ? '#F7F7F5' : 'white',
              fontSize: 12, color: pendingTravellers.length > 0 ? '#1A1A1A' : '#AAAAAA',
              cursor: pendingTravellers.length > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            Next →
          </button>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ──── LEFT NAV ──── */}
        <div style={{ width: 200, borderRight: '1px solid #E8E8E5', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>

          {/* Traveller info */}
          <div style={{ padding: '12px 12px 10px', borderBottom: '1px solid #E8E8E5', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 2 }}>
              {traveller.name}
            </div>
            <div style={{ fontSize: 11, color: '#888886', marginBottom: 10 }}>
              {traveller.passportNumber} · {traveller.country}
            </div>
            {/* Progress bar */}
            <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
              {order.travellers.map((t) => (
                <div key={t.id} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: t.id === travellerId ? '#185FA5'
                    : !t.hasPendingQC ? '#3B6D11'
                    : '#E8E8E5',
                }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#AAAAAA' }}>
              {currentIdx + 1} of {order.totalTravellers} travellers
            </div>
          </div>

          {/* Document list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {aiCheckedDocs.map(doc => {
              const hasFails = (doc.failCount ?? 0) > 0;
              const unresolvedFails = doc.checks.filter(c => c.aiResult === 'fail' && !resolutions[c.id]).length;
              const isActive = doc.id === selectedDocId;
              return (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocId(doc.id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 10px',
                    background: isActive ? '#E6F1FB' : 'transparent',
                    border: isActive ? '0.5px solid #B3D4F5' : '0.5px solid transparent',
                    borderRadius: 4, marginBottom: 1, cursor: 'pointer',
                  }}
                >
                  <span style={{ color: isActive ? '#185FA5' : '#888886', flexShrink: 0 }}>
                    {docTypeIcon(doc.type)}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: isActive ? '#185FA5' : '#1A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.name}
                    </div>
                    {hasFails ? (
                      <div style={{ fontSize: 10, color: unresolvedFails > 0 ? '#A32D2D' : '#3B6D11', marginTop: 1 }}>
                        {unresolvedFails > 0 ? (
                          <><WarningIcon className="w-[9px] h-[9px] inline mr-0.5" />{unresolvedFails} check{unresolvedFails > 1 ? 's' : ''} failed</>
                        ) : (
                          <><CheckIcon className="w-[9px] h-[9px] inline mr-0.5" />{doc.checkCount} checks ✓</>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 10, color: '#3B6D11', marginTop: 1 }}>
                        <CheckIcon className="w-[9px] h-[9px] inline mr-0.5" />{doc.checkCount} checks ✓
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {nonCheckedDocs.length > 0 && (
              <>
                <div style={{ height: 1, background: '#E8E8E5', margin: '8px 10px' }} />
                {nonCheckedDocs.map(doc => {
                  const isActive = doc.id === selectedDocId;
                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      style={{
                        width: '100%', textAlign: 'left',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px',
                        background: isActive ? '#F7F7F5' : 'transparent',
                        border: '0.5px solid transparent',
                        borderRadius: 4, marginBottom: 1, cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: '#AAAAAA', flexShrink: 0 }}>{docTypeIcon(doc.type)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: '#888886', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                        <div style={{ fontSize: 10, color: '#AAAAAA', marginTop: 1 }}>Not checked</div>
                      </div>
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Verdict + confirm (pinned bottom) */}
          <div style={{ borderTop: '1px solid #E8E8E5', padding: 12, flexShrink: 0 }}>
            <VerdictBadge
              verdict={currentAIVerdict}
              overrides={overrides.length}
              confirmedFails={confirmedFails.length}
              totalChecks={allChecks.length}
              totalFails={allFailing.length}
            />
            <div style={{ marginTop: 10 }}>
              {isConfirmed ? (
                <div style={{ textAlign: 'center', fontSize: 11, color: '#888886' }}>
                  <CheckIcon className="w-[12px] h-[12px] inline mr-1 text-[#3B6D11]" />
                  Verdict confirmed
                </div>
              ) : (
                <Tooltip title={canConfirm ? '' : 'Resolve all checks before confirming'} placement="top">
                  <button
                    onClick={() => canConfirm && setConfirmOpen(true)}
                    disabled={!canConfirm}
                    style={{
                      width: '100%', height: 34, borderRadius: 6, border: 'none',
                      fontSize: 13, fontWeight: 500, cursor: canConfirm ? 'pointer' : 'not-allowed',
                      background: !canConfirm ? '#E8E8E5'
                        : confirmVerdict === 'approved' ? '#3B6D11' : '#A32D2D',
                      color: !canConfirm ? '#AAAAAA' : 'white',
                    }}
                  >
                    {!canConfirm ? 'Resolve all checks' :
                      confirmVerdict === 'approved'
                        ? `Confirm approved${overrides.length > 0 ? ` (${overrides.length} override)` : ''}`
                        : 'Confirm rejection'}
                  </button>
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {/* ──── CENTER PANEL ──── */}
        <div style={{ width: 360, borderRight: '1px solid #E8E8E5', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          {selectedDoc && (
            <>
              {/* Document header */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #E8E8E5', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A', marginBottom: 2 }}>{selectedDoc.name}</div>
                    <div style={{ fontSize: 11, color: '#888886' }}>{selectedDoc.subType}</div>
                  </div>
                  {selectedDoc.isAIChecked && (
                    <div style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 10, fontWeight: 500,
                      background: (selectedDoc.failCount ?? 0) > 0 && selectedDocFailing.filter(c => !resolutions[c.id]).length > 0 ? '#FEF2F2' : '#F0FAF0',
                      color: (selectedDoc.failCount ?? 0) > 0 && selectedDocFailing.filter(c => !resolutions[c.id]).length > 0 ? '#A32D2D' : '#3B6D11',
                    }}>
                      {selectedDocFailing.filter(c => !resolutions[c.id]).length > 0
                        ? `${selectedDocFailing.filter(c => !resolutions[c.id]).length} failed · ${passedCount} passed`
                        : `${passedCount + resolvedCount} passed`}
                    </div>
                  )}
                </div>
              </div>

              {/* Document field grid */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #E8E8E5', flexShrink: 0 }}>
                <DocumentFieldGrid doc={selectedDoc} resolutions={resolutions} />
              </div>

              {/* Checks section */}
              {selectedDoc.isAIChecked && (
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                  <div style={{ fontSize: 10, color: '#888886', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                    Checks on this document
                  </div>

                  {/* Failing checks first */}
                  {selectedDocFailing.map(check => {
                    const res = resolutions[check.id];
                    if (res) return <ResolvedCheckCard key={check.id} check={check} resolution={res} />;
                    return (
                      <FailingCheckCard
                        key={check.id}
                        check={check}
                        onMarkMatch={() => resolve(check.id, 'match')}
                        onConfirmFail={() => resolve(check.id, 'confirmed_fail')}
                      />
                    );
                  })}

                  {/* Passing checks */}
                  {passingToShow.map(check => <PassingCheckRow key={check.id} check={check} />)}
                  {extraPassing > 0 && (
                    <div style={{ fontSize: 10, color: '#888886', textAlign: 'center', paddingTop: 4 }}>
                      + {extraPassing} more passed
                    </div>
                  )}
                </div>
              )}
              {!selectedDoc.isAIChecked && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 12, color: '#888886' }}>Not used in AI QC checks</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* ──── RIGHT PANEL ──── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 280 }}>
          {/* Header */}
          <div style={{
            height: 48, borderBottom: '1px solid #E8E8E5', padding: '0 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <span style={{ fontSize: 11, color: '#888886' }}>{selectedDoc?.name} · zoomed</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button style={{ width: 24, height: 24, border: '1px solid #E8E8E5', borderRadius: 4, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MinusIcon className="w-[12px] h-[12px] text-[#888886]" />
              </button>
              <span style={{ fontSize: 11, color: '#888886', minWidth: 36, textAlign: 'center' }}>100%</span>
              <button style={{ width: 24, height: 24, border: '1px solid #E8E8E5', borderRadius: 4, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlusIcon className="w-[10px] h-[10px] text-[#888886]" />
              </button>
            </div>
          </div>

          {/* Zoomed content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {selectedDoc && selectedDoc.isAIChecked ? (
              <DocumentFieldGrid doc={selectedDoc} resolutions={resolutions} large />
            ) : selectedDoc ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10 }}>
                <FileIcon className="w-[32px] h-[32px] text-[#AAAAAA]" />
                <span style={{ fontSize: 12, color: '#888886', textAlign: 'center' }}>{selectedDoc.name}<br />Not used in AI QC checks</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Retry modal */}
      <Modal
        title="Retry AI QC"
        open={retryOpen}
        onOk={() => setRetryOpen(false)}
        onCancel={() => setRetryOpen(false)}
        okText="Retry"
        width={400}
        centered
      >
        <p style={{ fontSize: 13, color: '#444', marginBottom: 0 }}>
          This will re-run AI analysis on all documents for {traveller.name}.
          Any existing field check results will be replaced.
        </p>
      </Modal>

      {/* Confirm verdict modal */}
      <Modal
        title={`Confirm ${confirmVerdict}`}
        open={confirmOpen}
        onOk={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
        okText="Confirm"
        okButtonProps={{ danger: confirmVerdict === 'rejected' }}
        cancelText="Cancel"
        width={440}
        centered
      >
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: '#444', marginBottom: 12 }}>
            You have reviewed all {allChecks.length} check{allChecks.length !== 1 ? 's' : ''} for {traveller.name}.
            {overrides.length > 0 && (
              <> <strong>{overrides.length} override{overrides.length > 1 ? 's' : ''}</strong> applied.</>
            )}
          </p>
          {overrides.length > 0 && (
            <>
              <p style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>Overrides applied:</p>
              {overrides.map(c => (
                <div key={c.id} style={{ fontSize: 12, color: '#666', marginBottom: 4, paddingLeft: 12 }}>
                  · {c.fieldName}: {c.sourceValue} vs {c.documentValue} — marked as match
                </div>
              ))}
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function VerdictQCPage() {
  return (
    <ConfigProvider>
      <VerdictQCPageInner />
    </ConfigProvider>
  );
}
