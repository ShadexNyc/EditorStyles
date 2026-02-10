import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import { ReviewProvider } from './services/review/ReviewContext'
import './theme/theme.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReviewProvider>
      <App />
    </ReviewProvider>
  </React.StrictMode>,
)
