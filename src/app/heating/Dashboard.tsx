"use client";
import { useEffect } from "react";
import { MARKUP } from "./markup";
import "./heating.css";

// The dashboard's own script renders into the ids in MARKUP. It is loaded fresh on every
// mount so client-side navigation back to this page re-initialises it.
export default function Dashboard() {
  useEffect(() => {
    const el = document.createElement("script");
    // served by the camera server (see the /heating rewrite in next.config.ts): one copy of the script
    el.src = "/heating/dashboard.js?v=" + Date.now();
    document.body.appendChild(el);
    return () => { el.remove(); if (window.__heatTimer) clearInterval(window.__heatTimer); };
  }, []);
  return <div className="heatingDash" dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
declare global { interface Window { __heatTimer?: number; __heatResize?: () => void; } }
