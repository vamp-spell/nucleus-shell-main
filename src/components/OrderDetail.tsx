import { useState, useRef, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Select, Modal, Spin, Tooltip, ConfigProvider, Dropdown } from 'antd';
import { LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import CommsTab from "./CommsTab";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddOnsDrawer from "./AddOnsDrawer";
import { addOnStringsToSelections, selectionsToDisplayNames, type SelectedAddOn } from "../data/addons";
import {
  BackArrowIcon,
  CalendarIcon,
  CopyIcon,
  CheckIcon,
  MessageIcon,
  HistoryIcon,
  FolderArrowIcon,
  DotsHorizontalIcon,
  WarningIcon,
  NoteIcon,
  HashIcon,
  CreditCardIcon,
  WandIcon,
  CircleXIcon,
  RefreshCwIcon,
  CircleCheckIcon,
  PlusIcon,
  SendIcon,
  XIcon,
  ExternalLinkIcon,
} from "./icons";
import {
  newOrders,
  attentionOrders,
  progressOrders,
  submittedOrders,
  type Order,
} from "../data/orders";
import { getOrderDetail, type Traveller, type DraftState, type VerdictState } from "../data/orderDetails";

const ALL_ORDERS: Order[] = [...newOrders, ...attentionOrders, ...progressOrders, ...submittedOrders];

const VISA_BADGE: Record<string, { bg: string; color: string }> = {
  EXP: { bg: "#FAECE7", color: "#993C1D" },
  SFT: { bg: "#EAF3DE", color: "#3B6D11" },
  POP: { bg: "#E6F1FB", color: "#185FA5" },
};

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  New: { bg: "#E6F1FB", color: "#185FA5" },
  Processing: { bg: "#FAEEDA", color: "#854F0B" },
  Blocked: { bg: "#FCEBEB", color: "#A32D2D" },
  Submitted: { bg: "#EAF3DE", color: "#3B6D11" },
  Completed: { bg: "#EAF3DE", color: "#3B6D11" },
};

const SINGAPORE_JURISDICTIONS = ['Chennai', 'Mumbai', 'Delhi', 'Kolkata', 'Hyderabad', 'Bengaluru'];
const JURISDICTION_COUNTRIES = ['Singapore', 'Schengen'];
function isJurisdictionApplicable(country: string): boolean {
  return JURISDICTION_COUNTRIES.some(c => country.includes(c));
}

type TabId = "application" | "documents" | "comms" | "automation" | "vri";

interface EditingCell {
  travellerId: string;
  field: "jurisdiction" | "embassyRefId" | "card";
}

function AnimatedCount({ value }: { value: number }) {
  return (
    <span key={value} style={{ display: 'inline-block', animation: 'countUp 250ms ease-out' }}>
      {value}
    </span>
  );
}

function JurisdictionCell({
  travellerId,
  value,
  jurisdictionFlash,
  onSave,
}: {
  travellerId: string;
  value: string;
  jurisdictionFlash: Set<string>;
  onSave: (id: string, val: string) => void;
}) {
  const isFlashing = jurisdictionFlash.has(travellerId);
  return (
    <div
      style={{
        transition: 'background-color 600ms ease-out',
        backgroundColor: isFlashing ? '#F6FFED' : 'transparent',
        borderRadius: 4,
        padding: '2px 4px',
      }}
    >
      <Select
        size="small"
        value={value || undefined}
        placeholder={<span style={{ color: '#888886', fontSize: 11 }}>+ Add jurisdiction</span>}
        style={{ width: 140, fontSize: 11 }}
        variant="borderless"
        onChange={(val) => onSave(travellerId, val)}
        options={SINGAPORE_JURISDICTIONS.map(j => ({ label: j, value: j }))}
      />
    </div>
  );
}

