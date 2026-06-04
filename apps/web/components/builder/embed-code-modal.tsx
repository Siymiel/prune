"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { cn } from "@/lib/utils";

type SyntaxToken = { text: string; color: string };

const JS_KEYWORDS = new Set(["import", "from", "export", "default", "function", "return", "const", "let", "var", "async"]);

function tokenizeHTMLLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === "<") {
      let p = "<"; i++;
      if (i < line.length && line[i] === "/") { p += "/"; i++; }
      tokens.push({ text: p, color: "#808080" });
      let name = "";
      while (i < line.length && /[a-zA-Z0-9-]/.test(line[i])) name += line[i++];
      if (name) tokens.push({ text: name, color: "#4ec9b0" });
      continue;
    }
    if (line[i] === ">") { tokens.push({ text: ">", color: "#808080" }); i++; continue; }
    if (line[i] === '"') {
      let s = '"'; i++;
      while (i < line.length && line[i] !== '"') s += line[i++];
      if (i < line.length) { s += '"'; i++; }
      tokens.push({ text: s, color: "#ce9178" }); continue;
    }
    if (line[i] === "=") { tokens.push({ text: "=", color: "#d4d4d4" }); i++; continue; }
    if (/[a-zA-Z]/.test(line[i])) {
      let w = "";
      while (i < line.length && /[a-zA-Z0-9-_]/.test(line[i])) w += line[i++];
      tokens.push({ text: w, color: "#9cdcfe" }); continue;
    }
    tokens.push({ text: line[i], color: "#d4d4d4" }); i++;
  }
  return tokens;
}

function tokenizeJSLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  let inJSX = false;
  while (i < line.length) {
    if (line[i] === " " || line[i] === "\t") {
      let sp = "";
      while (i < line.length && (line[i] === " " || line[i] === "\t")) sp += line[i++];
      tokens.push({ text: sp, color: "#d4d4d4" }); continue;
    }
    if (inJSX && line[i] === "/" && i + 1 < line.length && line[i + 1] === ">") {
      tokens.push({ text: "/>", color: "#808080" }); inJSX = false; i += 2; continue;
    }
    if (inJSX && line[i] === ">") { tokens.push({ text: ">", color: "#808080" }); inJSX = false; i++; continue; }
    if (inJSX && line[i] === "=") { tokens.push({ text: "=", color: "#d4d4d4" }); i++; continue; }
    if (line[i] === "<" && i + 1 < line.length && /[a-zA-Z/]/.test(line[i + 1])) {
      let p = "<"; i++;
      if (line[i] === "/") { p += "/"; i++; }
      tokens.push({ text: p, color: "#808080" });
      let name = "";
      while (i < line.length && /[a-zA-Z0-9]/.test(line[i])) name += line[i++];
      if (name) tokens.push({ text: name, color: "#4ec9b0" });
      inJSX = true; continue;
    }
    if (line[i] === "'" || line[i] === '"') {
      const q = line[i]; let s = q; i++;
      while (i < line.length && line[i] !== q) s += line[i++];
      if (i < line.length) { s += q; i++; }
      tokens.push({ text: s, color: "#ce9178" }); continue;
    }
    if (inJSX && /[a-zA-Z]/.test(line[i])) {
      let w = "";
      while (i < line.length && /[a-zA-Z0-9-_]/.test(line[i])) w += line[i++];
      tokens.push({ text: w, color: "#9cdcfe" }); continue;
    }
    if (/[a-zA-Z_$]/.test(line[i])) {
      let w = "";
      while (i < line.length && /[a-zA-Z0-9_$]/.test(line[i])) w += line[i++];
      if (JS_KEYWORDS.has(w)) tokens.push({ text: w, color: "#569cd6" });
      else if (/^[A-Z]/.test(w)) tokens.push({ text: w, color: "#4ec9b0" });
      else tokens.push({ text: w, color: "#dcdcaa" });
      continue;
    }
    tokens.push({ text: line[i], color: "#808080" }); i++;
  }
  return tokens;
}

