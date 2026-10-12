import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// No StrictMode: the animation effects are written for a single mount.
createRoot(document.getElementById('root')).render(<App />);
