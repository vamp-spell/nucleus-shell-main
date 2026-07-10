import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import OrdersContent from "./components/OrdersContent";
import ColumnsPanel from "./components/ColumnsPanel";
import OrderDetail from "./components/OrderDetail";
import DocumentMapping from "./components/DocumentMapping";
import VerdictQCPage from "./components/VerdictQCPage";

const COLUMN_ORDER_STORAGE_KEY = "nucleus-column-order";
const DEFAULT_COLUMN_ORDER = ["traveldate", "agency", "docs", "changed", "chat"];

function getInitialColumnOrder(): string[] {
  try {
    const stored = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        Array.isArray(parsed) &&
        parsed.length === DEFAULT_COLUMN_ORDER.length &&
        parsed.every((key) => typeof key === "string" && DEFAULT_COLUMN_ORDER.includes(key)) &&
        new Set(parsed).size === DEFAULT_COLUMN_ORDER.length
      ) {
        return parsed as string[];
      }
    }
  } catch {
    // ignore invalid stored value
  }
  return DEFAULT_COLUMN_ORDER;
}

function App() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnOrder, setColumnOrder] = useState<string[]>(getInitialColumnOrder);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [draftColumnOrder, setDraftColumnOrder] = useState<string[]>(columnOrder);
  const sidebarWidth = isExpanded ? 220 : 56;

  const openColumnsPanel = () => {
    setDraftColumnOrder([...columnOrder]);
    setIsPanelOpen(true);
  };

  const closeColumnsPanel = () => {
    setIsPanelOpen(false);
  };

  const applyColumnsPanel = () => {
    setColumnOrder(draftColumnOrder);
    localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(draftColumnOrder));
    setIsPanelOpen(false);
  };

  const resetDraftColumnOrder = () => {
    setDraftColumnOrder([...DEFAULT_COLUMN_ORDER]);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen">
            <Sidebar isExpanded={isExpanded} onToggle={() => setIsExpanded((v) => !v)} />
            <div
              className="flex-1 min-h-screen bg-white transition-[margin-left] duration-200 ease-in-out"
              style={{ marginLeft: sidebarWidth }}
            >
              <Header title="Orders" />
              <OrdersContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                columnOrder={columnOrder}
                onOpenColumnsPanel={openColumnsPanel}
              />
            </div>
            <ColumnsPanel
              isOpen={isPanelOpen}
              draftColumnOrder={draftColumnOrder}
              onDraftChange={setDraftColumnOrder}
              onClose={closeColumnsPanel}
              onApply={applyColumnsPanel}
              onReset={resetDraftColumnOrder}
            />
          </div>
        }
      />
      <Route path="/orders/:orderId" element={<OrderDetail />} />
      <Route path="/orders/:orderId/classify-documents" element={<DocumentMapping />} />
      <Route path="/orders/:orderId/verdict-qc/:travellerId" element={<VerdictQCPage />} />
    </Routes>
  );
}

export default App;
