import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import './components/LockScreen.css'
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
        <div className="lock-card loading-card">
          <img src="/artist-logo.png" className="lock-logo" alt="ARTIST" width={72} height={72} />
          <div className="loading-dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="lock-prompt">טוען את המערכת...</p>
        </div>
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
