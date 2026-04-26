import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/useAuth'
import { AppLayout } from '@/components/layout/AppLayout'

// Auth pages
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'

// Mechanic pages
import { MechanicPartsPage } from '@/pages/mechanic/MechanicPartsPage'
import { MechanicOrdersPage } from '@/pages/mechanic/MechanicOrdersPage'
import { MechanicCustomersPage } from '@/pages/mechanic/MechanicCustomersPage'
import { MechanicQuotesPage } from '@/pages/mechanic/MechanicQuotesPage'
import { MechanicCartPage } from '@/pages/mechanic/MechanicCartPage'
import { MechanicMetricsPage } from '@/pages/mechanic/MechanicMetricsPage'
import { MechanicAppointmentsPage } from '@/pages/mechanic/MechanicAppointmentsPage'
import { MechanicFinancesPage } from '@/pages/mechanic/MechanicFinancesPage'

// Store pages
import { StoreOrdersPage } from '@/pages/store/StoreOrdersPage'
import { StorePartsPage } from '@/pages/store/StorePartsPage'
import { StoreMetricsPage } from '@/pages/store/StoreMetricsPage'
import { StoreDeliverersPage } from '@/pages/store/StoreDeliverersPage'
import { StoreSearchHistoryPage } from '@/pages/store/StoreSearchHistoryPage'

// Delivery pages
import { DeliveryPage } from '@/pages/delivery/DeliveryPage'

// Shared
import { SettingsPage } from '@/pages/SettingsPage'

function AppRoutes() {
  const { user, role, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  const defaultPath = role === 'mechanic' ? '/mechanic' : role === 'store' ? '/store' : '/delivery'

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Mechanic routes */}
        <Route path="/mechanic" element={<MechanicPartsPage />} />
        <Route path="/mechanic/orders" element={<MechanicOrdersPage />} />
        <Route path="/mechanic/cart" element={<MechanicCartPage />} />
        <Route path="/mechanic/customers" element={<MechanicCustomersPage />} />
        <Route path="/mechanic/quotes" element={<MechanicQuotesPage />} />
        <Route path="/mechanic/metrics" element={<MechanicMetricsPage />} />
        {/* Stub pages for mechanic */}
        <Route path="/mechanic/appointments" element={<MechanicAppointmentsPage />} />
        <Route path="/mechanic/finances" element={<MechanicFinancesPage />} />

        {/* Store routes */}
        <Route path="/store" element={<StoreOrdersPage />} />
        <Route path="/store/parts" element={<StorePartsPage />} />
        <Route path="/store/metrics" element={<StoreMetricsPage />} />
        <Route path="/store/deliverers" element={<StoreDeliverersPage />} />
        <Route path="/store/search-history" element={<StoreSearchHistoryPage />} />

        {/* Delivery routes */}
        <Route path="/delivery" element={<DeliveryPage />} />

        {/* Shared */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to={defaultPath} replace />} />
        <Route path="*" element={<Navigate to={defaultPath} replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
