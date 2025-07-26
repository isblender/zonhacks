import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ChakraProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ChakraProvider>
    </ThemeProvider>
  </StrictMode>,
)
