import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n'

// Set initial direction based on stored language
const storedLanguage = localStorage.getItem('i18nextLng') || 'fr';
document.documentElement.dir = storedLanguage === 'ar' ? 'rtl' : 'ltr';
document.documentElement.lang = storedLanguage;

createRoot(document.getElementById("root")!).render(<App />);
