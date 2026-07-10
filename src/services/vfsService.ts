export type VFSCenter = {
  id: string;
  city: string;
  label: string;
};

export type AvailableDate = {
  date: string;
  hasSlots: boolean;
};

export type TimeSlot = {
  time: string;
  available: boolean;
  remainingCount: number;
};

export type SlotBookingRequest = {
  orderId: string;
  travellerId: string;
  centerId: string;
  appointmentDate: string;
  appointmentTime: string;
  travellerDetails: {
    fullName: string;
    passportNumber: string;
    dateOfBirth: string;
  };
};

export type SlotBookingConfirmation = {
  bookingReference: string;
  centerId: string;
  centerLabel: string;
  appointmentDate: string;
  appointmentTime: string;
  confirmedAt: string;
};

const MOCK_CENTERS: VFSCenter[] = [
  { id: 'CHE_MUM', city: 'Mumbai', label: 'Mumbai VFS Global' },
  { id: 'CHE_DEL', city: 'Delhi', label: 'Delhi VFS Global' },
  { id: 'CHE_MAA', city: 'Chennai', label: 'Chennai VFS Global' },
  { id: 'CHE_BLR', city: 'Bengaluru', label: 'Bengaluru VFS Global' },
  { id: 'CHE_CCU', city: 'Kolkata', label: 'Kolkata VFS Global' },
];

const MOCK_SLOTS: TimeSlot[] = [
  { time: '09:00', available: true, remainingCount: 10 },
  { time: '09:30', available: true, remainingCount: 8 },
  { time: '10:00', available: true, remainingCount: 3 },
  { time: '10:30', available: false, remainingCount: 0 },
  { time: '11:00', available: true, remainingCount: 12 },
  { time: '11:30', available: true, remainingCount: 2 },
  { time: '14:00', available: false, remainingCount: 0 },
  { time: '14:30', available: true, remainingCount: 5 },
  { time: '15:00', available: true, remainingCount: 1 },
  { time: '15:30', available: true, remainingCount: 7 },
];

function dateHasSlots(dateStr: string, centerId: string): boolean {
  const d = new Date(dateStr);
  const dow = d.getDay();
  if (dow === 0 || dow === 6) return false;
  // Deterministic pseudo-random from date + center
  const hash = (dateStr + centerId).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return hash % 7 !== 0;
}

export async function getVFSCenters(_country: string): Promise<VFSCenter[]> {
  await new Promise((r) => setTimeout(r, 600));
  return MOCK_CENTERS;
}

export async function getMonthAvailability(centerId: string, month: string): Promise<AvailableDate[]> {
  await new Promise((r) => setTimeout(r, 500));
  const [year, mon] = month.split('-').map(Number);
  const daysInMonth = new Date(year, mon, 0).getDate();
  const results: AvailableDate[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${month}-${String(d).padStart(2, '0')}`;
    results.push({ date: dateStr, hasSlots: dateHasSlots(dateStr, centerId) });
  }
  return results;
}

export async function getTimeSlots(_centerId: string, _date: string): Promise<TimeSlot[]> {
  await new Promise((r) => setTimeout(r, 400));
  return MOCK_SLOTS;
}

export async function bookSlot(request: SlotBookingRequest): Promise<SlotBookingConfirmation> {
  await new Promise((r) => setTimeout(r, 900));
  const center = MOCK_CENTERS.find((c) => c.id === request.centerId);
  const refNum = Math.floor(1000 + Math.random() * 9000);
  return {
    bookingReference: `VFS-${request.centerId.slice(-3)}-${request.appointmentDate.replace(/-/g, '')}-${refNum}`,
    centerId: request.centerId,
    centerLabel: center?.label ?? request.centerId,
    appointmentDate: request.appointmentDate,
    appointmentTime: request.appointmentTime,
    confirmedAt: new Date().toISOString(),
  };
}
