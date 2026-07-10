import { useState, useRef, useEffect, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import dayjs, { type Dayjs } from 'dayjs';
import { Select, Modal, Spin, Tooltip, ConfigProvider, Dropdown, Popover, Input, Button, DatePicker, TimePicker } from 'antd';
import { LockOutlined, CheckCircleFilled } from '@ant-design/icons';
import CommsTab from "./CommsTab";
import EmbassyRefModal from "./EmbassyRefModal";
import CardModal from "./CardModal";
import Sidebar from "./Sidebar";
import Header from "./Header";
import AddOnsDrawer from "./AddOnsDrawer";
import SlotBookingModal from "./SlotBookingModal";
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
  CircleCheckIcon,
  PlusIcon,
  SendIcon,
  XIcon,
  ExternalLinkIcon,
  SparklesIcon,
  SearchXIcon,
  UploadIcon,
  PencilIcon,
  PackageIcon,
  LockIcon,
} from "./icons";
import {
  newOrders,
  attentionOrders,
  progressOrders,
  submittedOrders,
  type Order,
} from "../data/orders";
import { getOrderDetail, type Traveller, type DraftState, type VerdictColumnState, type ApplicationStatus, type OFCAppointment, type InterviewAppointment } from "../data/orderDetails";
import StatusCell from "./StatusCell";

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

function isCHEOrder(country: string): boolean {
  return country === 'Switzerland';
}

function isUSAOrder(country: string): boolean {
  return country === 'USA';
}

const OFC_LOCATIONS = [
  { id: 'mumbai-ofc', label: 'Mumbai OFC' },
  { id: 'delhi-ofc', label: 'New Delhi OFC' },
  { id: 'chennai-ofc', label: 'Chennai OFC' },
  { id: 'kolkata-ofc', label: 'Kolkata OFC' },
  { id: 'hyderabad-ofc', label: 'Hyderabad OFC' },
];

const CONSULATE_CITIES = [
  { id: 'mumbai', label: 'Mumbai' },
  { id: 'delhi', label: 'New Delhi' },
  { id: 'chennai', label: 'Chennai' },
  { id: 'kolkata', label: 'Kolkata' },
  { id: 'hyderabad', label: 'Hyderabad' },
];

function formatApptDate(dateStr: string): string {
  return dayjs(dateStr).format('MMM D');
}

function formatApptTime(timeStr: string): string {
  return dayjs(`2000-01-01T${timeStr}`).format('h:mm A');
}

function isWithin3WorkingDays(d: Dayjs): boolean {
  let count = 0;
  let cur = dayjs().startOf('day');
  const target = d.startOf('day');
  while (cur.isBefore(target)) {
    const dow = cur.day();
    if (dow !== 0 && dow !== 6) count++;
    cur = cur.add(1, 'day');
  }
  return count < 3;
}

function formatSlotDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatSlotTime(time: string): string {
  const [h, min] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(min).padStart(2, '0')} ${suffix}`;
}

// Slot + Center cell for CHE orders
function SlotCell({ traveller, onOpenSlotModal }: {
  traveller: Traveller;
  onOpenSlotModal: (t: Traveller) => void;
}) {
  const hasPassportInfo = !!(traveller.passportNumber && traveller.name);

  if (!traveller.slot) {
    return (
      <Tooltip title={!hasPassportInfo ? 'Complete document mapping before booking a slot.' : ''} placement="top">
        <button
          type="button"
          onClick={() => hasPassportInfo && onOpenSlotModal(traveller)}
          disabled={!hasPassportInfo}
          className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
          style={{ opacity: hasPassportInfo ? 1 : 0.5 }}
        >
          <PlusIcon className="w-[10px] h-[10px]" />
          Book slot
        </button>
      </Tooltip>
    );
  }

  const { date, time, centerLabel } = traveller.slot;
  const centerShort = centerLabel.replace(' VFS Global', '');

  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-[11px] text-[#1A1A1A]">
        {formatSlotDate(date)} · {formatSlotTime(time)} · {centerShort}
      </span>
      <button
        type="button"
        onClick={() => onOpenSlotModal(traveller)}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded hover:bg-[#E8E8E5] transition-all cursor-pointer"
      >
        <PencilIcon className="w-[10px] h-[10px] text-[#888886]" />
      </button>
    </div>
  );
}

// Passport Dispatch cell for CHE orders
function PassportDispatchCell({ traveller, onUpdateDispatch }: {
  traveller: Traveller;
  onUpdateDispatch: (travellerId: string, trackingUrl: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const dispatch = traveller.passportDispatch;

  if (!dispatch) return <span className="text-[11px] text-[#AAAAAA]">—</span>;

  if (dispatch.status === 'dispatched' && dispatch.trackingUrl) {
    return (
      <a
        href={dispatch.trackingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[11px] text-[#185FA5] hover:underline flex items-center gap-1"
      >
        <PackageIcon className="w-[11px] h-[11px]" />
        Dispatched · Track ↗
      </a>
    );
  }

  const popoverContent = (
    <div style={{ width: 228, padding: '4px 0' }}>
      <div style={{ fontSize: 11, color: '#888886', marginBottom: 6 }}>Paste courier tracking link</div>
      <Input
        size="small"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://tracking.example.com/..."
        onPressEnter={() => url.trim() && (onUpdateDispatch(traveller.id, url.trim()), setOpen(false), setUrl(''))}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button
          size="small"
          type="primary"
          disabled={!url.trim()}
          onClick={() => {
            onUpdateDispatch(traveller.id, url.trim());
            setOpen(false);
            setUrl('');
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={popoverContent}
      trigger="click"
      open={open}
      onOpenChange={(v) => { setOpen(v); if (!v) setUrl(''); }}
      placement="bottomLeft"
    >
      <button
        type="button"
        className="flex items-center gap-1 text-[11px] text-[#888886] bg-[#F7F7F5] border border-[#E8E8E5] rounded-[4px] px-2 py-[3px] cursor-pointer hover:bg-[#EEEEE9] transition-colors"
      >
        <PackageIcon className="w-[10px] h-[10px]" />
        Awaiting dispatch
      </button>
    </Popover>
  );
}

// DS-160 Ref cell with inline Popover — USA orders
function DS160Cell({ traveller, onSave }: {
  traveller: Traveller;
  onSave: (travellerId: string, code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [formatError, setFormatError] = useState('');

  useEffect(() => {
    if (open) {
      setValue(traveller.ds160?.confirmationCode ?? '');
      setFormatError('');
    }
  }, [open, traveller.ds160?.confirmationCode]);

  function handleSave() {
    const trimmed = value.trim().toUpperCase();
    if (!/^[A-Z]{2}-\d{3}-\d{5}$/.test(trimmed)) {
      setFormatError('Check the format. Should be AA-000-00000.');
      return;
    }
    onSave(traveller.id, trimmed);
    setOpen(false);
  }

  const popoverContent = (
    <div style={{ width: 280, padding: '4px 0' }}>
      <div style={{ fontSize: 11, color: '#888886', marginBottom: 6 }}>DS-160 confirmation code</div>
      <Input
        size="small"
        value={value}
        onChange={(e) => { setValue(e.target.value); setFormatError(''); }}
        placeholder="e.g. AA-000-00000"
        onPressEnter={handleSave}
        autoFocus
      />
      {formatError && <div style={{ fontSize: 11, color: '#CF1322', marginTop: 4 }}>{formatError}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
        <Button size="small" type="text" onClick={() => setOpen(false)}>Cancel</Button>
        <Button size="small" type="primary" disabled={!value.trim()} onClick={handleSave}>Save</Button>
      </div>
    </div>
  );

  if (traveller.ds160) {
    return (
      <Popover content={popoverContent} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
        <div className="flex items-center gap-1.5 group cursor-pointer">
          <span className="text-[11px] text-[#1A1A1A] font-mono">{traveller.ds160.confirmationCode}</span>
          <button type="button" className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded hover:bg-[#E8E8E5] transition-all cursor-pointer">
            <PencilIcon className="w-[10px] h-[10px] text-[#888886]" />
          </button>
        </div>
      </Popover>
    );
  }

  return (
    <Popover content={popoverContent} trigger="click" open={open} onOpenChange={setOpen} placement="bottomLeft">
      <button
        type="button"
        className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
      >
        <PlusIcon className="w-[10px] h-[10px]" />
        Add
      </button>
    </Popover>
  );
}

// Shared cell display for OFC / Interview appointments — USA orders
function AppointmentCell({ value, locationLabel, onOpen }: {
  value: { date: string; time: string } | undefined;
  locationLabel: string | undefined;
  onOpen: () => void;
}) {
  if (!value) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
      >
        <PlusIcon className="w-[10px] h-[10px]" />
        Add
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5 group">
      <span className="text-[11px] text-[#1A1A1A]">
        {formatApptDate(value.date)} · {formatApptTime(value.time)}{locationLabel ? ` · ${locationLabel}` : ''}
      </span>
      <button
        type="button"
        onClick={onOpen}
        className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-5 h-5 rounded hover:bg-[#E8E8E5] transition-all cursor-pointer"
      >
        <PencilIcon className="w-[10px] h-[10px] text-[#888886]" />
      </button>
    </div>
  );
}

// OFC Appointment Modal — USA orders
function OFCAppointmentModal({ open, traveller, travelDateStart, onClose, onSaved }: {
  open: boolean;
  traveller: Traveller | null;
  travelDateStart: string;
  onClose: () => void;
  onSaved: (travellerId: string, appt: Omit<OFCAppointment, 'loggedAt'>) => void;
}) {
  const [locationId, setLocationId] = useState<string | null>(null);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const dirty = !!(locationId || date || time);
  const canSave = !!(locationId && date && time);

  const travelDay = dayjs(`${travelDateStart} ${new Date().getFullYear()}`, 'MMM D YYYY');
  const dateAfterTravel = date ? date.isAfter(travelDay, 'day') : false;
  const dateTooSoon = date ? isWithin3WorkingDays(date) : false;

  useEffect(() => {
    if (open && traveller) {
      const ex = traveller.ofcAppointment;
      setLocationId(ex?.locationId ?? null);
      setDate(ex ? dayjs(ex.date) : null);
      setTime(ex ? dayjs(`2000-01-01T${ex.time}`) : null);
      setSaveError('');
      setDiscardOpen(false);
    }
  }, [open, traveller]);

  function handleClose() {
    if (dirty) setDiscardOpen(true);
    else onClose();
  }

  async function handleSave() {
    if (!traveller || !locationId || !date || !time) return;
    setSaving(true);
    setSaveError('');
    try {
      await new Promise((r) => setTimeout(r, 500));
      const loc = OFC_LOCATIONS.find((l) => l.id === locationId)!;
      onSaved(traveller.id, {
        date: date.format('YYYY-MM-DD'),
        time: time.format('HH:mm'),
        locationId,
        locationLabel: loc.label,
      });
    } catch {
      setSaveError('Failed to save. Try again.');
      setSaving(false);
    }
  }

  return (
    <ConfigProvider>
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={480}
        centered
        maskClosable={false}
        title={null}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>Log OFC appointment</div>
          <div style={{ fontSize: 12, color: '#888886', marginBottom: 20 }}>
            {traveller?.name ?? 'Unknown traveller'} · {traveller?.id ?? '—'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>OFC location</div>
              <Select
                showSearch
                value={locationId}
                onChange={setLocationId}
                placeholder="Select OFC location"
                style={{ width: '100%' }}
                options={OFC_LOCATIONS.map((l) => ({ label: l.label, value: l.id }))}
                filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Appointment date</div>
              <DatePicker
                value={date}
                onChange={setDate}
                disabledDate={(cur) => cur && cur.isBefore(dayjs().startOf('day'))}
                format="DD MMM YYYY"
                style={{ width: '100%' }}
              />
              {dateTooSoon && !dateAfterTravel && (
                <div style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                  This appointment is very soon. Make sure documents are ready.
                </div>
              )}
              {dateAfterTravel && (
                <div style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                  This appointment is after the travel start date. Check with the team before saving.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Appointment time</div>
              <TimePicker
                value={time}
                onChange={setTime}
                format="h:mm A"
                minuteStep={15}
                use12Hours
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {saveError && (
            <div style={{ fontSize: 12, color: '#CF1322', marginTop: 12 }}>{saveError}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 24px', marginTop: 8 }}>
          <Button type="text" onClick={handleClose}>Cancel</Button>
          <Button type="primary" disabled={!canSave} loading={saving} onClick={handleSave}>
            Save appointment
          </Button>
        </div>
      </Modal>

      <Modal
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onOk={() => { setDiscardOpen(false); onClose(); }}
        okText="Discard"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={360}
        centered
        title="Discard changes?"
      >
        <div style={{ fontSize: 13, color: '#888886' }}>Your unsaved changes will be lost.</div>
      </Modal>
    </ConfigProvider>
  );
}

// Interview Appointment Modal — USA orders
function InterviewAppointmentModal({ open, traveller, travelDateStart, onClose, onSaved }: {
  open: boolean;
  traveller: Traveller | null;
  travelDateStart: string;
  onClose: () => void;
  onSaved: (travellerId: string, appt: Omit<InterviewAppointment, 'loggedAt'>) => void;
}) {
  const [cityId, setCityId] = useState<string | null>(null);
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);

  const dirty = !!(cityId || date || time);
  const canSave = !!(cityId && date && time);

  const travelDay = dayjs(`${travelDateStart} ${new Date().getFullYear()}`, 'MMM D YYYY');
  const dateAfterTravel = date ? date.isAfter(travelDay, 'day') : false;
  const dateTooSoon = date ? isWithin3WorkingDays(date) : false;

  useEffect(() => {
    if (open && traveller) {
      const ex = traveller.interviewAppointment;
      setCityId(ex?.consulateCityId ?? null);
      setDate(ex ? dayjs(ex.date) : null);
      setTime(ex ? dayjs(`2000-01-01T${ex.time}`) : null);
      setSaveError('');
      setDiscardOpen(false);
    }
  }, [open, traveller]);

  function handleClose() {
    if (dirty) setDiscardOpen(true);
    else onClose();
  }

  async function handleSave() {
    if (!traveller || !cityId || !date || !time) return;
    setSaving(true);
    setSaveError('');
    try {
      await new Promise((r) => setTimeout(r, 500));
      const city = CONSULATE_CITIES.find((c) => c.id === cityId)!;
      onSaved(traveller.id, {
        date: date.format('YYYY-MM-DD'),
        time: time.format('HH:mm'),
        consulateCityId: cityId,
        consulateCityLabel: city.label,
      });
    } catch {
      setSaveError('Failed to save. Try again.');
      setSaving(false);
    }
  }

  return (
    <ConfigProvider>
      <Modal
        open={open}
        onCancel={handleClose}
        footer={null}
        width={480}
        centered
        maskClosable={false}
        title={null}
        closable={false}
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '24px 24px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A', marginBottom: 2 }}>Log interview appointment</div>
          <div style={{ fontSize: 12, color: '#888886', marginBottom: 20 }}>
            {traveller?.name ?? 'Unknown traveller'} · {traveller?.id ?? '—'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Consulate city</div>
              <Select
                showSearch
                value={cityId}
                onChange={setCityId}
                placeholder="Select consulate city"
                style={{ width: '100%' }}
                options={CONSULATE_CITIES.map((c) => ({ label: c.label, value: c.id }))}
                filterOption={(input, option) => (option?.label as string ?? '').toLowerCase().includes(input.toLowerCase())}
              />
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Appointment date</div>
              <DatePicker
                value={date}
                onChange={setDate}
                disabledDate={(cur) => cur && cur.isBefore(dayjs().startOf('day'))}
                format="DD MMM YYYY"
                style={{ width: '100%' }}
              />
              {dateTooSoon && !dateAfterTravel && (
                <div style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                  This appointment is very soon. Make sure documents are ready.
                </div>
              )}
              {dateAfterTravel && (
                <div style={{ fontSize: 11, color: '#854F0B', marginTop: 4 }}>
                  This appointment is after the travel start date. Check with the team before saving.
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>Appointment time</div>
              <TimePicker
                value={time}
                onChange={setTime}
                format="h:mm A"
                minuteStep={15}
                use12Hours
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {saveError && (
            <div style={{ fontSize: 12, color: '#CF1322', marginTop: 12 }}>{saveError}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px 24px', marginTop: 8 }}>
          <Button type="text" onClick={handleClose}>Cancel</Button>
          <Button type="primary" disabled={!canSave} loading={saving} onClick={handleSave}>
            Save appointment
          </Button>
        </div>
      </Modal>

      <Modal
        open={discardOpen}
        onCancel={() => setDiscardOpen(false)}
        onOk={() => { setDiscardOpen(false); onClose(); }}
        okText="Discard"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        width={360}
        centered
        title="Discard changes?"
      >
        <div style={{ fontSize: 13, color: '#888886' }}>Your unsaved changes will be lost.</div>
      </Modal>
    </ConfigProvider>
  );
}

type TabId = "application" | "documents" | "comms" | "automation" | "vri";

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

function VerdictCell({
  traveller,
  orderId,
  onSetVerdict,
  onOpenUploadModal,
}: {
  traveller: Traveller;
  orderId: string;
  onSetVerdict: (id: string, v: VerdictColumnState) => void;
  onOpenUploadModal: (t: Traveller) => void;
}) {
  const navigate = useNavigate();
  const { verdict, autoCheckDueDate } = traveller;

  function handleCheckNow() {
    onSetVerdict(traveller.id, 'checking');
    setTimeout(() => {
      onSetVerdict(traveller.id, 'needs_qc');
    }, 2500);
  }

  function handleRetry() {
    onSetVerdict(traveller.id, 'checking');
    setTimeout(() => {
      onSetVerdict(traveller.id, 'not_found');
    }, 2500);
  }

  if (verdict === 'empty') {
    return (
      <Tooltip title={autoCheckDueDate ? `Verdict check opens on ${autoCheckDueDate}` : 'Verdict check not yet scheduled'} placement="top">
        <span className="text-[12px] text-[#AAAAAA]">—</span>
      </Tooltip>
    );
  }

  if (verdict === 'due') {
    const daysUntil = autoCheckDueDate
      ? Math.max(0, Math.ceil((new Date(autoCheckDueDate).getTime() - Date.now()) / 86400000))
      : '?';
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-[#888886]">Auto-check in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</span>
        <button
          type="button"
          onClick={handleCheckNow}
          className="flex items-center gap-1 h-6 px-2 rounded border border-[#185FA5] text-[#185FA5] text-[11px] font-medium cursor-pointer hover:bg-[#E6F1FB] transition-colors"
        >
          Check now
        </button>
      </div>
    );
  }

  if (verdict === 'checking') {
    return (
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <div
            className="w-[6px] h-[6px] rounded-full bg-[#185FA5] shrink-0"
            style={{ animation: 'verdictPulse 1.5s ease-in-out infinite' }}
          />
          <span className="text-[11px] text-[#185FA5] font-medium">Checking inbox...</span>
        </div>
        <span className="text-[10px] text-[#888886] pl-[14px]">Scanning catchall for visa email</span>
      </div>
    );
  }

  if (verdict === 'needs_qc') {
    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          onClick={() => navigate(`/orders/${orderId}/verdict-qc/${traveller.id}`)}
          className="flex items-center gap-1 h-6 px-2 rounded border border-[#854F0B] text-[#854F0B] text-[12px] font-medium cursor-pointer hover:bg-[#FAEEDA] transition-colors"
        >
          <SparklesIcon className="w-[11px] h-[11px]" />
          Needs QC
        </button>
        <span className="text-[10px] text-[#888886]">Visa found · AI analyzed</span>
      </div>
    );
  }

  if (verdict === 'not_found') {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1 text-[11px] text-[#888886]">
          <SearchXIcon className="w-[11px] h-[11px]" />
          <span>Not found in inbox</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRetry}
            className="flex items-center gap-1 h-6 px-2 rounded border border-[#185FA5] text-[#185FA5] text-[11px] font-medium cursor-pointer hover:bg-[#E6F1FB] transition-colors"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => onOpenUploadModal(traveller)}
            className="flex items-center gap-1 h-6 px-2 rounded border border-[#E8E8E5] text-[#888886] text-[11px] cursor-pointer hover:bg-[#F7F7F5] transition-colors"
          >
            <UploadIcon className="w-[10px] h-[10px]" />
            Upload
          </button>
        </div>
      </div>
    );
  }

  if (verdict === 'approved') {
    return (
      <button
        type="button"
        onClick={() => navigate(`/orders/${orderId}/verdict-qc/${traveller.id}`)}
        className="flex items-center gap-1.5 text-[11px] text-[#3B6D11] font-medium cursor-pointer hover:opacity-75 transition-opacity"
      >
        <CircleCheckIcon className="w-[13px] h-[13px]" />
        <span>Approved</span>
      </button>
    );
  }

  if (verdict === 'rejected') {
    return (
      <button
        type="button"
        onClick={() => navigate(`/orders/${orderId}/verdict-qc/${traveller.id}`)}
        className="flex items-center gap-1.5 text-[11px] text-[#A32D2D] font-medium cursor-pointer hover:opacity-75 transition-opacity"
      >
        <CircleXIcon className="w-[13px] h-[13px]" />
        <span>Rejected</span>
      </button>
    );
  }

  return <span className="text-[12px] text-[#AAAAAA]">—</span>;
}

// Upload verdict modal
function UploadVerdictModal({
  traveller,
  onClose,
  onUploaded,
}: {
  traveller: Traveller | null;
  onClose: () => void;
  onUploaded: (travellerId: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  function handleFile() {
    if (!traveller) return;
    setUploading(true);
    onUploaded(traveller.id);
    setTimeout(() => {
      setUploading(false);
      onClose();
    }, 1200);
  }

  return (
    <Modal
      title={`Upload verdict document${traveller ? ` — ${traveller.name}` : ''}`}
      open={traveller !== null}
      onCancel={onClose}
      footer={null}
      width={440}
      centered
      destroyOnClose
    >
      <div style={{ paddingTop: 12 }}>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(); }}
          onClick={handleFile}
          style={{
            border: `2px dashed ${dragging ? '#185FA5' : '#CCCCCA'}`,
            borderRadius: 8,
            padding: '32px 16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragging ? '#E6F1FB' : '#FAFAF8',
            transition: 'all 0.15s',
          }}
        >
          <UploadIcon className="w-6 h-6 text-[#AAAAAA] mx-auto mb-2" />
          <div style={{ fontSize: 13, color: '#1A1A1A', marginBottom: 4 }}>
            {uploading ? 'Uploading...' : 'Drop the visa document here or browse'}
          </div>
          <div style={{ fontSize: 11, color: '#888886' }}>PDF, JPG, PNG · max 10 MB</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 11, color: '#854F0B' }}>
          <SparklesIcon className="w-[12px] h-[12px]" />
          <span>AI QC will run automatically once the document is uploaded</span>
        </div>
      </div>
    </Modal>
  );
}

interface TravellerRowProps {
  traveller: Traveller;
  isSelected: boolean;
  copiedEmbassyId: string | null;
  orderCountry: string;
  orderId: string;
  isCHE: boolean;
  isUSA: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDraftModal: (t: Traveller) => void;
  onCopyEmbassyRef: (id: string, value: string, e: MouseEvent) => void;
  jurisdictionFlash: Set<string>;
  onSaveJurisdiction: (id: string, val: string) => void;
  onSetVerdict: (travellerId: string, verdict: VerdictColumnState) => void;
  onSaveField: (travellerId: string, field: 'embassyRefId' | 'card', value: string) => void;
  onSetApplicationStatus: (travellerId: string, status: ApplicationStatus) => void;
  onOpenUploadModal: (t: Traveller) => void;
  onOpenSlotModal: (t: Traveller) => void;
  onUpdateDispatch: (travellerId: string, trackingUrl: string) => void;
  onSaveDS160: (travellerId: string, code: string) => void;
  onOpenOFCModal: (t: Traveller) => void;
  onOpenInterviewModal: (t: Traveller) => void;
}

function TravellerRow({
  traveller,
  isSelected,
  copiedEmbassyId,
  orderCountry,
  orderId,
  isCHE,
  isUSA,
  onToggleSelect,
  onOpenDraftModal,
  onCopyEmbassyRef,
  jurisdictionFlash,
  onSaveJurisdiction,
  onSetVerdict,
  onSaveField,
  onSetApplicationStatus,
  onOpenUploadModal,
  onOpenSlotModal,
  onUpdateDispatch,
  onSaveDS160,
  onOpenOFCModal,
  onOpenInterviewModal,
}: TravellerRowProps) {
  const [embassyRefModalOpen, setEmbassyRefModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);

  const rowMenu = {
    items: [
      {
        key: 'upload_verdict',
        label: (
          <div className="flex items-center gap-2 py-0.5">
            <UploadIcon className="w-[13px] h-[13px] text-[#888886]" />
            <span className="text-[12px]">Upload verdict manually</span>
          </div>
        ),
        onClick: () => onOpenUploadModal(traveller),
      },
    ],
  };

  return (
    <div className={`flex min-h-[52px] border-b border-[#F1EFE8] items-center ${isSelected ? "bg-[#F0F4FF]" : "bg-white hover:bg-[#F9F9F7]"} transition-colors ${traveller.applicationStatus === 'void' ? 'opacity-60' : ''}`}>
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

      {/* Application Status */}
      <div className="flex-1 px-3 flex items-center">
        <StatusCell
          travellerId={traveller.id}
          travellerName={traveller.name}
          status={traveller.applicationStatus}
          manualStatus={traveller.manualStatus}
          onStatusChange={onSetApplicationStatus}
        />
      </div>

      {/* Jurisdiction — standard orders only */}
      {!isCHE && !isUSA && isJurisdictionApplicable(orderCountry) && (
        <div className="flex-1 px-3 flex items-center">
          <JurisdictionCell
            travellerId={traveller.id}
            value={traveller.jurisdiction}
            jurisdictionFlash={jurisdictionFlash}
            onSave={onSaveJurisdiction}
          />
        </div>
      )}

      {/* Embassy Ref — hidden for USA */}
      {!isUSA && <div className="flex-1 px-3 flex items-center gap-2">
        {isCHE ? (
          // CHE: read-only, auto-populated by slot booking
          <div className="flex items-center gap-1.5">
            {traveller.embassyRefId ? (
              <>
                <HashIcon className="w-[11px] h-[11px] text-[#888886] shrink-0" />
                <span className="text-[11px] text-[#1A1A1A] font-mono">{traveller.embassyRefId}</span>
                {traveller.embassyRefAutoPopulated && (
                  <Tooltip title="Auto-populated from VFS booking" placement="top">
                    <LockIcon className="w-[10px] h-[10px] text-[#AAAAAA]" />
                  </Tooltip>
                )}
              </>
            ) : (
              <span className="text-[11px] text-[#AAAAAA] italic">Auto-fills on booking</span>
            )}
          </div>
        ) : (
          <>
            {traveller.embassyRefId ? (
              <button
                type="button"
                onClick={() => setEmbassyRefModalOpen(true)}
                className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A] cursor-pointer hover:bg-[#F1EFE8] rounded px-1 py-0.5 transition-colors group"
              >
                <HashIcon className="w-[11px] h-[11px] text-[#888886]" />
                <span>{traveller.embassyRefId}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEmbassyRefModalOpen(true)}
                className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
              >
                <PlusIcon className="w-[10px] h-[10px]" />
                <span>Add</span>
              </button>
            )}
            {traveller.embassyRefId && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onCopyEmbassyRef(traveller.id, traveller.embassyRefId, e); }}
                className="flex items-center justify-center p-[3px] rounded hover:bg-[#E8E8E5] cursor-pointer"
                aria-label="Copy Embassy Ref"
              >
                <CopyIcon className={`w-[11px] h-[11px] ${copiedEmbassyId === traveller.id ? "text-[#3B6D11]" : "text-[#CCCCCA]"}`} />
              </button>
            )}
            <EmbassyRefModal
              open={embassyRefModalOpen}
              existing={traveller.embassyRefId}
              orderId=""
              travellerId={traveller.id}
              travellerName={traveller.name}
              onClose={() => setEmbassyRefModalOpen(false)}
              onSave={(val) => { onSaveField(traveller.id, 'embassyRefId', val); setEmbassyRefModalOpen(false); }}
            />
          </>
        )}
      </div>}

      {/* Card — standard orders only */}
      {!isCHE && !isUSA && (
        <div className="flex-1 px-3 flex items-center gap-1.5">
          {traveller.card ? (
            <button
              type="button"
              onClick={() => setCardModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-[#1A1A1A] cursor-pointer hover:bg-[#F1EFE8] rounded px-1 py-0.5 transition-colors"
            >
              <CreditCardIcon className="w-[11px] h-[11px] text-[#888886]" />
              <span>···{traveller.card}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCardModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-[#888886] border border-dashed border-[#CCCCCA] rounded-[4px] px-2 py-[3px] cursor-pointer hover:border-[#888886] hover:text-[#1A1A1A] transition-colors"
            >
              <PlusIcon className="w-[10px] h-[10px]" />
              <span>Add card</span>
            </button>
          )}
          <CardModal
            open={cardModalOpen}
            existingLast4={traveller.card}
            existingCardholderName=""
            orderId=""
            travellerId={traveller.id}
            travellerName={traveller.name}
            onClose={() => setCardModalOpen(false)}
            onSave={(last4, _cardholderName, _brand) => { onSaveField(traveller.id, 'card', last4); setCardModalOpen(false); }}
          />
        </div>
      )}

      {/* Slot + Center — CHE orders only */}
      {isCHE && (
        <div className="flex-1 px-3 flex items-center">
          <SlotCell traveller={traveller} onOpenSlotModal={onOpenSlotModal} />
        </div>
      )}

      {/* Passport Dispatch — CHE orders only */}
      {isCHE && (
        <div className="flex-1 px-3 flex items-center">
          <PassportDispatchCell traveller={traveller} onUpdateDispatch={onUpdateDispatch} />
        </div>
      )}

      {/* DS-160 Ref — USA orders only */}
      {isUSA && (
        <div className="flex-1 px-3 flex items-center">
          <DS160Cell traveller={traveller} onSave={onSaveDS160} />
        </div>
      )}

      {/* OFC Appointment — USA orders only */}
      {isUSA && (
        <div className="flex-1 px-3 flex items-center">
          <AppointmentCell
            value={traveller.ofcAppointment}
            locationLabel={traveller.ofcAppointment?.locationLabel}
            onOpen={() => onOpenOFCModal(traveller)}
          />
        </div>
      )}

      {/* Interview Appointment — USA orders only */}
      {isUSA && (
        <div className="flex-1 px-3 flex items-center">
          <AppointmentCell
            value={traveller.interviewAppointment}
            locationLabel={traveller.interviewAppointment?.consulateCityLabel}
            onOpen={() => onOpenInterviewModal(traveller)}
          />
        </div>
      )}

      {/* Draft */}
      <div className="flex-1 px-3 flex items-center">
        <DraftCell traveller={traveller} onOpenDraftModal={onOpenDraftModal} />
      </div>

      {/* Verdict */}
      <div className="flex-1 px-3 flex items-center">
        <VerdictCell
          traveller={traveller}
          orderId={orderId}
          onSetVerdict={onSetVerdict}
          onOpenUploadModal={onOpenUploadModal}
        />
      </div>

      {/* Row "..." menu */}
      <div className="w-8 flex items-center justify-center px-1 shrink-0">
        <Dropdown menu={rowMenu} trigger={['click']} placement="bottomRight">
          <button
            type="button"
            className="flex items-center justify-center w-6 h-6 rounded hover:bg-[#F1EFE8] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ opacity: undefined }}
          >
            <DotsHorizontalIcon className="w-[13px] h-[13px] text-[#888886]" />
          </button>
        </Dropdown>
      </div>
    </div>
  );
}

interface ApplicationTabProps {
  travellers: Traveller[];
  selectedIds: Set<string>;
  copiedEmbassyId: string | null;
  orderCountry: string;
  orderId: string;
  isCHE: boolean;
  isUSA: boolean;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onOpenDraftModal: (t: Traveller) => void;
  onCopyEmbassyRef: (id: string, value: string, e: MouseEvent) => void;
  jurisdictionFlash: Set<string>;
  onSaveJurisdiction: (travellerId: string, value: string) => void;
  onSetVerdict: (travellerId: string, verdict: VerdictColumnState) => void;
  onSaveField: (travellerId: string, field: 'embassyRefId' | 'card', value: string) => void;
  onSetApplicationStatus: (travellerId: string, status: ApplicationStatus) => void;
  onOpenUploadModal: (t: Traveller) => void;
  onOpenSlotModal: (t: Traveller) => void;
  onUpdateDispatch: (travellerId: string, trackingUrl: string) => void;
  onSaveDS160: (travellerId: string, code: string) => void;
  onOpenOFCModal: (t: Traveller) => void;
  onOpenInterviewModal: (t: Traveller) => void;
  setSelectedIds: (ids: Set<string>) => void;
}

function ApplicationTab({
  travellers,
  selectedIds,
  copiedEmbassyId,
  orderCountry,
  orderId,
  isCHE,
  isUSA,
  onToggleSelect,
  onToggleSelectAll,
  onOpenDraftModal,
  onCopyEmbassyRef,
  jurisdictionFlash,
  onSaveJurisdiction,
  onSetVerdict,
  onSaveField,
  onSetApplicationStatus,
  onOpenUploadModal,
  onOpenSlotModal,
  onUpdateDispatch,
  onSaveDS160,
  onOpenOFCModal,
  onOpenInterviewModal,
  setSelectedIds,
}: ApplicationTabProps) {
  const draftedCount = travellers.filter((t) => t.draftState === "drafted").length;
  const selectedArray = Array.from(selectedIds);
  const readySelected = selectedArray.filter((id) => travellers.find((t) => t.id === id)?.draftState === "ready");
  const needsQCTravellers = travellers.filter((t) => t.verdict === 'needs_qc');

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
      {/* Needs QC banner */}
      {needsQCTravellers.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#FFFBF3] border-b border-[#F0D9A0]">
          <SparklesIcon className="w-[13px] h-[13px] text-[#854F0B] shrink-0" />
          <span className="text-[12px] font-medium text-[#854F0B]">
            {needsQCTravellers.length} verdict{needsQCTravellers.length > 1 ? 's' : ''} ready for QC
          </span>
          <span className="text-[#CCCCCA]">·</span>
          <span className="text-[12px] text-[#888886]">
            {needsQCTravellers.map(t => t.name).join(', ')}
          </span>
        </div>
      )}

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
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Status</div>
        {!isCHE && !isUSA && isJurisdictionApplicable(orderCountry) && (
          <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Jurisdiction</div>
        )}
        {!isUSA && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Embassy Ref</div>}
        {!isCHE && !isUSA && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Card</div>}
        {isCHE && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Slot · Center</div>}
        {isCHE && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Passport Dispatch</div>}
        {isUSA && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">DS-160 Ref</div>}
        {isUSA && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">OFC Appointment</div>}
        {isUSA && <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Interview Appt</div>}
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Draft</div>
        <div className="flex-1 px-3 py-[6px] text-[10px] font-medium text-[#888886]">Verdict</div>
        <div className="w-8" />
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
          <Select
            size="small"
            placeholder="Change status to…"
            style={{ width: 160, fontSize: 11 }}
            onChange={(val: ApplicationStatus) => {
              const ids = Array.from(selectedIds);
              ids.forEach(id => onSetApplicationStatus(id, val));
              setSelectedIds(new Set());
            }}
            options={[
              { label: 'Created', value: 'created' },
              { label: 'In progress', value: 'in_progress' },
              { label: 'Ready to submit', value: 'ready_to_submit' },
              { label: 'Submitting', value: 'submitting' },
              { label: 'Awaiting result', value: 'awaiting_result' },
              { label: 'Completed', value: 'completed' },
              { label: 'Void', value: 'void' },
            ]}
          />
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
          copiedEmbassyId={copiedEmbassyId}
          orderCountry={orderCountry}
          orderId={orderId}
          isCHE={isCHE}
          isUSA={isUSA}
          onToggleSelect={onToggleSelect}
          onOpenDraftModal={onOpenDraftModal}
          onCopyEmbassyRef={onCopyEmbassyRef}
          jurisdictionFlash={jurisdictionFlash}
          onSaveJurisdiction={onSaveJurisdiction}
          onSetVerdict={onSetVerdict}
          onSaveField={onSaveField}
          onSetApplicationStatus={onSetApplicationStatus}
          onOpenUploadModal={onOpenUploadModal}
          onOpenSlotModal={onOpenSlotModal}
          onUpdateDispatch={onUpdateDispatch}
          onSaveDS160={onSaveDS160}
          onOpenOFCModal={onOpenOFCModal}
          onOpenInterviewModal={onOpenInterviewModal}
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
  const [uploadModalTraveller, setUploadModalTraveller] = useState<Traveller | null>(null);
  const [slotModalTraveller, setSlotModalTraveller] = useState<Traveller | null>(null);
  const [ofcModalTraveller, setOFCModalTraveller] = useState<Traveller | null>(null);
  const [interviewModalTraveller, setInterviewModalTraveller] = useState<Traveller | null>(null);

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

  function saveField(travellerId: string, field: 'embassyRefId' | 'card', value: string) {
    setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, [field]: value } : t));
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

  function setVerdict(travellerId: string, verdict: VerdictColumnState) {
    setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, verdict } : t));
  }

  function setApplicationStatus(travellerId: string, newStatus: ApplicationStatus) {
    setTravellers(prev => prev.map(t =>
      t.id === travellerId
        ? { ...t, applicationStatus: newStatus, manualStatus: { by: 'Meera Nair', at: 'Just now' } }
        : t
    ));
  }

  function handleBooked(travellerId: string, confirmation: import('../services/vfsService').SlotBookingConfirmation) {
    setTravellers(prev => prev.map(t => {
      if (t.id !== travellerId) return t;
      return {
        ...t,
        embassyRefId: confirmation.bookingReference,
        embassyRefAutoPopulated: true,
        slot: {
          date: confirmation.appointmentDate,
          time: confirmation.appointmentTime,
          centerId: confirmation.centerId,
          centerLabel: confirmation.centerLabel,
          bookingReference: confirmation.bookingReference,
        },
        draftState: t.draftState === 'locked' ? 'ready' : t.draftState,
      };
    }));
    setSlotModalTraveller(null);
  }

  function updateDispatch(travellerId: string, trackingUrl: string) {
    setTravellers(prev => prev.map(t =>
      t.id === travellerId
        ? { ...t, passportDispatch: { status: 'dispatched', trackingUrl, updatedAt: new Date().toISOString() } }
        : t
    ));
  }

  function saveDS160(travellerId: string, code: string) {
    setTravellers(prev => prev.map(t =>
      t.id === travellerId
        ? { ...t, ds160: { confirmationCode: code, loggedAt: new Date().toISOString() } }
        : t
    ));
  }

  function saveOFCAppointment(travellerId: string, appt: Omit<OFCAppointment, 'loggedAt'>) {
    setTravellers(prev => prev.map(t =>
      t.id === travellerId
        ? { ...t, ofcAppointment: { ...appt, loggedAt: new Date().toISOString() } }
        : t
    ));
    const name = travellers.find(t => t.id === travellerId)?.name ?? 'Traveller';
    showToast(`OFC appointment logged for ${name}`);
    setOFCModalTraveller(null);
  }

  function saveInterviewAppointment(travellerId: string, appt: Omit<InterviewAppointment, 'loggedAt'>) {
    setTravellers(prev => prev.map(t =>
      t.id === travellerId
        ? { ...t, interviewAppointment: { ...appt, loggedAt: new Date().toISOString() } }
        : t
    ));
    const name = travellers.find(t => t.id === travellerId)?.name ?? 'Traveller';
    showToast(`Interview appointment logged for ${name}`);
    setInterviewModalTraveller(null);
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
          @keyframes verdictPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.75); }
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
                onClick={() => navigate('/')}
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
                selectedIds={selectedIds}
                copiedEmbassyId={copiedEmbassyId}
                orderCountry={order.country}
                orderId={orderIdStr}
                isCHE={isCHEOrder(order.country)}
                isUSA={isUSAOrder(order.country)}
                onToggleSelect={toggleSelect}
                onToggleSelectAll={toggleSelectAll}
                onOpenDraftModal={openDraftModal}
                onCopyEmbassyRef={handleCopyEmbassyRef}
                jurisdictionFlash={jurisdictionFlash}
                onSaveJurisdiction={saveJurisdiction}
                onSetVerdict={setVerdict}
                onSaveField={saveField}
                onSetApplicationStatus={setApplicationStatus}
                onOpenUploadModal={setUploadModalTraveller}
                onOpenSlotModal={setSlotModalTraveller}
                onUpdateDispatch={updateDispatch}
                onSaveDS160={saveDS160}
                onOpenOFCModal={setOFCModalTraveller}
                onOpenInterviewModal={setInterviewModalTraveller}
                setSelectedIds={setSelectedIds}
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

        <UploadVerdictModal
          traveller={uploadModalTraveller}
          onClose={() => setUploadModalTraveller(null)}
          onUploaded={(travellerId) => {
            setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, verdict: 'checking' as VerdictColumnState } : t));
            setTimeout(() => {
              setTravellers(prev => prev.map(t => t.id === travellerId ? { ...t, verdict: 'needs_qc' as VerdictColumnState } : t));
            }, 2500);
          }}
        />

        <SlotBookingModal
          open={slotModalTraveller !== null}
          traveller={slotModalTraveller}
          orderId={orderIdStr}
          travelDateStart={order.travelDateStart}
          onClose={() => setSlotModalTraveller(null)}
          onBooked={handleBooked}
        />

        <OFCAppointmentModal
          open={ofcModalTraveller !== null}
          traveller={ofcModalTraveller}
          travelDateStart={order.travelDateStart}
          onClose={() => setOFCModalTraveller(null)}
          onSaved={saveOFCAppointment}
        />

        <InterviewAppointmentModal
          open={interviewModalTraveller !== null}
          traveller={interviewModalTraveller}
          travelDateStart={order.travelDateStart}
          onClose={() => setInterviewModalTraveller(null)}
          onSaved={saveInterviewAppointment}
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
