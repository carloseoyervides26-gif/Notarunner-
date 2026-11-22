// Punto de entrada de la app
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import AuthProvider from './context/AuthProvider'
import { ContextoProvider } from './context/ContextoProvider'
import CarreraProvider from './context/CarreraProvider'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      {/* Sesión del usuario (Supabase) */}
      <AuthProvider>
        {/* Todas las pantallas pueden leer el clima */}
        <ContextoProvider>
          {/* La carrera (GPS, tiempo, distancia) sobrevive al cambiar de pestaña */}
          <CarreraProvider>
            <App />
          </CarreraProvider>
        </ContextoProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
