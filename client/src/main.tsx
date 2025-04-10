import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Initialize dark mode from preferences
const userPreference = localStorage.getItem('darkMode');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (userPreference === 'dark' || (!userPreference && prefersDark)) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
