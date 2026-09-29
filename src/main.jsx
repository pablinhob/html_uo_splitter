import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { logger } from './Helpers/logger'
import './styles.css'

logger.info('Welcome to UlaOla Surfboard Splitter! Open an STL file to get started.')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
