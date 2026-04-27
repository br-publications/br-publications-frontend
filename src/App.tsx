import { useEffect } from 'react'
import './App.css'
import AppRoutes from './routes/appRoutes'


function App() {
  
  useEffect(() => {
    // Phase 3 Hardening: Security sweep for orphaned localStorage objects preventing token theft
    if (localStorage.getItem('user')) localStorage.removeItem('user');
    if (localStorage.getItem('authToken')) localStorage.removeItem('authToken');
  }, []);

  return (
    <>

      <AppRoutes />
    </>
  )
}

export default App