function DraftCell({
  traveller,
  onOpenDraftModal,
}: {
  traveller: Traveller;
  onOpenDraftModal: (t: Traveller) => void;
}) {
  if (traveller.draftState === 'processing') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Spin size="small" />
        <span style={{ fontSize: 11, color: '#888886' }}>Drafting…</span>
      </div>
    );
  }

  if (traveller.draftState === 'locked') {
    return (
      <Tooltip title="Complete document mapping to unlock" placement="top">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#AAAAAA', cursor: 'not-allowed' }}>
          <LockOutlined style={{ fontSize: 12 }} />
          <span style={{ fontSize: 11 }}>Locked</span>
        </div>
      </Tooltip>
    );
  }

  if (traveller.draftState === 'ready') {
    return (
      <button
        type="button"
        onClick={() => onOpenDraftModal(traveller)}
        className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-[#1A1A1A] text-white text-[11px] font-medium cursor-pointer hover:bg-[#333333] transition-colors"
      >
        <WandIcon className="w-[12px] h-[12px]" />
        Draft
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <CheckCircleFilled
        style={{
          fontSize: 13,
          color: '#3B6D11',
          animation: 'draftedEntrance 300ms ease-out',
        }}
      />
      <span style={{ fontSize: 11, color: '#3B6D11', fontWeight: 500 }}>Drafted</span>
    </div>
  );
}

function VerdictCell({ traveller, onSetVerdict }: { traveller: Traveller; onSetVerdict: (id: string, v: VerdictState) => void }) {
  const { verdict, draftState } = traveller;

  const verdictMenu = {
    items: [
      {
        key: 'approved',
        label: (
          <div className="flex items-center gap-2 py-0.5">
            <CircleCheckIcon className="w-[13px] h-[13px] text-[#3B6D11]" />
            <span className="text-[12px]">Approved</span>
          </div>
        ),
        onClick: () => onSetVerdict(traveller.id, 'approved'),
      },
      {
        key: 'rejected',
        label: (
          <div className="flex items-center gap-2 py-0.5">
            <CircleXIcon className="w-[13px] h-[13px] text-[#A32D2D]" />
            <span className="text-[12px]">Rejected</span>
          </div>
        ),
        onClick: () => onSetVerdict(traveller.id, 'rejected'),
      },
    ],
  };

  if (verdict === "fetching") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-[#888886]">
        <RefreshCwIcon className="w-[12px] h-[12px] animate-spin" />
        <span>Fetching</span>
      </div>
    );
  }

  if (verdict === "approved") {
    return (
      <Dropdown menu={verdictMenu} trigger={['click']} placement="bottomLeft">
        <div className="flex items-center gap-1.5 text-[11px] text-[#3B6D11] font-medium cursor-pointer hover:opacity-75 transition-opacity">
          <CircleCheckIcon className="w-[13px] h-[13px]" />
          <span>Approved</span>
        </div>
      </Dropdown>
    );
  }

  if (verdict === "rejected") {
    return (
      <Dropdown menu={verdictMenu} trigger={['click']} placement="bottomLeft">
        <div className="flex items-center gap-1.5 text-[11px] text-[#A32D2D] font-medium cursor-pointer hover:opacity-75 transition-opacity">
          <CircleXIcon className="w-[13px] h-[13px]" />
          <span>Rejected</span>
        </div>
      </Dropdown>
    );
  }

  // none — show set button only if drafted
  if (draftState === 'drafted') {
    return (
      <Dropdown menu={verdictMenu} trigger={['click']} placement="bottomLeft">
        <button
          type="button"
          className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
        >
          <PlusIcon className="w-[10px] h-[10px]" />
          <span>Set verdict</span>
        </button>
      </Dropdown>
    );
  }

  return <span className="text-[12px] text-[#AAAAAA]">—</span>;
}

interface TravellerRowProps {
  traveller: Traveller;
  isSelected: boolean;
  editingCell: EditingCell | null;
  editValue: string;
  copiedEmbassyId: string | null;
  orderCountry: string;
  onToggleSelect: (id: string) => void;
  onStartEdit: (id: string, field: EditingCell["field"], value: string, e: MouseEvent) => void;
  onEditValueChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onOpenDraftModal: (t: Traveller) => void;
  onCopyEmbassyRef: (id: string, value: string, e: MouseEvent) => void;
  jurisdictionFlash: Set<string>;
  onSaveJurisdiction: (id: string, val: string) => void;
  onSetVerdict: (travellerId: string, verdict: VerdictState) => void;
}

type EditField = EditingCell["field"];

