import React from 'react';
import ReactDOM from 'react-dom/client';
import { ensureI18n } from '@sdkwork/notes-i18n';
import App from './App';

async function mountApp() {
  await ensureI18n();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void mountApp();
