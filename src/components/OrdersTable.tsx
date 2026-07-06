import { useRef, useState, type ComponentType, type MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { DocStatus, Order, TabKey, VisaType, WhatChanged } from "../data/orders";
import {
  FlagIcon,
  FilePlusIcon,
  CircleCheckIcon,
  ClockIcon,
  CheckIcon,
  FileIcon,
  SparklesIcon,
  MessageIcon,
  InboxIcon,
  SearchIcon,
  CopyIcon,
} from "./icons";

interface OrdersTableProps {
  orders: Order[];
  tab: TabKey;
  columnOrder: string[];
  isSearching?: boolean;
}

const COLUMN_LABELS: Record<string, string> = {
  country: "Country + visa type",
  pax: "Travellers",
  orderid: "Order ID",
  traveldate: "Travel date",
  agency: "Agency",
  docs: "Documents",
  changed: "What changed",
  chat: "Order chat",
};

const COLUMN_WIDTH_CLASSES: Record<string, string> = {
  country: "w-[200px] max-w-[200px] flex-shrink-0",
  pax: "w-[80px] flex-shrink-0",
  orderid: "w-[160px] flex-shrink-0",
  traveldate: "flex-1",
  agency: "flex-1",
  docs: "flex-1",
  changed: "flex-1",
  chat: "flex-1",
};

const VISA_BADGE: Record<VisaType, { bg: string; color: string }> = {
  EXP: { bg: "#FAECE7", color: "#993C1D" },
  SFT: { bg: "#EAF3DE", color: "#3B6D11" },
  POP: { bg: "#E6F1FB", color: "#185FA5" },
};

const DOCS_CONFIG: Record<
  DocStatus,
  { icon: ComponentType<{ className?: string }>; label: string; bg: string; color: string }
> = {
  uploaded: { icon: CheckIcon, label: "Uploaded", bg: "#EAF3DE", color: "#3B6D11" },
  pending: { icon: ClockIcon, label: "Pending", bg: "#FAEEDA", color: "#854F0B" },
  "not-yet": { icon: FileIcon, label: "Not yet", bg: "#F1EFE8", color: "#888886" },
};

const CHANGED_CONFIG: Record<
  WhatChanged,
  { icon: ComponentType<{ className?: string }> | null; label: string; bg?: string; color: string }
> = {
  "just-assigned": { icon: SparklesIcon, label: "Just assigned", color: "#AAAAAA" },
  "docs-uploaded": { icon: FilePlusIcon, label: "Docs uploaded", bg: "#E6F1FB", color: "#185FA5" },
  escalated: { icon: FlagIcon, label: "Escalated", bg: "#FCEBEB", color: "#A32D2D" },
  "new-chat": { icon: MessageIcon, label: "New chat", bg: "#E6F1FB", color: "#185FA5" },
  "waiting-ta": { icon: ClockIcon, label: "Waiting for TA", color: "#854F0B" },
  "waiting-vendor": { icon: ClockIcon, label: "Waiting for vendor", color: "#854F0B" },
  "no-change": { icon: null, label: "No change", color: "#CCCCCA" },
};

interface SubGroupConfig {
  icon: ComponentType<{ className?: string }>;
  label: string;
  bg: string;
  color: string;
}

const SUBGROUP_CONFIG: Record<string, SubGroupConfig> = {
  escalated: { icon: FlagIcon, label: "Needs your action", bg: "#FCEBEB18", color: "#A32D2D" },
  actionable: { icon: CircleCheckIcon, label: "Actionable now", bg: "#E6F1FB18", color: "#185FA5" },
  waiting: { icon: ClockIcon, label: "Waiting for someone", bg: "#FAEEDA18", color: "#854F0B" },
  submitted: {
    icon: CircleCheckIcon,
    label: "Submitted, awaiting embassy response. No action needed.",
    bg: "#EAF3DE18",
    color: "#3B6D11",
  },
};

function getFillColor(daysAway: number): string {
  if (daysAway < 7) return "#E24B4A";
  if (daysAway <= 14) return "#EF9F27";
  return "#639922";
}

function getFillPct(daysAway: number): number {
  return Math.min(100, Math.max(10, ((30 - daysAway) / 30) * 100));
}

function CountryCell({ order, textColor }: { order: Order; textColor: string }) {
  const badge = VISA_BADGE[order.visaType];
  return (
    <div className="flex items-center gap-[7px] min-w-0 overflow-hidden">
      <span className="text-[15px] shrink-0">{order.flag}</span>
      <div className="flex flex-col min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 flex-wrap">
          <span
            className="text-[12px] font-medium max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap"
            style={{ color: textColor }}
          >
            {order.country}
          </span>
          <span
            className="text-[10px] font-medium px-[5px] py-[1px] rounded-[3px] whitespace-nowrap"
            style={{ background: badge.bg, color: badge.color }}
          >
            {order.visaType}
          </span>
          {order.escalated && (
            <span className="text-[10px] font-medium px-[5px] py-[1px] rounded-[3px] whitespace-nowrap bg-[#FCEBEB] text-[#A32D2D]">
              ESC
            </span>
          )}
        </div>
        <div className="text-[10px] text-[#888886] overflow-hidden text-ellipsis whitespace-nowrap">
          {order.visaCategory}
        </div>
      </div>
    </div>
  );
}

function PaxCell({ order, textColor }: { order: Order; textColor: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 text-center w-full">
      <span className="text-[12px]" style={{ color: textColor }}>
        {order.pax}
      </span>
      {order.bulkProgress && (
        <span className="text-[10px] text-[#854F0B]">
          {order.bulkProgress.done} of {order.bulkProgress.total} done
        </span>
      )}
    </div>
  );
}

function OrderIdCell({ order, onCopy }: { order: Order; onCopy: (id: string) => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
    onCopy(order.id);
  };

  return (
    <div className="flex items-center gap-1 min-w-0 w-full">
      <span className="font-mono text-[12px] text-[#1A1A1A] overflow-hidden text-ellipsis whitespace-nowrap">
        {order.id}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy order ID"
        className="flex items-center justify-center p-[3px] rounded shrink-0 cursor-pointer hover:bg-[#F1EFE8]"
      >
        <CopyIcon className={`w-[13px] h-[13px] ${copied ? "text-[#3B6D11]" : "text-[#888886]"}`} />
      </button>
    </div>
  );
}

function TravelDateCell({ order, textColor }: { order: Order; textColor: string }) {
  const fillColor = getFillColor(order.daysAway);
  const fillPct = getFillPct(order.daysAway);
  return (
    <div className="flex flex-col justify-center gap-0.5">
      <span className="text-[11px]" style={{ color: textColor }}>
        {order.travelDateStart} – {order.travelDateEnd}
      </span>
      <div className="w-[76px] h-[3px] bg-[#E8E8E5] rounded-[2px] overflow-hidden">
        <div className="h-full rounded-[2px]" style={{ width: `${fillPct}%`, background: fillColor }} />
      </div>
      <span className="text-[10px]" style={{ color: fillColor }}>
        {order.daysAway} days away
      </span>
    </div>
  );
}

function AgencyCell({ order }: { order: Order }) {
  return (
    <span className="block text-[11px] text-[#666664] max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
      {order.agency}
    </span>
  );
}

function DocsCell({ order }: { order: Order }) {
  const config = DOCS_CONFIG[order.docStatus];
  const Icon = config.icon;
  return (
    <div
      className="inline-flex items-center gap-[3px] text-[10px] px-[6px] py-[2px] rounded-[3px]"
      style={{ background: config.bg, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      <span>{config.label}</span>
    </div>
  );
}

function ChangedCell({ order }: { order: Order }) {
  const config = CHANGED_CONFIG[order.whatChanged];

  if (order.whatChanged === "no-change") {
    return <span className="text-[10px]" style={{ color: config.color }}>No change</span>;
  }

  const Icon = config.icon;
  const showTimeAgo = order.whatChanged !== "just-assigned" && order.timeAgo;
  const label = showTimeAgo ? `${config.label} · ${order.timeAgo}` : config.label;

  return (
    <div
      className={`inline-flex items-center gap-[3px] text-[10px] font-medium ${
        config.bg ? "px-[6px] py-[2px] rounded-[3px]" : ""
      }`}
      style={{ background: config.bg, color: config.color }}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span>{label}</span>
    </div>
  );
}

function ChatCell({ order }: { order: Order }) {
  if (order.chatUnread) {
    return (
      <div className="inline-flex items-center gap-[3px] text-[10px] px-[6px] py-[2px] rounded-[3px] bg-[#E6F1FB] text-[#185FA5]">
        <MessageIcon className="w-3 h-3" />
        <span>Unread</span>
      </div>
    );
  }
  return <span className="text-[12px] text-[#AAAAAA]">—</span>;
}

function renderCell(key: string, order: Order, textColor: string, onCopyOrderId: (id: string) => void) {
  switch (key) {
    case "country":
      return <CountryCell order={order} textColor={textColor} />;
    case "pax":
      return <PaxCell order={order} textColor={textColor} />;
    case "orderid":
      return <OrderIdCell order={order} onCopy={onCopyOrderId} />;
    case "traveldate":
      return <TravelDateCell order={order} textColor={textColor} />;
    case "agency":
      return <AgencyCell order={order} />;
    case "docs":
      return <DocsCell order={order} />;
    case "changed":
      return <ChangedCell order={order} />;
    case "chat":
      return <ChatCell order={order} />;
    default:
      return null;
  }
}

function OrderRow({
  order,
  columns,
  tab,
  onCopyOrderId,
}: {
  order: Order;
  columns: string[];
  tab: TabKey;
  onCopyOrderId: (id: string) => void;
}) {
  const navigate = useNavigate();
  const textColor = tab === "submitted" ? "#888886" : "#1A1A1A";
  const bgClass = order.escalated
    ? "bg-[#FCEBEB18] hover:bg-[#F9F9F7]"
    : order.blocked
      ? "bg-[#FAEEDA14] hover:bg-[#F9F9F7]"
      : "bg-white hover:bg-[#F9F9F7]";

  return (
    <div
      className={`flex min-h-[52px] cursor-pointer transition-colors duration-100 ease-in-out ${bgClass}`}
      onClick={() => navigate(`/orders/${order.id}`)}
    >
      {columns.map((key) => (
        <div key={key} className={`px-[12px] flex items-center min-w-0 ${COLUMN_WIDTH_CLASSES[key]}`}>
          {renderCell(key, order, textColor, onCopyOrderId)}
        </div>
      ))}
    </div>
  );
}

function SubGroupHeader({ icon: Icon, label, bg, color }: SubGroupConfig) {
  return (
    <div
      className="w-full h-7 px-4 py-[5px] flex items-center gap-[5px] text-[10px] font-medium"
      style={{ background: bg, color }}
    >
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ isSearching }: { isSearching?: boolean }) {
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <SearchIcon className="w-6 h-6 text-[#AAAAAA] mb-2" />
        <div className="text-[13px] text-[#888886]">No orders match your search</div>
        <div className="text-[11px] text-[#AAAAAA] mt-1">Try a different country, agency, or order ID</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <InboxIcon className="w-6 h-6 text-[#AAAAAA] mb-2" />
      <div className="text-[13px] text-[#888886]">No orders here right now</div>
      <div className="text-[11px] text-[#AAAAAA] mt-1">All caught up. Check back later.</div>
    </div>
  );
}

interface Section {
  header: string | null;
  rows: Order[];
}

const VISA_TYPE_PRIORITY: Record<VisaType, number> = { EXP: 0, SFT: 1, POP: 2 };

function compareOrders(a: Order, b: Order): number {
  const visaDiff = VISA_TYPE_PRIORITY[a.visaType] - VISA_TYPE_PRIORITY[b.visaType];
  if (visaDiff !== 0) return visaDiff;
  if (a.daysAway !== b.daysAway) return a.daysAway - b.daysAway;
  const aChanged = a.whatChanged === "no-change" ? 1 : 0;
  const bChanged = b.whatChanged === "no-change" ? 1 : 0;
  return aChanged - bChanged;
}

function buildSections(orders: Order[], tab: TabKey): Section[] {
  if (tab === "new") {
    const sorted = [...orders].sort(compareOrders);
    return [{ header: null, rows: sorted }];
  }

  if (tab === "attention") {
    const sections: Section[] = [];
    const escalated = orders.filter((o) => o.group === "escalated").sort(compareOrders);
    if (escalated.length) sections.push({ header: "escalated", rows: escalated });
    return sections;
  }

  if (tab === "progress") {
    const sections: Section[] = [];
    const actionable = orders.filter((o) => o.group === "actionable").sort(compareOrders);
    const waiting = orders.filter((o) => o.group === "waiting").sort(compareOrders);
    if (actionable.length) sections.push({ header: "actionable", rows: actionable });
    if (waiting.length) sections.push({ header: "waiting", rows: waiting });
    return sections;
  }

  return [{ header: "submitted", rows: orders }];
}

export default function OrdersTable({ orders, tab, columnOrder, isSearching }: OrdersTableProps) {
  const columns = ["country", "pax", "orderid", ...columnOrder];
  const sections = buildSections(orders, tab);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const handleCopyOrderId = (id: string) => {
    if (toastTimeoutRef.current !== null) clearTimeout(toastTimeoutRef.current);
    setToast({ id: Date.now(), text: `${id} copied` });
    toastTimeoutRef.current = window.setTimeout(() => setToast(null), 1800);
  };

  return (
    <div className="w-full">
      <div className="flex bg-[#F7F7F5]">
        {columns.map((key) => (
          <div
            key={key}
            className={`px-[12px] py-[6px] text-[10px] font-medium text-[#888886] whitespace-nowrap ${COLUMN_WIDTH_CLASSES[key]} ${
              key === "pax" ? "text-center" : "text-left"
            }`}
          >
            {COLUMN_LABELS[key]}
          </div>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState isSearching={isSearching} />
      ) : (
        sections.map((section, i) => (
          <div key={i}>
            {section.header && <SubGroupHeader {...SUBGROUP_CONFIG[section.header]} />}
            {section.rows.map((order) => (
              <OrderRow key={order.id} order={order} columns={columns} tab={tab} onCopyOrderId={handleCopyOrderId} />
            ))}
          </div>
        ))
      )}

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
  );
}
