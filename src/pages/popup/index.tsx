import React from "react";
import { createRoot } from "react-dom/client";

import { PopupPage } from "./popup-page";
import './index.css';
import './styles.scss';

createRoot(document.querySelector("#__root")!).render(
  <>
    <PopupPage />
  </>
);
