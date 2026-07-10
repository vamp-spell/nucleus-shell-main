import { useState, useEffect, useCallback } from 'react';
import { Modal, Select, Spin, ConfigProvider } from 'antd';
import type { Traveller } from '../data/orderDetails';
import {
  getVFSCenters,
  getMonthAvailability,
  getTimeSlots,
  bookSlot,
  type VFSCenter,
  type AvailableDate,
  type TimeSlot,
  type SlotBookingConfirmation,
} from '../services/vfsService';

// ── Calendar helpers ──────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (m === 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (m === 12) return `${y + 1}-01`;
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

function firstDowOfMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).getDay(); // 0=Sun
}


function formatTimeDisplay(time: string): string {
  const [h, min] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(min).padStart(2, '0')} ${suffix}`;
}

function workingDaysBetween(fromStr: string, toStr: string): number {
  const from = new Date(fromStr);
  const to = new Date(toStr);
  let count = 0;
  const cur = new Date(from);
  while (cur < to) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ── Inline Calendar ──────────────────────────────────────────────────────────

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function InlineCalendar({
  month,
  availMap,
  loadingAvail,
  selectedDate,
  onSelect,
  onMonthChange,
}: {
  month: string;
  availMap: Record<string, AvailableDate[]>;
  loadingAvail: boolean;
  selectedDate: string | null;
  onSelect: (date: string) => void;
  onMonthChange: (ym: string) => void;
}) {
  const today = todayStr();
  const [currentYear, currentMonth] = today.split('-').map(Number);
  const [viewYear, viewMonth] = month.split('-').map(Number);
  const isPrevDisabled = viewYear < currentYear || (viewYear === currentYear && viewMonth <= currentMonth);
  const totalDays = daysInMonth(month);
  const firstDow = firstDowOfMonth(month);
  const avail = availMap[month] ?? [];

  return (
    <div>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          onClick={() => !isPrevDisabled && onMonthChange(prevMonth(month))}
          disabled={isPrevDisabled}
          style={{
            width: 28, height: 28, border: '1px solid #E8E8E5', borderRadius: 4,
            background: 'white', cursor: isPrevDisabled ? 'not-allowed' : 'pointer',
            color: isPrevDisabled ? '#CCCCCA' : '#1A1A1A', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >‹</button>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1A1A1A' }}>{formatMonthLabel(month)}</span>
        <button
          onClick={() => onMonthChange(nextMonth(month))}
          style={{
            width: 28, height: 28, border: '1px solid #E8E8E5', borderRadius: 4,
            background: 'white', cursor: 'pointer',
            color: '#1A1A1A', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >›</button>
      </div>

      {/* Day names */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_NAMES.map((d) => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: '#888886', fontWeight: 500, padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{ position: 'relative' }}>
        {loadingAvail && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
          }}>
            <Spin size="small" />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
            const dateStr = `${month}-${String(day).padStart(2, '0')}`;
            const isPast = dateStr < today;
            const dayAvail = avail.find((a) => a.date === dateStr);
            const hasSlots = dayAvail?.hasSlots ?? false;
            const isSelected = dateStr === selectedDate;
            const isSelectable = !isPast && hasSlots;

            return (
              <div
                key={day}
                onClick={() => isSelectable && onSelect(dateStr)}
                style={{
                  height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 4, fontSize: 12, userSelect: 'none',
                  cursor: isSelectable ? 'pointer' : 'default',
                  background: isSelected ? '#185FA5' : 'transparent',
                  color: isSelected ? 'white' : isPast ? '#CCCCCA' : hasSlots ? '#1A1A1A' : '#AAAAAA',
                  textDecoration: !isPast && !hasSlots ? 'line-through' : 'none',
                  opacity: isPast ? 0.5 : 1,
                  fontWeight: isSelected ? 500 : 400,
                }}
                onMouseEnter={(e) => {
                  if (isSelectable && !isSelected) (e.currentTarget as HTMLElement).style.background = '#E6F1FB';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Time Slot Row ─────────────────────────────────────────────────────────────

function TimeSlotRow({
  slots,
  loading,
  error,
  selectedTime,
  onSelect,
  onRetry,
}: {
  slots: TimeSlot[];
  loading: boolean;
  error: string | null;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#A32D2D' }}>
        <span>{error}</span>
        <button onClick={onRetry} style={{ fontSize: 11, color: '#185FA5', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ width: 80, height: 32, background: '#F1EFE8', borderRadius: 6, animation: 'skeletonPulse 1.2s ease-in-out infinite' }} />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return <span style={{ fontSize: 12, color: '#888886' }}>No slots available for this date. Try another date.</span>;
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {slots.map((slot) => {
        const isSelected = slot.time === selectedTime;
        const label = slot.available
          ? slot.remainingCount <= 5
            ? `${formatTimeDisplay(slot.time)} · ${slot.remainingCount} left`
            : formatTimeDisplay(slot.time)
          : `${formatTimeDisplay(slot.time)} · Full`;

        return (
          <button
            key={slot.time}
            disabled={!slot.available}
            onClick={() => slot.available && onSelect(slot.time)}
            style={{
              height: 32, padding: '0 10px', borderRadius: 6, fontSize: 11,
              border: `1px solid ${isSelected ? '#185FA5' : slot.available ? '#E8E8E5' : '#E8E8E5'}`,
              background: isSelected ? '#185FA5' : slot.available ? 'white' : '#F7F7F5',
              color: isSelected ? 'white' : slot.available ? '#1A1A1A' : '#AAAAAA',
              cursor: slot.available ? 'pointer' : 'not-allowed',
              fontWeight: isSelected ? 500 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

interface SlotBookingModalProps {
  open: boolean;
  traveller: Traveller | null;
  orderId: string;
  travelDateStart?: string;
  onClose: () => void;
  onBooked: (travellerId: string, confirmation: SlotBookingConfirmation) => void;
}

function SlotBookingModalInner({
  open,
  traveller,
  orderId,
  travelDateStart,
  onClose,
  onBooked,
}: SlotBookingModalProps) {
  const today = todayStr();
  const currentMonth = today.slice(0, 7);

  const [centers, setCenters] = useState<VFSCenter[]>([]);
  const [loadingCenters, setLoadingCenters] = useState(false);
  const [errorCenters, setErrorCenters] = useState<string | null>(null);

  const [centerId, setCenterId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonth);

  const [availCache, setAvailCache] = useState<Record<string, AvailableDate[]>>({});
  const [loadingAvail, setLoadingAvail] = useState(false);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [errorSlots, setErrorSlots] = useState<string | null>(null);

  const [booking, setBooking] = useState(false);
  const [errorBooking, setErrorBooking] = useState<string | null>(null);

  const [discardOpen, setDiscardOpen] = useState(false);

  const hasSelection = !!(date || time);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCenterId(null);
      setDate(null);
      setTime(null);
      setMonth(currentMonth);
      setAvailCache({});
      setSlots([]);
      setErrorBooking(null);
      setErrorSlots(null);
      loadCenters();
    }
  }, [open]);

  async function loadCenters() {
    setLoadingCenters(true);
    setErrorCenters(null);
    try {
      const data = await getVFSCenters('CHE');
      setCenters(data);
    } catch {
      setErrorCenters('Could not load centers. Retry.');
    } finally {
      setLoadingCenters(false);
    }
  }

  const loadAvailability = useCallback(async (cId: string, ym: string) => {
    if (availCache[ym]) return; // already cached
    setLoadingAvail(true);
    try {
      const data = await getMonthAvailability(cId, ym);
      setAvailCache((prev) => ({ ...prev, [ym]: data }));
    } catch {
      // silently fail — dates just won't highlight
    } finally {
      setLoadingAvail(false);
    }
  }, [availCache]);

  useEffect(() => {
    if (centerId) loadAvailability(centerId, month);
  }, [centerId, month]);

  async function loadSlots(cId: string, d: string) {
    setLoadingSlots(true);
    setErrorSlots(null);
    setSlots([]);
    try {
      const data = await getTimeSlots(cId, d);
      setSlots(data);
    } catch {
      setErrorSlots('Could not load slots. Retry.');
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleCenterChange(value: string) {
    setCenterId(value);
    setDate(null);
    setTime(null);
    setSlots([]);
  }

  function handleDateSelect(d: string) {
    setDate(d);
    setTime(null);
    setSlots([]);
    if (centerId) loadSlots(centerId, d);
  }

  function handleMonthChange(ym: string) {
    setMonth(ym);
    if (centerId) loadAvailability(centerId, ym);
  }

  function handleClose() {
    if (hasSelection) {
      setDiscardOpen(true);
    } else {
      onClose();
    }
  }

  function handleDiscard() {
    setDiscardOpen(false);
    onClose();
  }

  async function handleConfirm() {
    if (!traveller || !centerId || !date || !time) return;
    setBooking(true);
    setErrorBooking(null);
    try {
      const confirmation = await bookSlot({
        orderId,
        travellerId: traveller.id,
        centerId,
        appointmentDate: date,
        appointmentTime: time,
        travellerDetails: {
          fullName: traveller.name,
          passportNumber: traveller.passportNumber ?? '',
          dateOfBirth: traveller.dateOfBirth ?? '',
        },
      });
      onBooked(traveller.id, confirmation);
      onClose();
    } catch {
      setErrorBooking('Booking failed. Try again.');
    } finally {
      setBooking(false);
    }
  }

  function handleBackFooter() {
    if (time) {
      setTime(null);
    } else if (date) {
      setDate(null);
      setSlots([]);
    }
  }

  // 15-working-day warning
  let showWarning = false;
  if (date && travelDateStart) {
    const travelDateFull = `${new Date().getFullYear()}-${travelDateStart}`;
    const wdays = workingDaysBetween(date, travelDateFull);
    if (wdays < 15 && wdays >= 0) showWarning = true;
  }

  const canConfirm = !!(centerId && date && time) && !booking;

  const footerLeftLabel = time ? 'Clear time' : date ? 'Clear date' : null;

  const centerOptions = centers
    .reduce<{ label: string; options: { label: string; value: string }[] }[]>((acc, c) => {
      const group = acc.find((g) => g.label === c.city);
      if (group) {
        group.options.push({ label: c.label, value: c.id });
      } else {
        acc.push({ label: c.city, options: [{ label: c.label, value: c.id }] });
      }
      return acc;
    }, []);

  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      {/* Main modal */}
      <Modal
        open={open && !discardOpen}
        onCancel={handleClose}
        width={640}
        styles={{ body: { height: 432, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 0, padding: '0 24px' } }}
        title={
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Book appointment slot</div>
            {traveller && (
              <div style={{ fontSize: 12, fontWeight: 400, color: '#888886', marginTop: 2 }}>
                {traveller.name} · {traveller.id}
              </div>
            )}
          </div>
        }
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <div>
              {footerLeftLabel && (
                <button
                  onClick={handleBackFooter}
                  style={{ fontSize: 12, color: '#888886', border: 'none', background: 'none', cursor: 'pointer' }}
                >
                  {footerLeftLabel}
                </button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleClose}
                style={{ height: 32, padding: '0 16px', border: '1px solid #E8E8E5', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!canConfirm}
                style={{
                  height: 32, padding: '0 16px', border: 'none', borderRadius: 6,
                  background: canConfirm ? '#185FA5' : '#E8E8E5',
                  color: canConfirm ? 'white' : '#AAAAAA',
                  cursor: canConfirm ? 'pointer' : 'not-allowed',
                  fontSize: 13, fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {booking && <Spin size="small" style={{ filter: 'brightness(0) invert(1)' }} />}
                {booking ? 'Booking...' : 'Confirm booking'}
              </button>
            </div>
          </div>
        }
        centered
        destroyOnClose
        maskClosable={false}
      >
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 16, paddingBottom: 8 }}>

          {/* Step 1: Center */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#888886', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select VFS center</div>
            {errorCenters ? (
              <div style={{ fontSize: 12, color: '#A32D2D', display: 'flex', gap: 8, alignItems: 'center' }}>
                {errorCenters}
                <button onClick={loadCenters} style={{ fontSize: 11, color: '#185FA5', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
              </div>
            ) : (
              <Select
                showSearch
                loading={loadingCenters}
                placeholder={loadingCenters ? 'Loading centers...' : 'Choose a VFS center'}
                style={{ width: '100%' }}
                value={centerId ?? undefined}
                onChange={handleCenterChange}
                options={centerOptions}
                disabled={booking}
                filterOption={(input, option) =>
                  (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            )}
          </div>

          {/* Step 2: Date (visible after center selected) */}
          {centerId && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888886', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select appointment date</div>
              <InlineCalendar
                month={month}
                availMap={availCache}
                loadingAvail={loadingAvail}
                selectedDate={date}
                onSelect={handleDateSelect}
                onMonthChange={handleMonthChange}
              />
              {showWarning && (
                <div style={{ fontSize: 11, color: '#854F0B', marginTop: 8, padding: '6px 10px', background: '#FFFBF3', borderRadius: 4, border: '1px solid #F0D9A0' }}>
                  This may not allow enough processing time. Switzerland typically takes 15 working days.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Time (visible after date selected) */}
          {centerId && date && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#888886', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Select time slot</div>
              <TimeSlotRow
                slots={slots}
                loading={loadingSlots}
                error={errorSlots}
                selectedTime={time}
                onSelect={setTime}
                onRetry={() => centerId && date && loadSlots(centerId, date)}
              />
            </div>
          )}

          {/* Booking error */}
          {errorBooking && (
            <div style={{ fontSize: 12, color: '#A32D2D', padding: '6px 10px', background: '#FEF2F2', borderRadius: 4 }}>
              {errorBooking}
            </div>
          )}
        </div>
      </Modal>

      {/* Discard confirmation */}
      <Modal
        open={discardOpen}
        onOk={handleDiscard}
        onCancel={() => setDiscardOpen(false)}
        title="Discard selection?"
        okText="Discard"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={360}
        centered
      >
        <p style={{ fontSize: 13, color: '#444', margin: '8px 0' }}>Your slot selection will be lost.</p>
      </Modal>
    </>
  );
}

export default function SlotBookingModal(props: SlotBookingModalProps) {
  return (
    <ConfigProvider>
      <SlotBookingModalInner {...props} />
    </ConfigProvider>
  );
}
