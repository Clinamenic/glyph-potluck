import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './styles/index.css'

// Development logging
if (import.meta.env.DEV) {
  console.log('🎨 Glyph Potluck - Development Mode')
  console.log(`Version: ${__APP_VERSION__}`)
  console.log(`Build Time: ${__BUILD_TIME__}`)
}

// Auto-hide scrollbar functionality
let scrollTimeout: number | null = null;

const handleScroll = () => {
  const body = document.body;
  
  // Add scrolling class
  body.classList.add('scrolling');
  
  // Clear existing timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
  
  // Remove scrolling class after scroll ends
  scrollTimeout = window.setTimeout(() => {
    body.classList.remove('scrolling');
  }, 150);
};

// Add scroll event listener
document.addEventListener('scroll', handleScroll, { passive: true });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
