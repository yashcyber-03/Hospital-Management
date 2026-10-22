// APPROVED hospital information: the only source of truth for the chatbot.
// SAMPLE DATA for demonstration. Edit these values to match your hospital.
export const HOSPITAL_INFO = {
  name: 'MediCare Hospital',
  opdHours: 'Outpatient (OPD): Monday to Saturday, 9:00 AM to 5:00 PM',
  emergency: 'Emergency services are open 24 hours, 7 days a week.',
  visitingHours: 'General ward visiting hours: 4:00 PM to 6:00 PM daily (sample). Please ask the ward desk for ICU rules.',
  departments: [
    { name: 'Cardiology', about: 'Heart and blood vessel care' },
    { name: 'Orthopedics', about: 'Bones, joints and muscles' },
    { name: 'Pediatrics', about: 'Health care for children' },
    { name: 'Neurology', about: 'Brain and nervous system' },
    { name: 'Dermatology', about: 'Skin, hair and nails' },
    { name: 'General Medicine', about: 'Primary care and general check-ups' },
  ],
  services: ['Outpatient consultations', 'Diagnostic laboratory (sample)', 'Pharmacy (sample)', 'Online appointment booking', 'Online invoices and prescriptions'],
  appointmentProcess: [
    'Register or log in on this website.',
    'Open "Find doctors" and search by name, department or specialization.',
    'Choose a doctor, pick a date and a free time slot, and confirm.',
    'You can view or cancel your booking under "Appointments".',
    'Visit the hospital at the booked time. Your invoice appears under "Billing".',
  ],
  doctorAvailability: 'Doctor availability and fees are shown live on the "Find doctors" page after you log in. The assistant cannot see schedules.',
}
