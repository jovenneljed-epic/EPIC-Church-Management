import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WorshipAudioProvider } from './context/WorshipAudioContext'
import { GlobalWorshipSoundBar } from './components/GlobalWorshipSoundBar'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WorshipAudioProvider>
      <App />
      <GlobalWorshipSoundBar />
    </WorshipAudioProvider>
  </StrictMode>,
)

