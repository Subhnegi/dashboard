import { RouterProvider } from 'react-router-dom';
import { router } from './app/router';
import { DemoDataProvider } from './context/DemoDataContext';

export function App() {
  return (
    <DemoDataProvider>
      <RouterProvider router={router} />
    </DemoDataProvider>
  );
}

export default App;
