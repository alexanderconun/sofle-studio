import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { Overlay } from "./keyboard/Overlay.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {location.search.includes("overlay") ? <Overlay /> : <App />}
  </React.StrictMode>
);
