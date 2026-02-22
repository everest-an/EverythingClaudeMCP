"use client";

import { useState } from "react";

export default function CopyBlock({
  code,
  children,
  className = "",
}: {
  code: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={`code-block relative group ${className}`}>
      <button
        type="button"
        onClick={copy}
        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-tertiary)] hover:text-[var(--foreground)] hover:border-[var(--accent)]"
      >
        {copied ? "Copied!" : "Copy"}
      </button>
      {children ?? (
        <pre className="text-[var(--text-secondary)] whitespace-pre-wrap text-[13px] p-4 select-text">
          {code}
        </pre>
      )}
    </div>
  );
}
