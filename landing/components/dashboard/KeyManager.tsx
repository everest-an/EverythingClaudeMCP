"use client";

import { useState } from "react";

interface ApiKeyInfo {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  _count: { usageLogs: number };
}

export default function KeyManager({
  initialKeys,
}: {
  initialKeys: ApiKeyInfo[];
}) {
  const [keys, setKeys] = useState(initialKeys);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function createKey() {
    const name = keyName.trim() || "Default Key";
    setCreating(true);
    try {
      const res = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewKey(data.key);
        setCopied(false);
        setKeyName("");
        const listRes = await fetch("/api/keys");
        const listData = await listRes.json();
        setKeys(listData.keys);
      }
    } finally {
      setCreating(false);
    }
  }

  async function renameKey(id: string) {
    const name = editName.trim();
    if (!name) return;
    const res = await fetch(`/api/keys/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setKeys((prev) =>
        prev.map((k) => (k.id === id ? { ...k, name } : k)),
      );
    }
    setEditingId(null);
  }

  async function revokeKey(id: string) {
    await fetch(`/api/keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const activeKeys = keys.filter((k) => k.isActive);
  const revokedKeys = keys.filter((k) => !k.isActive);

  return (
    <div>
      {/* Create key with project name */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
          placeholder="Project name (e.g. my-saas-app)"
          className="flex-1 px-4 py-3 rounded-xl glass text-[14px] bg-transparent border border-[var(--glass-border)] focus:border-[var(--accent)] focus:outline-none placeholder:text-[var(--text-tertiary)] transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !creating && activeKeys.length < 5)
              createKey();
          }}
        />
        <button
          type="button"
          onClick={createKey}
          disabled={creating || activeKeys.length >= 5}
          className="btn-glow px-6 py-3 rounded-xl bg-[var(--accent)] text-white text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {creating ? "Creating..." : "Create Key"}
        </button>
      </div>

      {activeKeys.length >= 5 && (
        <p className="text-[12px] text-[var(--text-tertiary)] mb-6">
          Maximum 5 active keys. Revoke an existing key to create a new one.
        </p>
      )}

      {/* Newly created key (show once) */}
      {newKey && (
        <div className="glass-card rounded-xl p-4 mb-6 border-[var(--accent)]">
          <p className="text-[13px] text-[var(--accent)] font-medium mb-2">
            Copy your API key now — it won&apos;t be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-[13px] bg-[var(--code-bg)] rounded-lg px-3 py-2 font-mono break-all">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(newKey)}
              className="px-3 py-2 rounded-lg glass text-[13px] shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* Active keys */}
      {activeKeys.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Active Keys
          </h3>
          {activeKeys.map((key) => (
            <div
              key={key.id}
              className="glass-card rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Editable name */}
                  {editingId === key.id ? (
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameKey(key.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        aria-label="Key name"
                        placeholder="Key name"
                        className="text-[14px] font-medium bg-transparent border-b border-[var(--accent)] focus:outline-none px-0 py-0.5"
                      />
                      <button
                        type="button"
                        onClick={() => renameKey(key.id)}
                        className="text-[12px] text-[var(--accent)]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[12px] text-[var(--text-tertiary)]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(key.id);
                        setEditName(key.name);
                      }}
                      className="text-[14px] font-medium hover:text-[var(--accent)] transition-colors text-left"
                      title="Click to rename"
                    >
                      {key.name}
                    </button>
                  )}

                  <code className="text-[13px] font-mono text-[var(--text-tertiary)] block mt-0.5">
                    {key.keyPrefix}...
                  </code>
                  <div className="text-[12px] text-[var(--text-tertiary)] mt-1.5">
                    {key._count.usageLogs} calls
                    {key.lastUsedAt &&
                      ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    {" · Created "}
                    {new Date(key.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeKey(key.id)}
                  className="text-[13px] text-red-400 hover:text-red-300 transition-colors shrink-0 ml-4"
                >
                  Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="space-y-3 mb-8">
          <h3 className="text-[12px] font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
            Revoked Keys
          </h3>
          {revokedKeys.map((key) => (
            <div
              key={key.id}
              className="glass rounded-xl p-4 opacity-50"
            >
              <div className="text-[13px] text-[var(--text-tertiary)]">
                {key.name}
              </div>
              <code className="text-[12px] font-mono text-[var(--text-tertiary)]">
                {key.keyPrefix}...
              </code>
              <span className="ml-2 text-[11px] text-red-400">revoked</span>
            </div>
          ))}
        </div>
      )}

      {/* Usage instructions */}
      <div className="glass-card rounded-xl p-5 mt-8">
        <h3 className="text-[14px] font-semibold mb-3">
          How to use your API key
        </h3>
        <p className="text-[13px] text-[var(--text-secondary)] mb-3">
          Add the following to your Claude Code settings:
        </p>
        <div className="code-block p-4">
          <pre className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap">
            {`// .claude/settings.json
{
  "mcpServers": {
    "awesome-context": {
      "url": "https://mcp.awesomecontext.dev/mcp",
      "headers": {
        "Authorization": "Bearer ac_your_key_here"
      }
    }
  }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
