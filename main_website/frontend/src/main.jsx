import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './app/App.jsx'
import { PageErrorBoundary, PageLoader } from './components/PageLoader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <PageErrorBoundary>
      <Suspense fallback={<PageLoader fullScreen />}>
        <App/>
      </Suspense>
    </PageErrorBoundary>
  </StrictMode>,
)
