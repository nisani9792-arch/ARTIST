import { motion } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './components/LockScreen.css'
import { JusicLogo } from './components/JusicLogo'
import { LockScreen } from './components/LockScreen'
import { OperatorRegistration } from './components/OperatorRegistration'
import { useAccessGate } from './hooks/useAccessGate'
import { ArtistsPage } from './pages/ArtistsPage'
import { ArtistDetailPage } from './pages/ArtistDetailPage'
import { CrmLayout } from './pages/CrmLayout'
import { DashboardPage } from './pages/DashboardPage'

function App() {
  const { phase, operatorName, error: operatorError, unlock, register: registerOperator } =
    useAccessGate()

  if (phase === 'loading') {
    return (
      <div className="lock-screen" aria-busy="true" aria-label="טוען">
        <motion.div
          className="lock-card loading-card"
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        >
          <div className="lock-logo-wrap">
            <JusicLogo size={80} variant="mark" />
          </div>
          <div className="loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="lock-prompt">טוען את JUSIC...</p>
        </motion.div>
      </div>
    )
  }

  if (phase === 'locked') {
    return <LockScreen onUnlock={unlock} />
  }

  if (phase === 'register') {
    return (
      <OperatorRegistration
        onRegister={registerOperator}
        error={operatorError || undefined}
        defaultName={operatorName ?? undefined}
      />
    )
  }

  if (!operatorName) {
    return null
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<CrmLayout operatorName={operatorName} />}>
          <Route index element={<DashboardPage operatorName={operatorName} />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artists/:id" element={<ArtistDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
