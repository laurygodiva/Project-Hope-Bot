import { IdentityProvider } from './context/IdentityContext.jsx';
import IdentityGate from './components/IdentityGate.jsx';
import HomePage from './pages/HomePage.jsx';
import './App.css';

export default function App() {
  return (
    <IdentityProvider>
      <IdentityGate>
        <HomePage />
      </IdentityGate>
    </IdentityProvider>
  );
}
