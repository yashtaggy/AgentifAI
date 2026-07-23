"use client";

import React, { useState, useEffect } from "react";

interface RequestCycle {
  method: "GET" | "POST" | "DELETE";
  path: string;
  status: string;
  statusCode: number;
  payload: string;
  response: string;
  statusType: "success" | "warn" | "critical";
}

const CYCLES: RequestCycle[] = [
  {
    method: "POST",
    path: "/orders",
    status: "200 OK",
    statusCode: 200,
    payload: '{ "item": "pet" }',
    response: '{ "id": 42, "status": "approved" }',
    statusType: "success"
  },
  {
    method: "GET",
    path: "/pet/999",
    status: "404 Not Found",
    statusCode: 404,
    payload: "params: { id: 999 }",
    response: '{ "error": "Item missing" }',
    statusType: "warn"
  },
  {
    method: "DELETE",
    path: "/user/admin",
    status: "500 Server Error",
    statusCode: 500,
    payload: "Header: Bearer xxx",
    response: '{ "critical": "DB lock" }',
    statusType: "critical"
  }
];

export function ApiMetaphorAnimation() {
  const [cycleIndex, setCycleIndex] = useState(0);
  const [step, setStep] = useState(0); // 0: Diner -> Waiter, 1: Waiter -> Kitchen, 2: Ticket Stamped, 3: Return to Diner
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = () => setReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      setStep((prevStep) => {
        if (prevStep >= 3) {
          setCycleIndex((prevCycle) => (prevCycle + 1) % CYCLES.length);
          return 0;
        }
        return prevStep + 1;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  const currentCycle = CYCLES[cycleIndex];

  const getStatusBadge = () => {
    if (currentCycle.statusType === "success") {
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400";
    }
    if (currentCycle.statusType === "warn") {
      return "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400";
    }
    return "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-400";
  };

  return (
    <div className="w-full max-w-lg mx-auto p-5 rounded-2xl glassmorphism border border-border shadow-theme relative overflow-hidden">
      {/* Top Header Label */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-muted uppercase tracking-wider font-bold">API Cycle</span>
        </div>
        <div className="text-muted">
          Cycle <span className="text-foreground font-bold">{cycleIndex + 1}/3</span>
        </div>
      </div>

      {/* Main Metaphor Diagram: Diner (Code) -> Waiter (API) -> Kitchen (Server) */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 relative">
        {/* Node 1: Diner (Client Code) */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          step === 0 || step === 3 ? "border-accent bg-surface-raised shadow-md" : "border-border bg-card/40 opacity-70"
        }`}>
          <div className="text-[22px] mb-1">🍽️</div>
          <div className="text-xs font-bold font-display">Client Code</div>
          <div className="text-[10px] text-muted font-mono mt-0.5">(The Diner)</div>
        </div>

        {/* Node 2: Waiter (The API) */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          step === 1 ? "border-accent bg-surface-raised shadow-md scale-105" : "border-border bg-card/40 opacity-70"
        }`}>
          <div className="text-[22px] mb-1">🤵</div>
          <div className="text-xs font-bold font-display">API Layer</div>
          <div className="text-[10px] text-muted font-mono mt-0.5">(The Waiter)</div>
        </div>

        {/* Node 3: Kitchen (The Server) */}
        <div className={`p-3 rounded-xl border transition-all duration-300 ${
          step === 2 ? "border-accent bg-surface-raised shadow-md" : "border-border bg-card/40 opacity-70"
        }`}>
          <div className="text-[22px] mb-1">👨‍🍳</div>
          <div className="text-xs font-bold font-display">Server</div>
          <div className="text-[10px] text-muted font-mono mt-0.5">(The Kitchen)</div>
        </div>
      </div>

      {/* Moving Ticket Indicator */}
      <div className="mt-4 p-3 rounded-xl bg-surface-raised border border-border transition-all duration-500">
        <div className="flex items-center justify-between text-xs font-mono mb-1">
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-accent/10 text-accent border border-accent/20">
            {currentCycle.method} {currentCycle.path}
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge()}`}>
            {step >= 2 ? currentCycle.status : "In Transit..."}
          </span>
        </div>

        <div className="text-[11px] font-mono text-muted truncate mt-1.5">
          {step < 2 ? `Request Order: ${currentCycle.payload}` : `Ticket Response: ${currentCycle.response}`}
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-border h-1.5 rounded-full mt-3 overflow-hidden">
          <div
            className="bg-accent h-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / 4) * 100}%` }}
          />
        </div>
      </div>

      {/* Caption note */}
      <div className="mt-3 text-[10px] text-center text-muted font-mono">
        {reducedMotion ? "Animation paused (Reduced Motion)" : "Live API Request / Response Metaphor"}
      </div>
    </div>
  );
}
