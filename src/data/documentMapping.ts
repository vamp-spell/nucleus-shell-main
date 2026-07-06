export type DocStatus = 'unassigned' | 'assigned' | 'rejected';
export type AiConfidence = 'high' | 'medium' | 'low' | null;

export interface UploadedDocument {
  id: number;
  filename: string;
  fileUrl: string;
  mimeType: string;
  aiClassification: {
    suggestedType: string | null;
    suggestedTravellerId: number | null;
    confidence: AiConfidence;
  };
  issue: string | null;
  status: DocStatus;
  assignedTo: number | null;
  assignedType: string | null;
  rejectReason: string | null;
}

export interface TravellerDoc {
  id: number;
  fullName: string;
  role: 'Primary' | 'Spouse' | 'Child' | 'Other';
  requiredDocTypes: string[];
}

export const ISSUE_LABELS: Record<string, string> = {
  ears_covered: 'Ears covered',
  blurry: 'Blurry image',
  wrong_document: 'Wrong document type',
  expired: 'Expired document',
  missing_pages: 'Missing pages',
  low_resolution: 'Low resolution',
  glare: 'Glare on document',
  glasses: 'Glasses in photo',
};

export const REJECT_REASONS = [
  'Illegible or unclear',
  'Wrong document type',
  'Document expired',
  'Missing pages or sections',
  'Compliance issue (photo)',
  'Not a valid document',
];

export const JURISDICTION_DOC_TYPES: Record<string, string[]> = {
  Vietnam: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
  Azerbaijan: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking', 'Travel insurance'],
  Singapore: ['Passport', 'Photo', 'Bank statement', 'Employment letter', 'Flight itinerary', 'Hotel booking'],
  'South Africa': ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking', 'Travel insurance'],
  Oman: ['Passport', 'Photo', 'Flight itinerary', 'Hotel booking'],
  Bahrain: ['Passport', 'Photo', 'Flight itinerary', 'Hotel booking'],
  Indonesia: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
  Georgia: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary'],
  Switzerland: ['Passport', 'Photo', 'Bank statement', 'Employment letter', 'Leave letter', 'Travel insurance', 'Flight itinerary', 'Hotel booking'],
  Israel: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
  UAE: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
  Taiwan: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
  China: ['Passport', 'Photo', 'Bank statement', 'Employment letter', 'Flight itinerary', 'Hotel booking'],
  default: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'],
};

const COUNTRY_CODE_MAP: Record<string, string> = {
  VNM: 'Vietnam',
  AZE: 'Azerbaijan',
  SGP: 'Singapore',
  ZFA: 'South Africa',
  OMN: 'Oman',
  BHR: 'Bahrain',
  IDN: 'Indonesia',
  GEO: 'Georgia',
  CHE: 'Switzerland',
  ISR: 'Israel',
  ARE: 'UAE',
  TW: 'Taiwan',
  CHN: 'China',
};

export function getOrderCountry(orderId: string): string {
  const code = orderId.split('-')[1];
  return COUNTRY_CODE_MAP[code] ?? 'default';
}