function EditableCell({
  travellerId,
  field,
  value,
  icon,
  placeholder,
  editingCell,
  editValue,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
}: {
  travellerId: string;
  field: EditField;
  value: string;
  icon: React.ReactNode;
  placeholder: string;
  editingCell: EditingCell | null;
  editValue: string;
  onStartEdit: (id: string, field: EditField, value: string, e: MouseEvent) => void;
  onEditValueChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isEditing = editingCell?.travellerId === travellerId && editingCell?.field === field;

  if (isEditing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={editValue}
          autoFocus
          onChange={(e) => onEditValueChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSaveEdit();
            if (e.key === "Escape") onCancelEdit();
          }}
          className="w-[100px] bg-white border border-[#185FA5] rounded px-2 py-1 text-[11px] text-[#1A1A1A] outline-none"
        />
        <button
          type="button"
          onClick={onSaveEdit}
          className="text-[10px] text-[#185FA5] font-medium cursor-pointer hover:underline"
        >
          Save
        </button>
      </div>
    );
  }

  if (!value) {
    return (
      <button
        type="button"
        onClick={(e) => onStartEdit(travellerId, field, "", e)}
        className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
      >
        <PlusIcon className="w-[10px] h-[10px]" />
        <span>{placeholder}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => onStartEdit(travellerId, field, value, e)}
      className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A] cursor-pointer hover:bg-[#F1EFE8] rounded px-1 py-0.5 transition-colors"
    >
      {icon}
      <span>{value}</span>
    </button>
  );
}

