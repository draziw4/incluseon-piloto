import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom"
import { lazy, Suspense } from "react"

import "./index.css"
import { ProtectedRoute } from "./routes/protected-route"
import { DashboardLayout } from "./layouts/dashboard-layout"
import { isPilotMode } from "./config/pilot"

const LoginPage = lazy(() => import("./pages/login-page").then((module) => ({ default: module.LoginPage })))
const RegisterPage = lazy(() => import("./pages/register-page").then((module) => ({ default: module.RegisterPage })))
const legalPages = import("./pages/legal-pages")
const PrivacyPage = lazy(() => legalPages.then((module) => ({ default: module.PrivacyPage })))
const TermsPage = lazy(() => legalPages.then((module) => ({ default: module.TermsPage })))
const DashboardPage = lazy(() => import("./pages/dashboard-page").then((module) => ({ default: module.DashboardPage })))
const StudentsPage = lazy(() => import("./features/students/pages/students-page").then((module) => ({ default: module.StudentsPage })))
const StudentProfilePage = lazy(() => import("./features/students/pages/student-profile-page").then((module) => ({ default: module.StudentProfilePage })))
const AppointmentsPage = lazy(() => import("./features/appointments/pages/appointments-page").then((module) => ({ default: module.AppointmentsPage })))
const SettingsPage = lazy(() => import("./pages/settings-page").then((module) => ({ default: module.SettingsPage })))
const PasswordResetPage = lazy(() => import("./pages/password-reset-page").then((module) => ({ default: module.PasswordResetPage })))
const modulePages = import("./pages/module-pages")
const BehaviorRecordsPage = lazy(() => modulePages.then((module) => ({ default: module.BehaviorRecordsPage })))
const AssessmentsPage = lazy(() => modulePages.then((module) => ({ default: module.AssessmentsPage })))
const InterviewsPage = lazy(() => modulePages.then((module) => ({ default: module.InterviewsPage })))
const GoalsPage = lazy(() => modulePages.then((module) => ({ default: module.GoalsPage })))
const CaseStudiesPage = lazy(() => modulePages.then((module) => ({ default: module.CaseStudiesPage })))
const ReportsPage = lazy(() => modulePages.then((module) => ({ default: module.ReportsPage })))
const AnalyticsPage = lazy(() => modulePages.then((module) => ({ default: module.AnalyticsPage })))
const PilotFeedbackPage = lazy(() => import("./features/pilot-feedback/pages/pilot-feedback-page").then((module) => ({ default: module.PilotFeedbackPage })))

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-6 text-sm text-slate-500">Carregando...</div>}>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/forgot-password" element={<PasswordResetPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="students/:id" element={<StudentProfilePage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="behavior-records" element={<BehaviorRecordsPage />} />
          <Route path="assessments" element={<AssessmentsPage />} />
          <Route path="interviews" element={<InterviewsPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="case-studies" element={<CaseStudiesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="pilot-feedback" element={isPilotMode ? <PilotFeedbackPage /> : <Navigate to="/" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
