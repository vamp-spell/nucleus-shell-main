import { useRef, useState, type DragEvent } from "react";
import { XIcon, LockIcon, GripVerticalIcon } from "./icons";

const COLUMN_LABELS: Record<string, string> = {
  traveldate: "Travel date",
  agency: "Agency",
  docs: "Documents",
  changed: "What changed",
  chat: "Order chat",
};

const FIXED_COLUMNS = ["Country + visa type", "Travellers"];

interface ColumnsPanelProps {
  isOpen: boolean;
  draftColumnOrder: string[];
  onDraftChange: (order: string[]) => void;
  onClose: () => void;
  onApply: () => void;
  onReset: () => void;
}

export default function ColumnsPanel({
  isOpen,
  draftColumnOrder,
  onDraftChange,
  onClose,
  onApply,
  onReset,
}: ColumnsPanelProps) {
  const dragSrcIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    dragSrcIndex.current = index;
    setDraggingIndex(index);
  };

  const handleDragEnd = () => {
    dragSrcIndex.current = null;
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = (index: number) => {
    setDragOverIndex((prev) => (prev === index ? null : prev));
  };

  const handleDrop = (e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const srcIndex = dragSrcIndex.current;
    if (srcIndex !== null && srcIndex !== index) {
      const next = [...draftColumnOrder];
      const [moved] = next.splice(srcIndex, 1);
      next.splice(index, 0, moved);
      onDraftChange(next);
    }
    dragSrcIndex.current = null;
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.15)" }}
          onClick={onClose}
        />
      )}

      <div
        className="fixed top-0 right-0 bottom-0 w-[260px] bg-white z-50 flex flex-col"
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 200ms ease",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.06)",
        }}
      >
        <div className="h-12 flex items-center justify-between px-4 shrink-0">
          <span className="text-[13px] font-medium text-[#1A1A1A]">Customise columns</span>
          <button type="button" onClick={onClose} aria-label="Close" className="cursor-pointer">
            <XIcon className="w-4 h-4 text-[#888886]" />
          </button>
        </div>

        <div
          className="text-[11px] text-[#666664] px-4 py-[10px] bg-[#F7F7F5] shrink-0"
          style={{ lineHeight: 1.5 }}
        >
          Drag to reorder columns. Country and travellers are always shown first.
        </div>

        <div className="px-3 py-[10px] flex flex-col overflow-y-auto flex-1">
          <span
            className="block text-[10px] text-[#AAAAAA] px-1 py-[6px]"
            style={{ letterSpacing: "0.04em" }}
          >
            Fixed columns
          </span>
          {FIXED_COLUMNS.map((label) => (
            <div
              key={label}
              className="flex items-center gap-2 px-[10px] py-2 bg-[#F7F7F5] rounded-lg mb-[5px] opacity-60 cursor-default select-none"
            >
              <LockIcon className="w-[14px] h-[14px] text-[#AAAAAA]" />
              <span className="text-[12px] text-[#1A1A1A] flex-1">{label}</span>
              <span className="text-[9px] text-[#AAAAAA] bg-white rounded-[10px] px-[5px] py-[1px]">
                Fixed
              </span>
            </div>
          ))}

          <span
            className="block text-[10px] text-[#AAAAAA] px-1 py-[6px] mt-2"
            style={{ letterSpacing: "0.04em" }}
          >
            Reorderable columns
          </span>
          {draftColumnOrder.map((key, index) => {
            const isDragOver = dragOverIndex === index;
            const isDragging = draggingIndex === index;
            return (
              <div
                key={key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={() => handleDragLeave(index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`flex items-center gap-2 px-[10px] py-2 rounded-lg mb-[5px] cursor-grab select-none transition-[background-color] duration-100 ease-in-out ${
                  isDragOver ? "bg-[#E6F1FB]" : "bg-[#F7F7F5]"
                } ${isDragging ? "opacity-35" : ""}`}
              >
                <GripVerticalIcon className="w-[14px] h-[14px] text-[#AAAAAA]" />
                <span className="text-[12px] text-[#1A1A1A] flex-1">{COLUMN_LABELS[key]}</span>
                <span className="text-[10px] text-[#AAAAAA] bg-white rounded-[10px] px-[5px] py-[1px]">
                  {index + 3}
                </span>
              </div>
            );
          })}
        </div>

        <div className="h-12 bg-[#F7F7F5] flex items-center gap-2 px-4 shrink-0">
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg text-[12px] text-[#666664] px-[10px] py-[7px] bg-white cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onApply}
            className="bg-[#185FA5] rounded-lg text-[12px] font-medium text-white px-3 py-[7px] flex-1 cursor-pointer border-none"
          >
            Apply
          </button>
        </div>
      </div>
    </>
  );
}
