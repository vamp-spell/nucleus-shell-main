import type { ComponentType } from "react";
import {
  SearchIcon,
  OrdersIcon,
  ApplicationsIcon,
  LogisticOrdersIcon,
  LogisticTasksIcon,
  DataStudioIcon,
  TagIcon,
  ShieldIcon,
  ReportsIcon,
  OrgChartIcon,
  BellIcon,
  WrenchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GearIcon,
  HelpIcon,
  ChangelogIcon,
} from "./icons";

interface NavItem {
  id: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: "search", label: "Search", icon: SearchIcon },
  { id: "orders", label: "Orders", icon: OrdersIcon },
  { id: "applications", label: "Applications", icon: ApplicationsIcon },
  { id: "logistic-orders", label: "Logistic Orders", icon: LogisticOrdersIcon },
  { id: "logistic-tasks", label: "Logistic Tasks", icon: LogisticTasksIcon },
  { id: "data-studio", label: "Data Studio Lite", icon: DataStudioIcon },
  { id: "visa-prices", label: "Visa Prices Changelog", icon: TagIcon },
  { id: "kyc", label: "KYC Requests", icon: ShieldIcon },
  { id: "reports", label: "Reports", icon: ReportsIcon },
  { id: "org-chart", label: "Org Chart", icon: OrgChartIcon },
  { id: "inbox", label: "Inbox", icon: BellIcon, badge: 217 },
  { id: "tools", label: "Nucleus Tools", icon: WrenchIcon },
];

const ACTIVE_ID = "orders";

interface SidebarProps {
  isExpanded: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  return (
    <aside
      className="fixed left-0 top-0 z-40 h-full flex flex-col bg-[#F7F7F5] transition-[width] duration-200 ease-in-out"
      style={{ width: isExpanded ? 220 : 56 }}
    >
      {/* Logo area */}
      <div className="h-14 flex items-center justify-center shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-[#1D9E75] flex items-center justify-center text-white text-[16px] font-medium shrink-0">
            N
          </div>
          {isExpanded && (
            <span className="ml-[10px] text-[13px] font-medium text-[#1A1A1A] whitespace-nowrap">
              NUCLEUS
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.id === ACTIVE_ID;
          return (
            <div
              key={item.id}
              className={`relative flex items-center h-10 mx-2 my-0.5 gap-[10px] rounded-md cursor-pointer ${
                isExpanded ? "px-3" : "justify-center px-0"
              } ${
                isActive
                  ? "bg-[#E8F5F0] text-[#1D9E75]"
                  : "text-[#666664] hover:bg-[#EEEEED]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {isExpanded && (
                <span className="text-[13px] whitespace-nowrap flex-1 truncate">
                  {item.label}
                </span>
              )}
              {item.badge !== undefined &&
                (isExpanded ? (
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#E24B4A] text-white text-[9px]">
                    {item.badge}
                  </span>
                ) : (
                  <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 rounded-full bg-[#E24B4A] text-white text-[9px]">
                    {item.badge}
                  </span>
                ))}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="mt-auto shrink-0">
        <div
          className={`flex items-center h-10 mx-2 my-0.5 gap-[10px] rounded-md cursor-pointer text-[#666664] hover:bg-[#EEEEED] ${
            isExpanded ? "px-3" : "justify-center px-0"
          }`}
        >
          <HelpIcon className="w-4 h-4 shrink-0" />
          {isExpanded && (
            <>
              <span className="text-[13px] whitespace-nowrap flex-1 truncate">
                Need Help
              </span>
              <span className="text-[10px] text-[#666664] bg-[#F1EFE8] rounded-[4px] px-[5px] py-[1px]">
                F8
              </span>
            </>
          )}
        </div>

        <div
          className={`flex items-center h-10 mx-2 my-0.5 gap-[10px] rounded-md cursor-pointer text-[#666664] hover:bg-[#EEEEED] ${
            isExpanded ? "px-3" : "justify-center px-0"
          }`}
        >
          <ChangelogIcon className="w-4 h-4 shrink-0" />
          {isExpanded && (
            <span className="text-[13px] whitespace-nowrap flex-1 truncate">
              View Changelog
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-[#1D9E75] flex items-center justify-center text-white text-[12px] shrink-0">
            S
          </div>
          {isExpanded && (
            <>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[12px] font-medium text-[#1A1A1A] truncate">
                  Sarah Michael
                </span>
                <span className="text-[10px] text-[#888886] truncate">
                  Manager
                </span>
              </div>
              <GearIcon className="w-4 h-4 text-[#888886] shrink-0 cursor-pointer" />
            </>
          )}
        </div>
      </div>

      {/* Toggle button */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
        className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.15)] flex items-center justify-center cursor-pointer"
      >
        {isExpanded ? (
          <ChevronLeftIcon className="w-3 h-3 text-[#666664]" />
        ) : (
          <ChevronRightIcon className="w-3 h-3 text-[#666664]" />
        )}
      </button>
    </aside>
  );
}
