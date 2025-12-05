import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import './index.css';

import App from './App.jsx';
import './i18n';

import { AppWrapper } from "./components/common/PageMeta.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from './components/ui/toast/ToastProvider';

import { Provider } from 'react-redux';
import { store } from "./redux/store";

// SocketProvider is mounted inside `App.jsx`; avoid double-mounting here.
import { setStore } from './utils/socketRedux.js';

// Attach Redux store to socket service
setStore(store);

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <Provider store={store}>
    <ThemeProvider>
      <AppWrapper>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AppWrapper>
    </ThemeProvider>
  </Provider>
  // </StrictMode>
);
