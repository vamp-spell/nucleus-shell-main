import { BackArrowIcon, CalendarIcon } from "./icons";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-12 w-full bg-white flex items-center justify-between px-5">
      <div className="flex items-center gap-3">
        <BackArrowIcon className="w-4 h-4 text-[#888886] cursor-pointer" />
        <span className="text-[15px] font-medium text-[#1A1A1A]">Orders</span>
      </div>
      <div className="flex items-center gap-1.5">
        <CalendarIcon className="w-[14px] h-[14px] text-[#888886]" />
        <span className="text-[13px] text-[#888886]">June 12, Fri, 05:01 PM</span>
      </div>
    </header>
  );
}