function TravellerRow({
  traveller,
  isSelected,
  editingCell,
  editValue,
  copiedEmbassyId,
  orderCountry,
  onToggleSelect,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onOpenDraftModal,
  onCopyEmbassyRef,
  jurisdictionFlash,
  onSaveJurisdiction,
  onSetVerdict,
}: TravellerRowProps) {
  return (
    <div className={`flex min-h-[52px] border-b border-[#F1EFE8] items-center ${isSelected ? "bg-[#F0F4FF]" : "bg-white hover:bg-[#F9F9F7]"} transition-colors`}>
      {/* Checkbox */}
      <div className="w-8 flex items-center justify-center px-2 shrink-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(traveller.id)}
          className="w-[13px] h-[13px] cursor-pointer accent-[#1A1A1A]"
        />
      </div>

      {/* Traveller */}
      <div className="flex-1 px-3 flex flex-col justify-center min-w-0">
        <span className="text-[13px] font-medium text-[#1A1A1A] truncate">{traveller.name}</span>
        <span className="text-[11px] text-[#888886] font-mono">{traveller.id}</span>
      </div>

      {/* Jurisdiction */}
      {isJurisdictionApplicable(orderCountry) && (
        <div className="flex-1 px-3 flex items-center">
          <JurisdictionCell
            travellerId={traveller.id}
            value={traveller.jurisdiction}
            jurisdictionFlash={jurisdictionFlash}
            onSave={onSaveJurisdiction}
          />
        </div>
      )}

      {/* Embassy Ref */}
      <div className="flex-1 px-3 flex items-center gap-1.5">
        <EditableCell
          travellerId={traveller.id}
          field="embassyRefId"
          value={traveller.embassyRefId}
          icon={<HashIcon className="w-[11px] h-[11px] text-[#888886]" />}
          placeholder="Add"
          editingCell={editingCell}
          editValue={editValue}
          onStartEdit={onStartEdit}
          onEditValueChange={onEditValueChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
        {traveller.embassyRefId && !(editingCell?.travellerId === traveller.id && editingCell?.field === "embassyRefId") && (
          <button
            type="button"
            onClick={(e) => onCopyEmbassyRef(traveller.id, traveller.embassyRefId, e)}
            className="flex items-center justify-center p-[3px] rounded hover:bg-[#E8E8E5] cursor-pointer"
            aria-label="Copy Embassy Ref"
          >
            <CopyIcon className={`w-[11px] h-[11px] ${copiedEmbassyId === traveller.id ? "text-[#3B6D11]" : "text-[#CCCCCA]"}`} />
          </button>
        )}
      </div>

      {/* Card */}
      <div className="flex-1 px-3 flex items-center">
        <EditableCell
          travellerId={traveller.id}
          field="card"
          value={traveller.card ? `···${traveller.card}` : ""}
          icon={<CreditCardIcon className="w-[11px] h-[11px] text-[#888886]" />}
          placeholder="Add"
          editingCell={editingCell}
          editValue={editValue}
          onStartEdit={(id, field, val, e) => {
            const raw = val.startsWith("···") ? val.slice(3) : val;
            onStartEdit(id, field, raw, e);
          }}
          onEditValueChange={onEditValueChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      </div>

      {/* Draft */}
      <div className="flex-1 px-3 flex items-center">
        <DraftCell traveller={traveller} onOpenDraftModal={onOpenDraftModal} />
      </div>

      {/* Verdict */}
      <div className="flex-1 px-3 flex items-center">
        <VerdictCell traveller={traveller} onSetVerdict={onSetVerdict} />
      </div>
    </div>
  );
}

interface ApplicationTabProps {
  travellers: Traveller[];
  editingCell: EditingCell | null;
  editValue: string;
  selectedIds: Set<string>;
  copiedEmbassyId: string | null;
  orderCountry: string;
  onStartEdit: (travellerId: string, field: EditingCell["field"], value: string, e: MouseEvent) => void;
  onEditValueChange: (v: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDraftModal: (t: Traveller) => void;
  onCopyEmbassyRef: (id: string, value: string, e: MouseEvent) => void;
  jurisdictionFlash: Set<string>;
  onSaveJurisdiction: (travellerId: string, value: string) => void;
  onSetVerdict: (travellerId: string, verdict: VerdictState) => void;
}

function ApplicationTab({
  travellers,
  editingCell,
  editValue,
  selectedIds,
  copiedEmbassyId,
  orderCountry,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDraftModal,
  onCopyEmbassyRef,
  jurisdictionFlash,
  onSaveJurisdiction,
  onSetVerdict,
}: ApplicationTabProps) {
  const draftedCount = travellers.filter((t) => t.draftState === "drafted").length;
  const selectedArray = Array.from(selectedIds);
  const readySelected = selectedArray.filter((id) => travellers.find((t) => t.id === id)?.draftState === "ready");

  if (travellers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-[13px] text-[#888886]">No travellers on this order</div>
        <div className="text-[11px] text-[#AAAAAA] mt-1">Add travellers to begin processing.</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Column headers */}
      <div className="flex bg-[#F7F7F5] border-b border-[#E8E8E5]">
        <div className="w-8 flex items-center justify-center px-2 py-[6px]">
          <input
            type="checkbox"
            checked={selectedIds.size === travellers.length && travellers.length > 0}
            onChange={onToggleSelectAll}
            className="w-[13px] h-[13px] cursor-pointer accent-[#1A1A1A]"
          />
        </div>
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Traveller</div>
        {isJurisdictionApplicable(orderCountry) && (
          <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Jurisdiction</div>
        )}
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Embassy Ref</div>
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Card</div>
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Draft</div>
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Verdict</div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-[#F0F4FF] border-b border-[#D0DCFF]">
          <span className="text-[12px] text-[#1A1A1A] font-medium">{selectedIds.size} traveller{selectedIds.size > 1 ? "s" : ""} selected</span>
          {readySelected.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const t = travellers.find(t => readySelected.includes(t.id));
                if (t) onOpenDraftModal(t);
              }}
              className="flex items-center gap-1.5 h-7 px-3 rounded-md bg-[#1A1A1A] text-white text-[11px] font-medium cursor-pointer hover:bg-[#333333]"
            >
              <WandIcon className="w-[12px] h-[12px]" />
              Draft selected
            </button>
          )}
          <button
            type="button"
            onClick={() => onToggleSelectAll()}
            className="text-[11px] text-[#888886] cursor-pointer hover:text-[#1A1A1A]"
          >
            Clear
          </button>
          {readySelected.length < selectedArray.length && (
            <span className="text-[10px] text-[#854F0B]">
              {selectedArray.length - readySelected.length} locked traveller{selectedArray.length - readySelected.length > 1 ? "s" : ""} will be skipped
            </span>
          )}
        </div>
      )}

      {/* Rows */}
      {travellers.map((traveller) => (
        <TravellerRow
          key={traveller.id}
          traveller={traveller}
          isSelected={selectedIds.has(traveller.id)}
          editingCell={editingCell}
          editValue={editValue}
          copiedEmbassyId={copiedEmbassyId}
          orderCountry={orderCountry}
          onToggleSelect={onToggleSelect}
          onStartEdit={onStartEdit}
          onEditValueChange={onEditValueChange}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
          onOpenDraftModal={onOpenDraftModal}
          onCopyEmbassyRef={onCopyEmbassyRef}
          jurisdictionFlash={jurisdictionFlash}
          onSaveJurisdiction={onSaveJurisdiction}
          onSetVerdict={onSetVerdict}
        />
      ))}

      {/* Footer */}
      <div className="px-4 py-3 border-t border-[#E8E8E5]">
        <span className="text-[11px] text-[#AAAAAA]">
          {travellers.length} traveller{travellers.length !== 1 ? 's' : ''} · <AnimatedCount value={draftedCount} /> drafted
        </span>
      </div>
    </div>
  );
}

