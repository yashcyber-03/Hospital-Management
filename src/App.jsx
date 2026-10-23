import { Routes, Route } from 'react-router-dom'
import { isSupabaseConfigured } from './services/supabase'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import SetupNotice from './components/SetupNotice'
import DashboardLayout from './layouts/DashboardLayout'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Overview from './pages/Overview'
import Doctors from './pages/Doctors'
import Appointments from './pages/Appointments'
import Records from './pages/Records'
import Invoices from './pages/Invoices'
import Analytics from './pages/Analytics'
import AdminDoctors from './pages/AdminDoctors'
import ReceptionDesk from './pages/ReceptionDesk'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import DoctorHours from './pages/DoctorHours'
import AuditLog from './pages/AuditLog'
import { ForgotPassword, ResetPassword } from './pages/ForgotPassword'
import Billing from './pages/Billing'
import NotFound from './pages/NotFound'
import ChatWidget from './components/ChatWidget'

export default function App() {
  return (
    <AuthProvider>
      {!isSupabaseConfigured && <SetupNotice />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/register" element={<Auth mode="register" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<Overview />} />
          <Route path="doctors" element={<Doctors />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="records" element={<Records />} />
          <Route path="billing" element={<Invoices />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="manage-doctors" element={<AdminDoctors />} />
          <Route path="reception" element={<ReceptionDesk />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route path="hours" element={<DoctorHours />} />
          <Route path="audit" element={<AuditLog />} />
          <Route path="billing" element={<Billing />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ChatWidget />
    </AuthProvider>
  )
}