export function EmbedCodeModal({ onClose, workflowId }: { onClose: () => void; workflowId?: string | null }) {
  const [mode, setMode] = useState<"html" | "react">("html");
  const [copied, setCopied] = useState(false);

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const chatSrc = workflowId ? `${APP_URL}/chat/${workflowId}` : `${APP_URL}/chat/YOUR_WORKFLOW_ID`;

  const htmlCode = `<!-- PruneAI Chat Widget -->
<script>
(function() {
  var open = false;
  var iframe = document.createElement('iframe');
  iframe.src = '${chatSrc}';
  iframe.style.cssText = 'display:none;position:fixed;bottom:90px;right:20px;width:380px;height:600px;border:none;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);z-index:9999';
  document.body.appendChild(iframe);
  var btn = document.createElement('button');
  btn.style.cssText = 'position:fixed;bottom:20px;right:20px;width:56px;height:56px;border-radius:50%;background:#7c3aed;border:none;cursor:pointer;z-index:9999;box-shadow:0 4px 16px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center';
  btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  btn.onclick = function() {
    open = !open;
    iframe.style.display = open ? 'block' : 'none';
  };
  document.body.appendChild(btn);
})();
</script>`;

  const reactCode = `import { useState } from 'react';

export function PruneAIWidget() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 20, right: 20,
          width: 56, height: 56, borderRadius: '50%',
          background: '#7c3aed', border: 'none',
          cursor: 'pointer', zIndex: 9999,
          boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
        }}
      >
        💬
      </button>
      {open && (
        <iframe
          src="${chatSrc}"
          style={{
            position: 'fixed', bottom: 90, right: 20,
            width: 380, height: 600,
            border: 'none', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            zIndex: 9999,
          }}
        />
      )}
    </>
  );
}`;

  const code = mode === "html" ? htmlCode : reactCode;
  const lines = code.split("\n");

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h3 className="text-lg font-semibold text-foreground">Code Export</h3>
          <button
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {/* HTML / React toggle */}
          <div className="flex justify-end">
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setMode("html")}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  mode === "html"
                    ? "bg-white shadow-sm font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                HTML
              </button>
              <button
                onClick={() => setMode("react")}
                className={cn(
                  "px-3 py-1 text-sm rounded-md transition-colors",
                  mode === "react"
                    ? "bg-white shadow-sm font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                React
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            Insert this code snippet just before the closing{" "}
            <code className="font-mono font-medium bg-gray-100 px-1 rounded text-blue-500">{"</body>"}</code>{" "}
            tag where you want the chatbot to be displayed. Make sure to{" "}
            <strong className="text-foreground font-semibold">Publish</strong> your flow before
            embedding it.
          </p>

          {/* Code block — editor style */}
          <div className="rounded-xl overflow-hidden border border-[#2a2a2a]">
            {/* Editor title bar with traffic lights */}
            <div className="flex items-center gap-3 px-4 py-2.5 bg-[#2d2d2d]">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <div className="h-3 w-3 rounded-full bg-[#28c840]" />
              </div>
              <span className="flex-1 text-center text-[11px] text-gray-500 font-mono">
                {mode === "html" ? "embed.html" : "embed.jsx"}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            {/* Code area */}
            <div className="bg-[#1e1e1e] overflow-x-auto py-1">
              <table className="text-[13px] font-mono border-separate border-spacing-0 w-full">
                <tbody>
                  {lines.map((line, i) => (
                    <tr key={i} className="group">
                      <td className="select-none w-12 pl-4 pr-4 text-right align-top leading-6 text-[#4a4a4a] group-hover:text-[#6a6a6a] border-r border-[#2a2a2a]">
                        {i + 1}
                      </td>
                      <td className="pl-5 pr-6 whitespace-pre leading-6 group-hover:bg-white/[0.03]">
                        {(mode === "html" ? tokenizeHTMLLine(line) : tokenizeJSLine(line)).map((tok, j) => (
                          <span key={j} style={{ color: tok.color }}>{tok.text || " "}</span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            This code can be used to embed your chatbot in Wix, Squarespace, Framer, Webflow,
            Wordpress, and similar platforms. If you have issues setting this up, reach out to{" "}
            <a
              href="mailto:support@pruneai.com"
              className="text-blue-500 hover:underline"
            >
              support@pruneai.com
            </a>{" "}
            and we will gladly help you.
          </p>
        </div>
      </div>
    </div>
  );
}
