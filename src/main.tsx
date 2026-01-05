import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Suppress browser extension errors that don't affect the application
window.addEventListener('error', (event) => {
  // Filter out browser extension errors
  if (
    event.message?.includes('Could not establish connection') ||
    event.message?.includes('Receiving end does not exist') ||
    event.filename?.includes('polyfill.js') ||
    event.filename?.includes('extension://') ||
    event.filename?.includes('chrome-extension://')
  ) {
    event.preventDefault()
    return false
  }
})

// Suppress unhandled promise rejections from browser extensions
window.addEventListener('unhandledrejection', (event) => {
  const errorMessage = event.reason?.message || event.reason?.toString() || ''
  if (
    errorMessage.includes('Could not establish connection') ||
    errorMessage.includes('Receiving end does not exist') ||
    errorMessage.includes('Extension context invalidated')
  ) {
    event.preventDefault()
    return false
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

