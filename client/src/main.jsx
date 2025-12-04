import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import './index.css'
import App from './App.jsx'
import './i18n';
import { AppWrapper } from "./components/common/PageMeta.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { ToastProvider } from './components/ui/toast/ToastProvider';
import { Provider } from 'react-redux';
import { store } from "./redux/store";
import SocketInitializer from './components/socket/SocketInitializer';
createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ThemeProvider>
    <AppWrapper>
      <Provider store={store}>
        <ToastProvider>
          <App />
          <SocketInitializer />
        </ToastProvider>
      </Provider>
    </AppWrapper>
  </ThemeProvider>
  // </StrictMode>,
);
