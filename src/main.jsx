import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/auth.css";
import "./styles/primitives.css";
import "./styles/layout.css";
import "./styles/dashboard.css";
import "./styles/transactions.css";
import "./styles/budgets.css";
import "./styles/goals.css";
import "./styles/reports.css";
import "./styles/shared.css";
import "./styles/settings.css";
import "./styles/modal.css";
import "./styles/responsive.css";
import "./styles/visual-refresh.css";

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
