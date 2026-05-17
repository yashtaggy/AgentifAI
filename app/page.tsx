"use client";

import React, { useState, useEffect } from "react";
import { parseOpenApiUrl } from "@/services/openapi";
import { fetchAndParseSpec } from "@/app/actions/openapi";
import { ApiSpec, ApiEndpoint, ChatMessage } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Link, Send, Code, Play, AlertCircle, ChevronRight, Check, Search, Shield, Copy, Sun, Moon } from "lucide-react";
import Editor from "@monaco-editor/react";

const MessageContent = ({ content, theme }: { content: string, theme: "dark" | "light" }) => {
    // Split text by markdown code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
        <div className="space-y-3 leading-relaxed whitespace-pre-wrap font-sans">
            {parts.map((part, index) => {
                if (part.startsWith('```')) {
                    const match = part.match(/```([\w-]*)\n([\s\S]*?)```/);
                    if (match) {
                        const language = match[1] || 'text';
                        const code = match[2];
                        return (
                            <div key={index} className={`relative rounded-xl overflow-hidden border my-3 w-full shadow-lg ${theme === 'dark' ? 'border-white/10 bg-[#0d0d12]' : 'border-black/10 bg-gray-50'
                                }`}>
                                <div className={`flex items-center justify-between px-3 py-1.5 border-b ${theme === 'dark' ? 'border-white/5 bg-black/60' : 'border-black/5 bg-gray-200'
                                    }`}>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">{language}</span>
                                    <button
                                        className="text-[10px] flex items-center space-x-1 text-muted-foreground hover:text-white transition-colors px-1 py-0.5 rounded"
                                        onClick={(e) => {
                                            navigator.clipboard.writeText(code);
                                            const btn = e.currentTarget;
                                            const originalText = btn.innerHTML;
                                            btn.innerHTML = '<svg class="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span class="text-green-400">Copied</span>';
                                            setTimeout(() => btn.innerHTML = originalText, 2000);
                                        }}
                                    >
                                        <Copy className="w-3 h-3" />
                                        <span>Copy</span>
                                    </button>
                                </div>
                                <div className={`p-4 overflow-x-auto text-[12px] font-mono leading-normal ${theme === 'dark' ? 'text-emerald-300 bg-black/40' : 'text-blue-700 bg-white'
                                    }`}>
                                    <code>{code}</code>
                                </div>
                            </div>
                        );
                    }
                }

                // For non-code blocks, parse single backticks for inline code
                const inlineParts = part.split(/`([^`]+)`/g);
                return (
                    <span key={index} className="text-[13px] block">
                        {inlineParts.map((chunk, i) =>
                            i % 2 === 1 ? (
                                <code key={i} className={`px-1 py-0.5 rounded font-mono text-[11px] font-bold mx-0.5 border ${theme === 'dark' ? 'bg-black/30 border-white/10 text-blue-300' : 'bg-gray-100 border-black/10 text-blue-700'
                                    }`}>{chunk}</code>
                            ) : chunk
                        )}
                    </span>
                );
            })}
        </div>
    );
};

export default function Home() {
    const [url, setUrl] = useState("https://petstore.swagger.io/v2/swagger.json");
    const [spec, setSpec] = useState<ApiSpec | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState("");
    const [chatLoading, setChatLoading] = useState(false);

    const [theme, setTheme] = useState<"dark" | "light">("dark");
    const [testParams, setTestParams] = useState<Record<string, string>>({});
    const [testResponse, setTestResponse] = useState<any>(null);
    const [testLoading, setTestLoading] = useState(false);

    useEffect(() => {
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
    }, [theme]);

    const handleParse = async (overrideUrl?: string) => {
        const targetUrl = overrideUrl || url;
        if (!targetUrl) return;

        setLoading(true);
        setError(null);
        try {
            const parsedSpec = await fetchAndParseSpec(targetUrl);
            setSpec(parsedSpec);
            if (parsedSpec.endpoints.length > 0) {
                setSelectedEndpoint(parsedSpec.endpoints[0]);
            }
        } catch (err: any) {
            setError(err.message || "Failed to parse API");
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        // Add user message
        const newMessages = [...messages, { role: "user" as const, content: text }];
        setMessages(newMessages);
        setChatInput("");
        setChatLoading(true);

        try {
            const systemContext = selectedEndpoint
                ? `Context: The user is currently looking at the endpoint ${selectedEndpoint.method} ${selectedEndpoint.path}. 
           Base URL: ${spec?.baseUrl}. Parameters: ${JSON.stringify(selectedEndpoint.parameters)}.
           They might ask for code generation, explanation, or help debugging.`
                : "";

            const reqMessages = [
                ...newMessages.map(m => ({ role: m.role, content: m.content })),
                { role: "system", content: systemContext }
            ];

            const res = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messages: reqMessages })
            });

            const data = await res.json();

            if (data.error) {
                throw new Error(data.error);
            }

            setMessages([...newMessages, { role: "assistant", content: data.content }]);
        } catch (err: any) {
            setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message}` }]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleTestApi = async () => {
        if (!selectedEndpoint || !spec) return;

        setTestLoading(true);
        try {
            let finalUrl = selectedEndpoint.path;
            const queryParams = new URLSearchParams();

            selectedEndpoint.parameters.forEach(p => {
                const val = testParams[p.name];
                if (!val) return;

                if (p.in === "path") {
                    finalUrl = finalUrl.replace(`{${p.name}}`, val);
                } else if (p.in === "query") {
                    queryParams.append(p.name, val);
                }
            });

            const qString = queryParams.toString();
            const fullUrl = `${spec.baseUrl}${finalUrl}${qString ? `?${qString}` : ''}`;

            let fetchOpts: RequestInit = {
                method: selectedEndpoint.method,
                headers: {
                    "Accept": "application/json"
                }
            };

            // Basic testing - doesn't handle all complex bodies or auth perfectly yet
            if (selectedEndpoint.requestBody && testParams.body) {
                fetchOpts.body = testParams.body;
                // @ts-ignore
                fetchOpts.headers["Content-Type"] = "application/json";
            }

            const res = await fetch(fullUrl, fetchOpts);
            const data = await res.text();

            let parsedData = data;
            try {
                parsedData = JSON.parse(data);
            } catch (e) { }

            setTestResponse({
                status: res.status,
                statusText: res.statusText,
                data: parsedData,
            });

            if (!res.ok) {
                // Automatically ask AI for help
                setMessages(prev => [...prev, {
                    role: "system",
                    content: `API Error: ${res.status} ${res.statusText}. Response: ${data}. Provide friendly explanation and suggest likely fixes.`
                }]);

                const autoExplainText = `The API call failed with status ${res.status}. Can you explain why and suggest fixes?`;
                handleSendMessage(autoExplainText);
            }

        } catch (err: any) {
            setTestResponse({ error: err.message });
        } finally {
            setTestLoading(false);
        }
    };

    const getMethodColor = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
            case 'POST': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50';
            case 'PUT': return 'bg-amber-500/20 text-amber-500 border-amber-500/50';
            case 'DELETE': return 'bg-red-500/20 text-red-500 border-red-500/50';
            default: return 'bg-slate-500/20 text-slate-500 border-slate-500/50';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background">

            {/* SIDEBAR - Endpoints */}
            {spec && (
                <div className="w-80 border-r border-border bg-card/50 backdrop-blur-sm flex flex-col h-full">
                    <div className="p-6 border-b border-border">
                        <h2 className="font-bold text-xl truncate" title={spec.title}>{spec.title}</h2>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{spec.baseUrl}</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {spec.endpoints.map((ep, idx) => (
                            <button
                                key={idx}
                                onClick={() => {
                                    setSelectedEndpoint(ep);
                                    setTestResponse(null);
                                    setTestParams({});
                                }}
                                className={`w-full text-left p-3 rounded-lg border transition-all text-sm flex items-center space-x-3 
                  ${selectedEndpoint === ep
                                        ? 'bg-accent border-accent-foreground/20'
                                        : 'border-transparent hover:bg-white/5'}`}
                            >
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${getMethodColor(ep.method)}`}>
                                    {ep.method}
                                </span>
                                <span className="font-mono text-xs truncate flex-1">{ep.path}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">

                {/* Header / Landing Input */}
                <header className="flex-none p-6 border-b border-border bg-background z-10 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Bot className="w-6 h-6 text-primary" />
                            <h1 className="font-bold text-lg">Agentic API Copilot</h1>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="rounded-full w-9 h-9"
                        >
                            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </Button>
                    </div>
                    {spec && (
                        <div className="flex items-center space-x-3 w-1/2">
                            <div className="relative flex-1">
                                <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    value={url}
                                    onChange={e => setUrl(e.target.value)}
                                    placeholder="Paste OpenAPI / Swagger JSON URL..."
                                    className="pl-9 glassmorphism"
                                />
                            </div>
                            <Button onClick={() => handleParse()} disabled={loading}>
                                {loading ? "Parsing..." : "Parse API"}
                            </Button>
                        </div>
                    )}
                </header>

                {/* Content Body */}
                <main className="flex-1 overflow-hidden relative">
                    {!spec ? (
                        <div className="h-full overflow-y-auto w-full">
                            <div className="max-w-5xl mx-auto space-y-16 px-6 py-12 pb-24">

                                {/* Hero Section */}
                                <div className="text-center space-y-6 pt-8">
                                    <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">AI-Powered API Explorer</h2>
                                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                                        Paste an OpenAPI JSON spec URL below to instantly generate a developer dashboard, ask AI to write implementation code, or seamlessly test endpoints.
                                    </p>

                                    {/* Central Parsing Input */}
                                    <div className="max-w-xl mx-auto w-full flex flex-col space-y-4 pt-6">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative flex-1 w-full">
                                                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                                <Input
                                                    value={url}
                                                    onChange={e => setUrl(e.target.value)}
                                                    placeholder="Paste OpenAPI / Swagger JSON URL..."
                                                    className="pl-11 h-14 rounded-xl glassmorphism text-base w-full"
                                                    onKeyDown={e => { if (e.key === 'Enter') handleParse(); }}
                                                />
                                            </div>
                                            <Button onClick={() => handleParse()} disabled={loading} size="lg" className="h-14 px-8 rounded-xl font-medium text-base">
                                                {loading ? "Parsing..." : "Parse API"}
                                            </Button>
                                        </div>
                                        <div className="pt-2">
                                            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-3">Quick Start Samples</p>
                                            <div className="flex flex-wrap justify-center gap-2">
                                                {[
                                                    { name: "Petstore v2", url: "https://petstore.swagger.io/v2/swagger.json", color: "blue" },
                                                    { name: "Bitbucket", url: "https://api.bitbucket.org/swagger.json", color: "blue" },
                                                    { name: "1Password", url: "https://api.apis.guru/v2/specs/1password.com/events/1.0.0/openapi.json", color: "emerald" },
                                                    { name: "1Forge", url: "https://api.apis.guru/v2/specs/1forge.com/0.0.1/swagger.json", color: "amber" },
                                                    { name: "Authentiq", url: "https://api.apis.guru/v2/specs/6-dot-authentiqio.appspot.com/6/openapi.json", color: "purple" }
                                                ].map((sample) => (
                                                    <button
                                                        key={sample.name}
                                                        onClick={() => { setUrl(sample.url); handleParse(sample.url); }}
                                                        className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-border bg-card/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                                                    >
                                                        {sample.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        {error && (
                                            <div className="w-full mt-4 p-4 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl flex items-center justify-center">
                                                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                                                {error}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Capabilities Section */}
                                <div className="space-y-10 pt-8 border-t border-white/5 relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>

                                    <div className="text-center space-y-3">
                                        <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full text-xs font-medium mb-2">
                                            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                                            <span>Platform Architecture</span>
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">From Static Docs to Autonomous API Enablement</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[220px] md:auto-rows-[250px]">

                                        {/* Doc Parsing - Large Horizontal */}
                                        <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 flex flex-col justify-between transition-all hover:border-blue-500/30 shadow-sm">
                                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-10 font-mono text-sm leading-tight text-blue-300 pointer-events-none transition-opacity">
                                                {`{
  "openapi": "3.0.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  }
}`}
                                            </div>
                                            <div className="absolute -inset-24 bg-blue-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                            <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4 relative z-10">
                                                <Search className="w-5 h-5" />
                                            </div>
                                            <div className="relative z-10 mt-auto">
                                                <h3 className="text-2xl font-bold mb-2 tracking-tight">Intelligent Doc Parsing</h3>
                                                <p className="text-muted-foreground text-sm max-w-md">Understands OpenAPI & Swagger specs natively to auto-detect endpoints & authentication. Spec-driven grounding actively eliminates LLM hallucinations.</p>
                                            </div>
                                        </div>

                                        {/* Sandbox - Vertical */}
                                        <div className="md:col-span-1 md:row-span-2 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 flex flex-col transition-all hover:border-purple-500/30 shadow-sm">
                                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8033ff11_1px,transparent_1px),linear-gradient(to_bottom,#8033ff11_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>
                                            <div className="absolute -inset-24 bg-purple-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                            <div className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-6 relative z-10">
                                                <Play className="w-5 h-5 ml-0.5" />
                                            </div>
                                            <div className="relative z-10 flex-1 flex flex-col">
                                                <h3 className="text-2xl font-bold mb-3 tracking-tight">Interactive Sandbox</h3>
                                                <p className="text-muted-foreground text-sm mb-6">Ask in natural language, automatically construct API calls, and execute instantly.</p>

                                                <div className="mt-auto">
                                                    <div className="bg-card rounded-xl border border-border p-4 font-mono text-[11px] space-y-3 backdrop-blur-md">
                                                        <div className="flex space-x-1.5 mb-2">
                                                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                                                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                                                        </div>
                                                        <div className="text-purple-300">➜ <span className="text-foreground">execute</span> <span className="text-emerald-400 font-bold">POST</span> /users</div>
                                                        <div className="text-green-500 flex items-center"><Check className="w-3 h-3 mr-1" /> 201 Created</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Code Gen - Small square */}
                                        <div className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 flex flex-col justify-between transition-all hover:border-emerald-500/30 shadow-sm">
                                            <div className="absolute -inset-24 bg-emerald-500/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                            <div className="flex items-center justify-between relative z-10 mb-4">
                                                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                    <Code className="w-5 h-5" />
                                                </div>
                                                <div className="font-mono text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded">SDK</div>
                                            </div>
                                            <div className="relative z-10 mt-auto">
                                                <h3 className="text-xl font-bold mb-2 tracking-tight">Instant SDK / Scripts</h3>
                                                <p className="text-muted-foreground text-sm">Generate executable Python/JS snippets with built-in retry logic instantly.</p>
                                            </div>
                                        </div>

                                        {/* Self Healing - Small square */}
                                        <div className="md:col-span-1 group relative overflow-hidden rounded-[2rem] bg-card border border-border p-8 flex flex-col justify-between transition-all hover:border-amber-500/30 shadow-sm">
                                            <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/5 rounded-bl-[100px] -z-0 group-hover:scale-110 transition-transform duration-700"></div>
                                            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4 relative z-10">
                                                <Shield className="w-5 h-5" />
                                            </div>
                                            <div className="relative z-10 mt-auto">
                                                <h3 className="text-xl font-bold mb-2 tracking-tight">Self-Healing APIs</h3>
                                                <p className="text-muted-foreground text-sm">Detects API runtime errors & automatically suggests JSON payload fixes.</p>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : selectedEndpoint ? (
                        <div className="h-full flex">
                            {/* Endpoint Details */}
                            <div className="flex-1 p-8 overflow-y-auto">
                                <div className="max-w-3xl mx-auto space-y-8">
                                    <div>
                                        <h2 className="text-3xl font-bold mb-2">{selectedEndpoint.summary || selectedEndpoint.operationId || "Endpoint"}</h2>
                                        <p className="text-muted-foreground">{selectedEndpoint.description}</p>
                                    </div>

                                    <div className="flex items-center space-x-4 p-4 rounded-xl glassmorphism border border-white/5">
                                        <Badge variant="outline" className={`text-sm ${getMethodColor(selectedEndpoint.method)}`}>
                                            {selectedEndpoint.method}
                                        </Badge>
                                        <span className="font-mono text-lg text-foreground/90">{selectedEndpoint.path}</span>
                                    </div>

                                    {/* API Playground */}
                                    <Card className="glassmorphism border-white/10">
                                        <CardHeader>
                                            <CardTitle className="text-lg">API Playground</CardTitle>
                                            <CardDescription>Test this endpoint directly</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {selectedEndpoint.parameters.length > 0 && (
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-semibold">Parameters</h4>
                                                    {selectedEndpoint.parameters.map((p, i) => (
                                                        <div key={i} className="flex gap-4 items-center">
                                                            <span className="w-1/4 text-sm font-mono text-muted-foreground">
                                                                {p.name} {p.required && <span className="text-destructive">*</span>}
                                                            </span>
                                                            <Badge variant="secondary" className="text-[10px]">{p.in}</Badge>
                                                            <Input
                                                                className="flex-1 h-8 text-sm"
                                                                placeholder={p.description || "value..."}
                                                                value={testParams[p.name] || ''}
                                                                onChange={e => setTestParams({ ...testParams, [p.name]: e.target.value })}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedEndpoint.requestBody && (
                                                <div className="space-y-3 pt-4">
                                                    <h4 className="text-sm font-semibold">Request Body (JSON)</h4>
                                                    <div className="h-40 border rounded-md overflow-hidden border-border/50">
                                                        <Editor
                                                            height="100%"
                                                            defaultLanguage="json"
                                                            theme={theme === "dark" ? "vs-dark" : "light"}
                                                            value={testParams.body || '{\n  \n}'}
                                                            onChange={(val) => setTestParams({ ...testParams, body: val || '' })}
                                                            options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            <Button onClick={handleTestApi} disabled={testLoading} className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                                                {testLoading ? "Testing..." : <><Play className="w-4 h-4 mr-2" /> Execute Request</>}
                                            </Button>

                                            {testResponse && (
                                                <div className="mt-6 space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-medium">Response</span>
                                                        <Badge variant={testResponse.status < 400 ? "default" : "destructive"}>
                                                            {testResponse.status} {testResponse.statusText}
                                                        </Badge>
                                                    </div>
                                                    <div className="p-4 rounded-lg bg-black/50 border border-white/10 font-mono text-sm overflow-x-auto">
                                                        <pre className="text-green-400">
                                                            {JSON.stringify(testResponse.data, null, 2)}
                                                        </pre>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>

                                </div>
                            </div>

                            {/* AI CHAT PANEL */}
                            <div className="w-96 border-l border-border bg-card/30 flex flex-col">
                                <div className="p-4 border-b border-border bg-card/80 backdrop-blur font-medium flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Bot className="w-5 h-5 text-primary" />
                                        <span>AI Assistant</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.filter(m => m.role !== 'system').length === 0 && (
                                        <div className="text-center text-sm text-muted-foreground p-4">
                                            Ask me to write Python code, explain auth, or generate a cURL command for this endpoint!
                                        </div>
                                    )}
                                    {messages.filter(m => m.role !== 'system').map((m, idx) => (
                                        <div key={idx} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                                            <div className={`px-4 py-3 rounded-2xl max-w-[90%] break-words ${m.role === 'user'
                                                ? 'bg-primary text-primary-foreground rounded-tr-sm text-[13px] whitespace-pre-wrap'
                                                : 'bg-accent border border-white/5 rounded-tl-sm text-accent-foreground shadow-sm w-full'
                                                }`}>
                                                {m.role === 'user' ? m.content : <MessageContent content={m.content} theme={theme} />}
                                            </div>
                                        </div>
                                    ))}
                                    {chatLoading && (
                                        <div className="flex items-start">
                                            <div className="text-sm px-4 py-2.5 rounded-2xl bg-accent border border-white/5 rounded-tl-sm text-muted-foreground flex space-x-1">
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75"></span>
                                                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150"></span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="p-4 border-t border-border bg-card/50">
                                    <div className="relative">
                                        <Textarea
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(chatInput);
                                                }
                                            }}
                                            placeholder="Ask the AI for code..."
                                            className="resize-none pr-12 min-h-0 h-[60px] py-3 glassmorphism"
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground hover:text-primary"
                                            onClick={() => handleSendMessage(chatInput)}
                                        >
                                            <Send className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 pb-scroll">
                                        {["Generate Python Code", "Generate cURL", "Explain Endpoint"].map((suggestion) => (
                                            <button
                                                key={suggestion}
                                                onClick={() => handleSendMessage(suggestion)}
                                                className="text-[10px] whitespace-nowrap bg-white/5 hover:bg-primary/20 hover:text-primary transition-colors border border-white/10 px-2.5 py-1 rounded-full"
                                            >
                                                {suggestion}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </main>
            </div>
        </div>
    );
}
