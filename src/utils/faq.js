import { HOSPITAL_INFO as H } from '../data/hospitalInfo'

const FAQ = [
  { k: ['book', 'appointment', 'schedule', 'how to', 'procedure', 'process'], a: `To book: ${H.appointmentProcess.join(' ')}` },
  { k: ['cancel', 'reschedule', 'change appointment'], a: 'Open "Appointments" after logging in and use the Cancel option on a booked appointment.' },
  { k: ['opd', 'timing', 'hours', 'open', 'time'], a: `${H.opdHours}. ${H.emergency}` },
  { k: ['visit', 'visiting'], a: H.visitingHours },
  { k: ['emergency', 'ambulance', 'urgent'], a: `${H.emergency} For a medical emergency please go to the emergency department or call your local emergency number immediately.` },
  { k: ['department', 'specialty', 'speciality', 'specialization'], a: `Our departments: ${H.departments.map((d) => `${d.name} (${d.about})`).join('; ')}.` },
  { k: ['service', 'facility', 'lab', 'pharmacy'], a: `Services: ${H.services.join('; ')}.` },
  { k: ['doctor', 'fee', 'availability', 'available', 'slot'], a: H.doctorAvailability },
  { k: ['bill', 'invoice', 'payment', 'pay'], a: 'Invoices and payment status are under "Billing" after you log in. Payments are recorded by hospital staff at the desk.' },
  { k: ['prescription', 'record', 'report'], a: 'Your doctor\'s notes and prescriptions appear under "Records" after you log in. Only you and your treating doctor can see them.' },
  { k: ['register', 'sign up', 'account', 'login', 'log in'], a: 'Click Register on the home page to create a patient account, then log in to book appointments.' },
]

export const SUGGESTIONS = ['How do I book an appointment?', 'What are the OPD timings?', 'Which departments do you have?', 'What are the visiting hours?']
export const FALLBACK = 'I don\'t have that information. Please contact the hospital reception. I can\'t give medical advice, so for health concerns please consult a doctor. In an emergency, go to the emergency department right away.'
export const MEDICAL_NOTICE = 'I can\'t give medical diagnoses or advise on medicines. Please book an appointment with a doctor, or go to the emergency department if it is urgent.'

const MEDICAL = ['diagnose', 'diagnosis', 'symptom', 'what medicine', 'which medicine', 'dose', 'dosage', 'treatment for', 'do i have']

export function faqAnswer(question) {
  const q = question.toLowerCase()
  if (MEDICAL.some((w) => q.includes(w))) return MEDICAL_NOTICE
  let best = null, score = 0
  for (const item of FAQ) {
    const s = item.k.filter((w) => q.includes(w)).length
    if (s > score) { score = s; best = item }
  }
  return best ? best.a : FALLBACK
}