// Stable mock travellers per order derived from orderDetails
const MOCK_TRAVELLER_SETS: Record<string, TravellerDoc[]> = {
  'SMV-VNM-15621': [
    { id: 1, fullName: 'Rahul Sharma', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'] },
    { id: 2, fullName: 'Priya Sharma', role: 'Spouse', requiredDocTypes: ['Passport', 'Photo', 'Bank statement'] },
  ],
  'SMV-AZE-02569': [
    { id: 1, fullName: 'Anil Verma', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking', 'Travel insurance'] },
    { id: 2, fullName: 'Sunita Verma', role: 'Spouse', requiredDocTypes: ['Passport', 'Photo', 'Bank statement'] },
    { id: 3, fullName: 'Rohan Verma', role: 'Child', requiredDocTypes: ['Passport', 'Photo'] },
    { id: 4, fullName: 'Kavya Verma', role: 'Child', requiredDocTypes: ['Passport', 'Photo'] },
  ],
  'SMV-SGP-11815': [
    { id: 1, fullName: 'Deepak Nair', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Employment letter', 'Flight itinerary', 'Hotel booking'] },
    { id: 2, fullName: 'Anjali Nair', role: 'Spouse', requiredDocTypes: ['Passport', 'Photo', 'Bank statement'] },
  ],
  'SMV-ZFA-00450': [
    { id: 1, fullName: 'Farouk Patel', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking', 'Travel insurance'] },
  ],
  'SMV-GEO-00563': [
    { id: 1, fullName: 'Siddharth Joshi', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary'] },
    { id: 2, fullName: 'Nandini Joshi', role: 'Spouse', requiredDocTypes: ['Passport', 'Photo', 'Bank statement'] },
    { id: 3, fullName: 'Aryan Joshi', role: 'Child', requiredDocTypes: ['Passport', 'Photo'] },
    { id: 4, fullName: 'Riya Joshi', role: 'Child', requiredDocTypes: ['Passport', 'Photo'] },
    { id: 5, fullName: 'Vihaan Joshi', role: 'Child', requiredDocTypes: ['Passport', 'Photo'] },
  ],
  'SMV-CHE-00748': [
    { id: 1, fullName: 'Pradeep Iyer', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Employment letter', 'Leave letter', 'Travel insurance', 'Flight itinerary', 'Hotel booking'] },
    { id: 2, fullName: 'Lakshmi Iyer', role: 'Spouse', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Leave letter'] },
  ],
  'SMV-ISR-00008': [
    { id: 1, fullName: 'Nikhil Bhat', role: 'Primary', requiredDocTypes: ['Passport', 'Photo', 'Bank statement', 'Flight itinerary', 'Hotel booking'] },
  ],
};

function defaultTravellers(_orderId: string, pax: number, country: string): TravellerDoc[] {
  const types = JURISDICTION_DOC_TYPES[country] ?? JURISDICTION_DOC_TYPES.default;
  return Array.from({ length: pax }, (_, i) => ({
    id: i + 1,
    fullName: ['Rahul Sharma', 'Priya Sharma', 'Arjun Pillai', 'Meera Nair', 'Deepak Kumar'][i] ?? `Traveller ${i + 1}`,
    role: (i === 0 ? 'Primary' : i === 1 ? 'Spouse' : 'Child') as TravellerDoc['role'],
    requiredDocTypes: i === 0 ? types : types.slice(0, 2),
  }));
}

export function getMockTravellers(orderId: string, pax = 2): TravellerDoc[] {
  if (MOCK_TRAVELLER_SETS[orderId]) return MOCK_TRAVELLER_SETS[orderId];
  const country = getOrderCountry(orderId);
  return defaultTravellers(orderId, pax, country);
}

// Colour palette for doc-type thumbnails (bg / text)
const DOC_TYPE_COLOURS: Record<string, { bg: string; text: string }> = {
  Passport: { bg: '#E6F1FB', text: '#185FA5' },
  Photo: { bg: '#FCEBEB', text: '#A32D2D' },
  'Bank statement': { bg: '#EAF3DE', text: '#3B6D11' },
  'Flight itinerary': { bg: '#FAEEDA', text: '#854F0B' },
  'Hotel booking': { bg: '#F3E5F5', text: '#6A1B9A' },
  'Employment letter': { bg: '#E0F7FA', text: '#006064' },
  'Leave letter': { bg: '#FBE9E7', text: '#BF360C' },
  'Travel insurance': { bg: '#E8EAF6', text: '#283593' },
};

export function docTypeColour(type: string | null) {
  if (!type) return { bg: '#F1EFE8', text: '#888886' };
  return DOC_TYPE_COLOURS[type] ?? { bg: '#F1EFE8', text: '#888886' };
}

// Generate a realistic set of mock documents for any order
export function generateMockDocs(orderId: string, travellers: TravellerDoc[]): UploadedDocument[] {
  const country = getOrderCountry(orderId);
  const docs: UploadedDocument[] = [];
  let id = 1;

  const fileNames = [
    'WhatsApp Image 2026-07-06 at 9.14.22 AM.jpg',
    'WhatsApp Image 2026-07-06 at 9.14.23 AM.jpg',
    'IMG_20260706_091422.jpg',
    'IMG_20260706_091523.jpg',
    'Screenshot_20260706_091655.jpg',
    'scan0001.jpg',
    'scan0002.jpg',
    'document_upload.jpg',
    'flight_booking_confirmation.pdf',
    'hotel_reservation_details.pdf',
    'bank_statement_june2026.pdf',
    'employment_certificate.pdf',
    'travel_insurance_policy.pdf',
    'leave_letter_stamped.pdf',
    'visa_photo.jpg',
  ];

  let fileIdx = 0;

  // Per-traveller: passport + photo
  travellers.forEach((t) => {
    docs.push({
      id: id++,
      filename: fileNames[fileIdx++ % fileNames.length],
      fileUrl: '',
      mimeType: 'image/jpeg',
      aiClassification: { suggestedType: 'Passport', suggestedTravellerId: t.id, confidence: 'high' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });

    const photoIssue = t.role === 'Spouse' ? 'ears_covered' : null;
    docs.push({
      id: id++,
      filename: fileNames[fileIdx++ % fileNames.length],
      fileUrl: '',
      mimeType: 'image/jpeg',
      aiClassification: { suggestedType: 'Photo', suggestedTravellerId: t.id, confidence: photoIssue ? 'medium' : 'high' },
      issue: photoIssue,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  });

  // Shared: flight itinerary
  if (JURISDICTION_DOC_TYPES[country]?.includes('Flight itinerary')) {
    docs.push({
      id: id++,
      filename: 'flight_booking_confirmation.pdf',
      fileUrl: '',
      mimeType: 'application/pdf',
      aiClassification: { suggestedType: 'Flight itinerary', suggestedTravellerId: null, confidence: 'medium' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  }

  // Shared: hotel booking
  if (JURISDICTION_DOC_TYPES[country]?.includes('Hotel booking')) {
    docs.push({
      id: id++,
      filename: 'hotel_reservation_details.pdf',
      fileUrl: '',
      mimeType: 'application/pdf',
      aiClassification: { suggestedType: 'Hotel booking', suggestedTravellerId: null, confidence: 'high' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  }

  // Bank statement (primary only)
  if (JURISDICTION_DOC_TYPES[country]?.includes('Bank statement') && travellers.length > 0) {
    docs.push({
      id: id++,
      filename: 'bank_statement_june2026.pdf',
      fileUrl: '',
      mimeType: 'application/pdf',
      aiClassification: { suggestedType: 'Bank statement', suggestedTravellerId: travellers[0].id, confidence: 'low' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  }

  // Country-specific extras
  if (JURISDICTION_DOC_TYPES[country]?.includes('Travel insurance')) {
    docs.push({
      id: id++,
      filename: 'travel_insurance_policy.pdf',
      fileUrl: '',
      mimeType: 'application/pdf',
      aiClassification: { suggestedType: 'Travel insurance', suggestedTravellerId: null, confidence: 'high' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  }

  if (JURISDICTION_DOC_TYPES[country]?.includes('Employment letter') && travellers.length > 0) {
    docs.push({
      id: id++,
      filename: 'employment_certificate.pdf',
      fileUrl: '',
      mimeType: 'application/pdf',
      aiClassification: { suggestedType: 'Employment letter', suggestedTravellerId: travellers[0].id, confidence: 'medium' },
      issue: null,
      status: 'unassigned',
      assignedTo: null,
      assignedType: null,
      rejectReason: null,
    });
  }

  // One unclassified doc for challenge
  docs.push({
    id: id++,
    filename: fileNames[fileIdx % fileNames.length],
    fileUrl: '',
    mimeType: 'image/jpeg',
    aiClassification: { suggestedType: null, suggestedTravellerId: null, confidence: null },
    issue: 'blurry',
    status: 'unassigned',
    assignedTo: null,
    assignedType: null,
    rejectReason: null,
  });

  return docs;
}
