// Main App component
import { MainInterface } from '@/components/MainInterface';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <MainInterface />
      </div>
    </ErrorBoundary>
  );
}

export default App;
