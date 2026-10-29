// Punto de entrada de la app
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ContextoProvider } from './context/ContextoProvider'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Todas las pantallas pueden leer el clima */}
      <ContextoProvider>
        <App />
      </ContextoProvider>
    </BrowserRouter>
  </StrictMode>,
)