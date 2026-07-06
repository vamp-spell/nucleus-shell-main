import { useState, type ComponentType } from "react";
import {
  SearchIcon,
  LayoutColumnsIcon,
  SparklesIcon,
  AlertCircleIcon,
  LoaderIcon,
  CircleCheckIcon,
  XIcon,
} from "./icons";
import OrdersTable from "./OrdersTable";
import {
  newOrders,
  attentionOrders,
  progressOrders,
  submittedOrders,
  type TabKey,
} from "../data/orders";

interface SummaryCard {
  number: number;
  label: string;
  color: string;
  bg: string;
}

const SUMMARY_CARDS: SummaryCard[] = [
  {
    number: 3,
    label: "New today",
    color: "#185FA5",
    bg: "#EEF4FD",
  },
  {
    number: 1,
    label: "Needs attention",
    color: "#A32D2D",
    bg: "#FDF2F2",
  },
  {
    number: 6,
    label: "In progress",
    color: "#854F0B",
    bg: "#FDF6EC",
  },
  {
    number: 6,
    label: "Submitted, awaiting embassy",
    color: "#3B6D11",
    bg: "#F2F8EC",
  },
];

interface Tab {
  icon: ComponentType<{ className?: string }>;
  label: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
}

const TABS: Tab[] = [
  {
    icon: SparklesIcon,
    label: "New today",
    badge: "3",
    badgeBg: "#E6F1FB",
    badgeColor: "#185FA5",
  },
  {
    icon: AlertCircleIcon,
    label: "Needs attention",
    badge: "1",
    badgeBg: "#FCEBEB",
    badgeColor: "#A32D2D",
  },
  {
    icon: LoaderIcon,
    label: "In progress",
    badge: "6",
    badgeBg: "#F1EFE8",
    badgeColor: "#888886",
  },
  {
    icon: CircleCheckIcon,
    label: "Submitted",
    badge: "6",
    badgeBg: "#F1EFE8",
    badgeColor: "#888886",
  },
];

const PAGINATION_INFO = [
  { orders: 3, pax: 8 },
  { orders: 1, pax: 1 },
  { orders: 6, pax: 55 },
  { orders: 6, pax: 13 },
];

const TAB_KEYS: TabKey[] = ["new", "attention", "progress", "submitted"];

const ORDERS_BY_TAB: Record<TabKey, typeof newOrders> = {
  new: newOrders,
  attention: attentionOrders,
  progress: progressOrders,
  submitted: submittedOrders,
};

interface OrdersContentProps {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  columnOrder: string[];
  onOpenColumnsPanel: () => void;
}

export default function OrdersContent({
  searchQuery,
  setSearchQuery,
  columnOrder,
  onOpenColumnsPanel,
}: OrdersContentProps) {
  const [activeTab, setActiveTab] = useState(0);
  const pagination = PAGINATION_INFO[activeTab];
  const activeTabKey = TAB_KEYS[activeTab];

  const baseOrders = ORDERS_BY_TAB[activeTabKey];
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const isSearching = trimmedQuery !== "";
  const filteredOrders = isSearching
    ? baseOrders.filter((order) => {
        const docStatusLabel = order.docStatus.replace("-", " ");
        return (
          order.country.toLowerCase().includes(trimmedQuery) ||
          order.agency.toLowerCase().includes(trimmedQuery) ||
          order.id.toLowerCase().includes(trimmedQuery) ||
          order.visaType.toLowerCase().includes(trimmedQuery) ||
          order.visaCategory.toLowerCase().includes(trimmedQuery) ||
          order.travelDateStart.toLowerCase().includes(trimmedQuery) ||
          order.travelDateEnd.toLowerCase().includes(trimmedQuery) ||
          String(order.daysAway) === trimmedQuery ||
          docStatusLabel.includes(trimmedQuery)
        );
      })
    : baseOrders;

  const orderCount = isSearching ? filteredOrders.length : pagination.orders;
  const paxCount = isSearching
    ? filteredOrders.reduce((sum, order) => sum + order.pax, 0)
    : pagination.pax;

  return (
    <div className="p-0 bg-white">
      {/* Top action bar */}
      <div className="w-full h-12 bg-white flex items-center justify-between px-5">
        <span className="text-[15px] font-medium text-[#1A1A1A]">Orders</span>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center gap-2 w-[280px] h-[34px] bg-[#F7F7F5] rounded-lg px-3 py-1.5 transition-shadow duration-150 ease-in-out focus-within:shadow-[0_0_0_2px_rgba(29,158,117,0.25)]">
            <SearchIcon className="w-[13px] h-[13px] text-[#888886] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by country, agency, order ID, visa type, date, doc status..."
              className="w-full bg-transparent text-[12px] text-[#1A1A1A] placeholder:italic placeholder:text-[#888886] outline-none pr-5"
            />
            {searchQuery !== "" && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-[10px] flex items-center justify-center cursor-pointer"
              >
                <XIcon className="w-3 h-3 text-[#888886]" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onOpenColumnsPanel}
            className="flex items-center gap-2 h-[34px] rounded-lg px-3 py-1.5 bg-[#F7F7F5] cursor-pointer"
          >
            <LayoutColumnsIcon className="w-[14px] h-[14px] text-[#888886]" />
            <span className="text-[12px] text-[#888886]">Customise columns</span>
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="w-full bg-white px-5 py-3">
        <div className="grid grid-cols-4 gap-[10px]">
          {SUMMARY_CARDS.map((card, index) => (
            <div
              key={card.label}
              onClick={() => setActiveTab(index)}
              className="rounded-lg px-[14px] py-[10px] cursor-pointer transition-shadow duration-150 ease-in-out hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
              style={{ background: card.bg }}
            >
              <div
                className="text-[22px] font-medium leading-none"
                style={{ color: card.color }}
              >
                {card.number}
              </div>
              <div className="text-[10px] text-[#888886] mt-[3px]">{card.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="w-full bg-white px-5 py-2 flex flex-row gap-1">
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === index;
          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setActiveTab(index)}
              className={`h-9 px-[14px] flex items-center gap-[5px] cursor-pointer rounded-md transition-colors duration-150 ease-in-out text-[12px] ${
                isActive
                  ? "bg-[#F7F7F5] text-[#1A1A1A] font-medium"
                  : "bg-transparent text-[#888886] hover:bg-[#F7F7F5]"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span
                className="text-[10px] px-[5px] py-[1px] rounded-[10px]"
                style={{ background: tab.badgeBg, color: tab.badgeColor }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <OrdersTable
        orders={filteredOrders}
        tab={activeTabKey}
        columnOrder={columnOrder}
        isSearching={isSearching}
      />

      {/* Pagination bar */}
      <div className="bg-[#F7F7F5] h-10 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#888886]">Page 1/1</span>
          <span className="text-[12px] text-[#888886]">{orderCount} Orders</span>
          <span className="text-[12px] text-[#888886]">{paxCount} Pax</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-[20px] px-3 py-1 text-[12px] text-[#888886] bg-white cursor-pointer opacity-40"
          >
            Prev
          </button>
          <button
            type="button"
            className="rounded-[20px] px-3 py-1 text-[12px] text-[#888886] bg-white cursor-pointer opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
