import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompletedProvider } from './components/CompletedContext';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './components/Home';
import Report from './components/Report';
import ScenarioPage from './components/ScenarioPage';
import './App.css';

export default function App() {
  return (
    <ErrorBoundary>
      <CompletedProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<Report />} />
            <Route path="/scenario/:id" element={<ScenarioPage />} />
          </Routes>
        </BrowserRouter>
      </CompletedProvider>
    </ErrorBoundary>
  );
}
