export type AddOnCategory =
  | 'document_services'
  | 'courier_logistics'
  | 'travel_documents'
  | 'insurance'
  | 'miscellaneous';

export interface AddOn {
  id: string;
  name: string;
  category: AddOnCategory;
  pricePerUnit: number;
  isQuantifiable: boolean;
  description?: string;
}

export interface SelectedAddOn {
  addOnId: string;
  quantity: number;
}

export const CATEGORY_LABELS: Record<AddOnCategory, string> = {
  document_services: 'Document services',
  courier_logistics: 'Courier and logistics',
  travel_documents: 'Travel documents',
  insurance: 'Insurance',
  miscellaneous: 'Miscellaneous',
};

export const CATEGORY_ORDER: AddOnCategory[] = [
  'document_services',
  'courier_logistics',
  'travel_documents',
  'insurance',
  'miscellaneous',
];

export const ADD_ON_CATALOGUE: AddOn[] = [
  // Document services
  { id: 'photo_making', name: 'Photo making', category: 'document_services', pricePerUnit: 150, isQuantifiable: true, description: 'Passport-size photos printed at office' },
  { id: 'stamp_charges', name: 'Stamp making charges', category: 'document_services', pricePerUnit: 50, isQuantifiable: false },
  { id: 'outside_office_print', name: 'Outside office printout', category: 'document_services', pricePerUnit: 30, isQuantifiable: false },
  { id: 'notary_standard', name: 'Notary', category: 'document_services', pricePerUnit: 300, isQuantifiable: false },
  { id: 'notary_delhi', name: 'Notary — Delhi', category: 'document_services', pricePerUnit: 400, isQuantifiable: false },
  { id: 'notary_affidavit_delhi', name: 'Notary with affidavit — Delhi', category: 'document_services', pricePerUnit: 600, isQuantifiable: false, description: 'Notarised affidavit prepared and attested in Delhi' },

  // Courier and logistics
  { id: 'doc_pick_drop', name: 'Document pick and drop', category: 'courier_logistics', pricePerUnit: 200, isQuantifiable: false },
  { id: 'courier', name: 'Courier', category: 'courier_logistics', pricePerUnit: 150, isQuantifiable: true, description: 'Per-passport courier charge' },
  { id: 'cargo', name: 'Cargo charges', category: 'courier_logistics', pricePerUnit: 500, isQuantifiable: true },
  { id: 'passport_pickup', name: 'Passport pickup', category: 'courier_logistics', pricePerUnit: 100, isQuantifiable: false },
  { id: 'passport_drop', name: 'Passport drop', category: 'courier_logistics', pricePerUnit: 100, isQuantifiable: false },

  // Travel documents
  { id: 'esim', name: 'eSIM', category: 'travel_documents', pricePerUnit: 299, isQuantifiable: false, description: 'International eSIM data plan for the trip duration' },
  { id: 'flight_itinerary', name: 'Flight itinerary', category: 'travel_documents', pricePerUnit: 200, isQuantifiable: false },
  { id: 'hotel_itinerary', name: 'Hotel itinerary', category: 'travel_documents', pricePerUnit: 200, isQuantifiable: false },

  // Insurance
  { id: 'travel_insurance', name: 'Travel insurance', category: 'insurance', pricePerUnit: 499, isQuantifiable: false },
  { id: 'visa_rejection_insurance', name: 'Visa rejection insurance', category: 'insurance', pricePerUnit: 799, isQuantifiable: false, description: 'Covers visa fee reimbursement on rejection' },

  // Miscellaneous
  { id: 'miscellaneous', name: 'Miscellaneous', category: 'miscellaneous', pricePerUnit: 0, isQuantifiable: false },
  { id: 'miscellaneous_gst', name: 'Miscellaneous (with GST)', category: 'miscellaneous', pricePerUnit: 0, isQuantifiable: false },
];

// Map legacy display strings from orderDetails to catalogue IDs
const LEGACY_NAME_TO_ID: Record<string, string> = {
  'eSIM': 'esim',
  'Travel insurance': 'travel_insurance',
  'Visa rejection insurance': 'visa_rejection_insurance',
  'Flight itinerary': 'flight_itinerary',
  'Hotel itinerary': 'hotel_itinerary',
};

export function addOnStringsToSelections(names: string[]): SelectedAddOn[] {
  return names
    .map((name) => LEGACY_NAME_TO_ID[name])
    .filter(Boolean)
    .map((id) => ({ addOnId: id, quantity: 1 }));
}

export function selectionsToDisplayNames(selections: SelectedAddOn[]): string[] {
  return selections.map((s) => {
    const addon = ADD_ON_CATALOGUE.find((a) => a.id === s.addOnId);
    return addon ? addon.name : s.addOnId;
  });
}

export function selectionsEqual(a: SelectedAddOn[], b: SelectedAddOn[]): boolean {
  if (a.length !== b.length) return false;
  const sort = (arr: SelectedAddOn[]) =>
    [...arr].sort((x, y) => x.addOnId.localeCompare(y.addOnId));
  const sa = sort(a);
  const sb = sort(b);
  return sa.every((item, i) => item.addOnId === sb[i].addOnId && item.quantity === sb[i].quantity);
}
