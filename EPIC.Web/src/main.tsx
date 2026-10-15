import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorshipAudioProvider } from './context/WorshipAudioContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorshipAudioProvider>
      <App />
    </WorshipAudioProvider>
  </StrictMode>,
)

