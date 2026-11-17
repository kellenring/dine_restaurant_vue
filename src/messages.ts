// UI 文案：一字不差照規格書 Rules「違反時 UI 文案（英文）」欄，測試斷言也以此為準
export const MSG = {
  REQUIRED: 'This field is required', // BR-01
  INVALID_PHONE: 'Please enter a valid phone number', // BR-02
  OUT_OF_RANGE_DATE: 'Please pick a date within the next 30 days', // BR-04
  DUPLICATE: 'You already have a reservation for this time', // BR-07
  slotFull: (n: number) => `Only ${n} seats left for this time`, // BR-06
  slotLeft: (n: number) => `${n} left`, // BR-12
  FULL: 'Full', // BR-12
  PICK_DATE: 'Pick a date',
  CONFIRMED: 'Reservation confirmed',
  GENERIC: 'Something went wrong, please try again',
} as const;
