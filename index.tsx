
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix: Add a global type definition for the 'ion-icon' custom element to resolve JSX intrinsic element errors across the application.
// Moved from types.ts to ensure it's loaded globally.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'ion-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          name?: string;
        },
        HTMLElement
      >;
    }
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