function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-[13px] text-[#888886]">{label}</div>
      <div className="text-[11px] text-[#AAAAAA] mt-1">Coming soon.</div>
    </div>
  );
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarWidth = isExpanded ? 220 : 56;

  const order = ALL_ORDERS.find((o) => o.id === orderId);
  const detail = orderId ? getOrderDetail(orderId) : null;

  const [activeTab, setActiveTab] = useState<TabId>("application");
  const [chatOpen, setChatOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [travellers, setTravellers] = useState<Traveller[]>(detail?.travellers ?? []);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [draftModalTraveller, setDraftModalTraveller] = useState<Traveller | null>(null);
  const [jurisdictionFlash, setJurisdictionFlash] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState(detail?.chatMessages ?? []);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedEmbassyId, setCopiedEmbassyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastRef = useRef<number | null>(null);
  const [addOnsDrawerOpen, setAddOnsDrawerOpen] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOn[]>(
    detail ? addOnStringsToSelections(detail.addOns) : []
  );

  if (!order || !detail) {
    return (
      <div className="flex min-h-screen">
        <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
        <div className="flex-1 flex items-center justify-center" style={{ marginLeft: sidebarWidth }}>
          <div className="text-[14px] text-[#888886]">Order not found.</div>
        </div>
      </div>
    );
  }

  const visaBadge = VISA_BADGE[order.visaType] ?? { bg: "#F1EFE8", color: "#888886" };
  const statusBadge = STATUS_BADGE[detail.status] ?? { bg: "#F1EFE8", color: "#888886" };
  const unreadChat = order.chatUnread;
  const orderIdStr = order.id;

  function showToast(text: string) {
    if (toastRef.current !== null) clearTimeout(toastRef.current);
    setToast({ id: Date.now(), text });
    toastRef.current = window.setTimeout(() => setToast(null), 1800);
  }

  function handleCopyOrderId() {
    navigator.clipboard.writeText(orderIdStr);
    setCopiedOrderId(true);
    setTimeout(() => setCopiedOrderId(false), 1200);
    showToast(`${orderIdStr} copied`);
  }

  function handleCopyEmbassyRef(id: string, value: string, e: MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
    setCopiedEmbassyId(id);
    setTimeout(() => setCopiedEmbassyId(null), 1200);
    showToast("Embassy Ref copied");
  }

  function startEdit(travellerId: string, field: EditingCell["field"], currentValue: string, e: MouseEvent) {
    e.stopPropagation();
    setEditingCell({ travellerId, field });
    setEditValue(currentValue);
  }

  function saveEdit() {
    if (!editingCell) return;
    setTravellers((prev) =>
      prev.map((t) =>
        t.id === editingCell.travellerId ? { ...t, [editingCell.field]: editValue } : t
      )
    );
    setEditingCell(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditingCell(null);
    setEditValue("");
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === travellers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(travellers.map((t) => t.id)));
    }
  }

  function openDraftModal(traveller: Traveller) {
    setDraftModalTraveller(traveller);
  }

  function confirmDraft() {
    if (!draftModalTraveller) return;
    const tId = draftModalTraveller.id;
    setDraftModalTraveller(null);
    setTravellers(prev => prev.map(t => t.id === tId ? { ...t, draftState: 'processing' as DraftState } : t));
    setTimeout(() => {
      setTravellers(prev => prev.map(t => t.id === tId ? { ...t, draftState: 'drafted' as DraftState } : t));
      setSelectedIds(new Set());
    }, 1800);
  }

  function setVerdict(travellerId: string, verdict: VerdictState) {
    setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, verdict } : t));
  }

  function saveJurisdiction(travellerId: string, value: string) {
    setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, jurisdiction: value } : t));
    setJurisdictionFlash(prev => new Set([...prev, travellerId]));
    setTimeout(() => {
      setJurisdictionFlash(prev => { const n = new Set(prev); n.delete(travellerId); return n; });
    }, 700);
  }

  function sendChatMessage() {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { author: "Jitendra Kumar", text: chatInput.trim(), time: "Just now", isVE: true },
    ]);
    setChatInput("");
  }

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "application", label: "Application" },
    { id: "documents", label: "Documents", badge: order.docStatus === "uploaded" ? undefined : order.docStatus === "pending" ? 1 : undefined },
    { id: "comms", label: "Comms" },
    { id: "automation", label: "Automation logs" },
    { id: "vri", label: "Apply VRI" },
  ];

  return (
    <ConfigProvider>
      <div className="flex min-h-screen">
        <style>{`
          @keyframes countUp {
            from { transform: translateY(8px); opacity: 0; }
            to   { transform: translateY(0);   opacity: 1; }
          }
          @keyframes draftedEntrance {
            from { transform: scale(0.5); opacity: 0; }
            to   { transform: scale(1);   opacity: 1; }
          }
        `}</style>
        <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
        <div
          className="flex-1 min-h-screen bg-white flex flex-col transition-[margin-left] duration-200 ease-in-out"
          style={{ marginLeft: sidebarWidth }}
        >
          <Header />

          {/* Zone 1: Page Header Bar */}
          <div className="w-full h-12 bg-white border-b border-[#E8E8E5] flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-7 h-7 rounded hover:bg-[#F1EFE8] cursor-pointer"
                aria-label="Back to Orders"
              >
                <BackArrowIcon className="w-4 h-4 text-[#888886]" />
              </button>
              <span className="text-[12px] text-[#888886]">Orders</span>
              <span className="text-[12px] text-[#888886]">/</span>
              <span className="text-[12px] font-medium text-[#1A1A1A]">{order.id}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setChatOpen(true); setHistoryOpen(false); }}
                className="relative flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#F7F7F5] hover:bg-[#EEEEE9] cursor-pointer text-[12px] text-[#1A1A1A]"
              >
                <MessageIcon className="w-[14px] h-[14px]" />
                <span>Order Chat</span>
                {unreadChat && (
                  <span className="absolute -top-[3px] -right-[3px] w-2 h-2 bg-[#E24B4A] rounded-full" />
                )}
              </button>
              <button
                type="button"
                onClick={() => { setHistoryOpen(true); setChatOpen(false); }}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#F7F7F5] hover:bg-[#EEEEE9] cursor-pointer text-[12px] text-[#1A1A1A]"
              >
                <HistoryIcon className="w-[14px] h-[14px]" />
                <span>Order History</span>
              </button>
            </div>
          </div>

          {/* Zone 2: Order Identity Section */}
          <div className="px-5 pt-4 pb-4 border-b border-[#E8E8E5]">
            {/* Row 1 */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] text-[#888886]">{order.flag} {order.country}</span>
              <span
                className="text-[10px] font-medium px-[5px] py-[1px] rounded-[3px]"
                style={{ background: visaBadge.bg, color: visaBadge.color }}
              >
                {order.visaType}
              </span>
            </div>
            <div className="text-[16px] font-medium text-[#1A1A1A] mb-2">
              {order.visaCategory === "Single entry" ? "Tourist Visa" : "Business Visa"} · {order.visaType === "EXP" ? "30 days" : order.visaType === "SFT" ? "60 days" : "90 days"} · {order.visaCategory}
            </div>
            {/* Row 2 */}
            <div className="flex items-center gap-1.5 mb-3 text-[12px] text-[#666664]">
              <CalendarIcon className="w-[13px] h-[13px] text-[#888886]" />
              <span>{order.travelDateStart} – {order.travelDateEnd}</span>
              <span className="text-[#CCCCCA]">·</span>
              <span>{order.agency}</span>
            </div>
            {/* Row 3 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                {detail.paymentPaid ? (
                  <>
                    <CheckIcon className="w-[13px] h-[13px] text-[#3B6D11]" />
                    <span className="text-[12px] text-[#3B6D11] font-medium">Payment paid</span>
                  </>
                ) : (
                  <>
                    <WarningIcon className="w-[13px] h-[13px] text-[#854F0B]" />
                    <span className="text-[12px] text-[#854F0B] font-medium">Payment pending</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 max-w-[400px]">
                <NoteIcon className="w-[13px] h-[13px] text-[#888886] shrink-0" />
                {detail.taNote ? (
                  <span className="text-[12px] text-[#666664] overflow-hidden text-ellipsis whitespace-nowrap">{detail.taNote}</span>
                ) : (
                  <span className="text-[12px] text-[#AAAAAA]">No note from TA</span>
                )}
              </div>
            </div>
          </div>

          {/* Zone 3: Order Attribute Section */}
          <div className="px-5 py-3 bg-[#FAFAF8] border-b border-[#E8E8E5] flex items-center gap-6 flex-wrap">
            {/* Order ID */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#AAAAAA]">Order ID</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-[12px] text-[#1A1A1A]">{order.id}</span>
                <button
                  type="button"
                  onClick={handleCopyOrderId}
                  aria-label="Copy order ID"
                  className="flex items-center justify-center p-[3px] rounded hover:bg-[#E8E8E5] cursor-pointer"
                >
                  <CopyIcon className={`w-[12px] h-[12px] ${copiedOrderId ? "text-[#3B6D11]" : "text-[#888886]"}`} />
                </button>
              </div>
            </div>

            <div className="w-px h-8 bg-[#E8E8E5]" />

            {/* Assignee */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#AAAAAA]">Assigned to</span>
              <span className="text-[12px] text-[#1A1A1A]">{detail.assignee}</span>
            </div>

            <div className="w-px h-8 bg-[#E8E8E5]" />

            {/* Status */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-medium uppercase tracking-wide text-[#AAAAAA]">Status</span>
              <span
                className="text-[10px] font-medium px-[6px] py-[2px] rounded-[3px] inline-block"
                style={{ background: statusBadge.bg, color: statusBadge.color }}
              >
                {detail.status}
              </span>
            </div>

            <>
              <div className="w-px h-8 bg-[#E8E8E5]" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-medium uppercase tracking-wide text-[#AAAAAA]">Add-ons</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {selectionsToDisplayNames(selectedAddOns).map((name) => (
                    <span key={name} className="text-[10px] px-[6px] py-[2px] rounded-[3px] bg-[#F1EFE8] text-[#888886]">
                      {name}
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setAddOnsDrawerOpen(true)}
                    className="flex items-center gap-0.5 text-[10px] px-[6px] py-[2px] rounded-[3px] bg-[#E6F1FB] text-[#185FA5] hover:bg-[#CCE0F5] cursor-pointer transition-colors"
                  >
                    <PlusIcon className="w-[10px] h-[10px]" />
                    {selectedAddOns.length === 0 ? "Add add-ons" : "Edit add-ons"}
                  </button>
                </div>
              </div>
            </>

            {detail.remarks && (
              <>
                <div className="w-px h-8 bg-[#E8E8E5]" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-medium uppercase tracking-wide text-[#AAAAAA]">Remarks</span>
                  <span className="text-[12px] text-[#666664] max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">{detail.remarks}</span>
                </div>
              </>
            )}

            <div className="ml-auto">
              <button type="button" className="flex items-center gap-1 text-[12px] text-[#185FA5] hover:underline cursor-pointer">
                <ExternalLinkIcon className="w-[12px] h-[12px]" />
                View invoice
              </button>
            </div>
          </div>

          {/* Zone 4: Tab Navigation Bar */}
          <div className="px-5 bg-white border-b border-[#E8E8E5] flex items-center shrink-0">
            <div className="flex items-center gap-1 flex-1 py-1.5">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`h-8 px-3 flex items-center gap-1.5 rounded-md text-[12px] cursor-pointer transition-colors duration-100 ${
                    activeTab === tab.id
                      ? "bg-[#F7F7F5] text-[#1A1A1A] font-medium"
                      : "text-[#888886] hover:bg-[#F7F7F5]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className="text-[10px] px-[5px] py-[0.5px] rounded-[10px] bg-[#E6F1FB] text-[#185FA5]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 border-l border-[#E8E8E5] pl-3 py-1.5">
              <button
                type="button"
                onClick={() => navigate(`/orders/${order.id}/classify-documents`)}
                className="flex items-center gap-1.5 h-8 px-3 rounded-md bg-[#1A1A1A] text-white text-[12px] font-medium cursor-pointer hover:bg-[#333333] transition-colors"
              >
                <FolderArrowIcon className="w-[13px] h-[13px]" />
                <span>Classify documents</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center w-8 h-8 rounded-md bg-[#F7F7F5] hover:bg-[#EEEEE9] cursor-pointer"
              >
                <DotsHorizontalIcon className="w-[14px] h-[14px] text-[#888886]" />
              </button>
            </div>
          </div>

          {/* Zone 5: Tab Content */}
          <div className={`flex-1 ${activeTab === "comms" ? "overflow-hidden flex flex-col" : "overflow-auto"}`}>
            {activeTab === "application" && (
              <ApplicationTab
                travellers={travellers}
                editingCell={editingCell}
                editValue={editValue}
                selectedIds={selectedIds}
                copiedEmbassyId={copiedEmbassyId}
                orderCountry={order.country}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSaveEdit={saveEdit}
                onCancelEdit={cancelEdit}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onOpenDraftModal={openDraftModal}
                onCopyEmbassyRef={handleCopyEmbassyRef}
                jurisdictionFlash={jurisdictionFlash}
                onSaveJurisdiction={saveJurisdiction}
                onSetVerdict={setVerdict}
              />
            )}
            {activeTab === "documents" && <PlaceholderTab label="Documents" />}
            {activeTab === "comms" && (
              <CommsTab
                orderId={orderIdStr}
                orderCountry={order.country}
                orderAgency={order.agency}
                orderTravelDates={`${order.travelDateStart} – ${order.travelDateEnd}`}
              />
            )}
            {activeTab === "automation" && <PlaceholderTab label="Automation logs" />}
            {activeTab === "vri" && <PlaceholderTab label="Apply VRI" />}
          </div>
        </div>

        {/* Order Chat Panel */}
        {chatOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setChatOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[380px] bg-white border-l border-[#E8E8E5] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-12 px-4 flex items-center justify-between border-b border-[#E8E8E5] shrink-0">
                <span className="text-[13px] font-medium text-[#1A1A1A]">Order Chat</span>
                <button type="button" onClick={() => setChatOpen(false)} className="cursor-pointer hover:bg-[#F1EFE8] rounded p-1">
                  <XIcon className="w-4 h-4 text-[#888886]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {chatMessages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
                    <MessageIcon className="w-6 h-6 text-[#AAAAAA] mb-2" />
                    <div className="text-[13px] text-[#888886]">No messages yet</div>
                    <div className="text-[11px] text-[#AAAAAA] mt-1">Start the conversation below.</div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-0.5 ${msg.isVE ? "items-end" : "items-start"}`}>
                      <span className="text-[10px] text-[#AAAAAA]">{msg.author} · {msg.time}</span>
                      <div
                        className={`text-[12px] px-3 py-2 rounded-lg max-w-[280px] ${
                          msg.isVE ? "bg-[#1A1A1A] text-white" : "bg-[#F7F7F5] text-[#1A1A1A]"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-3 border-t border-[#E8E8E5] shrink-0 flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                  placeholder="Write a message..."
                  className="flex-1 bg-[#F7F7F5] rounded-lg px-3 py-2 text-[12px] text-[#1A1A1A] placeholder:text-[#AAAAAA] outline-none"
                />
                <button
                  type="button"
                  onClick={sendChatMessage}
                  className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#1A1A1A] cursor-pointer hover:bg-[#333333]"
                >
                  <SendIcon className="w-[14px] h-[14px] text-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Order History Panel */}
        {historyOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setHistoryOpen(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[380px] bg-white border-l border-[#E8E8E5] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-12 px-4 flex items-center justify-between border-b border-[#E8E8E5] shrink-0">
                <span className="text-[13px] font-medium text-[#1A1A1A]">Order History</span>
                <button type="button" onClick={() => setHistoryOpen(false)} className="cursor-pointer hover:bg-[#F1EFE8] rounded p-1">
                  <XIcon className="w-4 h-4 text-[#888886]" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
                {detail.historyEvents.map((event, i) => (
                  <div key={i} className="flex flex-col gap-0.5">
                    <span className="text-[11px] text-[#1A1A1A]">{event.action}</span>
                    <span className="text-[10px] text-[#AAAAAA]">{event.actor} · {event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <AddOnsDrawer
          orderId={orderIdStr}
          open={addOnsDrawerOpen}
          onClose={() => setAddOnsDrawerOpen(false)}
          existingSelections={selectedAddOns}
          onUpdate={async (sels) => { setSelectedAddOns(sels); }}
        />

        <Modal
          title="Draft application"
          open={draftModalTraveller !== null}
          onCancel={() => setDraftModalTraveller(null)}
          onOk={confirmDraft}
          okText="Confirm and draft"
          cancelText="Cancel"
          width={440}
          centered
          maskClosable={false}
        >
          {draftModalTraveller && (
            <div style={{ paddingTop: 8 }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{draftModalTraveller.name}</div>
              <div style={{ fontSize: 12, color: '#888886', marginBottom: 16 }}>
                {draftModalTraveller.id} · Visa application
              </div>
              <hr style={{ margin: '0 0 16px', border: 'none', borderTop: '1px solid #E8E8E5' }} />
              <p style={{ fontSize: 13, color: '#444', marginBottom: 12 }}>
                This will automatically fill and submit {draftModalTraveller.name.split(' ')[0]}'s
                visa application to the embassy. This action cannot be undone once started.
              </p>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>What happens next:</p>
              <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12, color: '#666', lineHeight: 1.8 }}>
                <li>Application form is auto-filled from the traveller's documents</li>
                <li>Submitted to the embassy portal</li>
                <li>You'll be notified when the embassy reference ID is returned</li>
              </ul>
            </div>
          )}
        </Modal>

        {toast && (
          <div
            key={toast.id}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#1A1A1A] text-white text-[12px] px-3 py-2 rounded-lg shadow-lg pointer-events-none"
            style={{ animation: "toast-fade 1.8s ease-in-out" }}
          >
            {toast.text}
          </div>
        )}
      </div>
    </ConfigProvider>
  );
}
