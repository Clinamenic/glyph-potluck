import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Development logging
if (import.meta.env.DEV) {
  console.log('🎨 Glyph Potluck - Development Mode')
  console.log(`Version: ${__APP_VERSION__}`)
  console.log(`Build Time: ${__BUILD_TIME__}`)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
