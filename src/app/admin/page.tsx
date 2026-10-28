"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  CheckCircle,
  AlertTriangle,
  Lock,
  LogOut,
  FileCheck,
  Ban,
  Clock,
  History,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminPage() {
  const [admin, setAdmin] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [activeTab, setActiveTab] = useState<"VERIFICATIONS" | "REPORTS" | "LOGS">("VERIFICATIONS");
  const [stats, setStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load Dashboard Data
  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.admin);
        setStats(data.stats);

        // Fetch Verifications
        const vRes = await fetch("/api/admin/verifications");
        if (vRes.ok) {
          const vData = await vRes.json();
          setVerifications(vData.requests || []);
        }

        // Fetch Reports
        const rRes = await fetch("/api/admin/reports");
        if (rRes.ok) {
          const rData = await rRes.json();
          setReports(rData.reports || []);
        }

        // Fetch Logs
        const lRes = await fetch("/api/admin/audit-logs");
        if (lRes.ok) {
          const lData = await lRes.json();
          setLogs(lData.logs || []);
        }
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setAdmin(data.admin);
      await loadDashboard();
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerificationDecision = async (id: string, decision: "APPROVE" | "REJECT") => {
    try {
      const res = await fetch(`/api/admin/verifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update verification");
      }

      alert(`Verification request ${decision === "APPROVE" ? "Approved" : "Rejected"}`);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Error processing verification");
    }
  };

  const handleReportAction = async (id: string, action: "BAN_USER" | "DISMISS") => {
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to action report");
      }

      alert(`Report action completed: ${action}`);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || "Error actioning report");
    }
  };

  // 1. Unauthenticated Admin Login Screen
  if (!admin) {
    return (
      <div className="min-h-screen bg-[#070709] text-white flex items-center justify-center p-4 overflow-x-hidden box-border">
        <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 space-y-5 shadow-2xl box-border">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-rose-500 mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">TMD Backoffice</h1>
            <p className="text-xs text-zinc-500">Authorized Moderation Console</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Admin Email</label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@thematchdate.com"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-zinc-400 block mb-1">Password</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-500 transition shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Console"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Authenticated Admin Moderation Console
  return (
    <div className="min-h-screen bg-[#070709] text-white p-4 max-w-4xl mx-auto space-y-6 overflow-x-hidden box-border">
      {/* Top Header */}
      <header className="flex items-center justify-between pb-4 border-b border-zinc-900">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-600 flex items-center justify-center font-black text-sm">
            TMD
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight">TMD Moderation Console</h1>
            <p className="text-[11px] text-zinc-500">
              Logged in as <span className="text-zinc-300 font-semibold">{admin.email}</span> ({admin.role})
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setAdmin(null);
            document.cookie = "tmd_admin_session=; Max-Age=0; path=/;";
          }}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition text-xs flex items-center gap-1.5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </header>

      {/* KPI Cards Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-zinc-950 border-zinc-900 space-y-1">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Total Users
            </span>
            <div className="text-xl font-black text-white">{stats.totalUsers}</div>
            <span className="text-[10px] text-zinc-400">{stats.activeUsers} Active</span>
          </Card>

          <Card className="p-4 bg-zinc-950 border-zinc-900 space-y-1">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Active Subs
            </span>
            <div className="text-xl font-black text-white">{stats.activeSubscriptions}</div>
            <span className="text-[10px] text-emerald-400">Paid Members</span>
          </Card>

          <Card className="p-4 bg-zinc-950 border-zinc-900 space-y-1">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-amber-400" /> Verifications
            </span>
            <div className="text-xl font-black text-white">{stats.pendingVerifications}</div>
            <span className="text-[10px] text-amber-400">Needs Review</span>
          </Card>

          <Card className="p-4 bg-zinc-950 border-zinc-900 space-y-1">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Safety Reports
            </span>
            <div className="text-xl font-black text-white">{stats.pendingReports}</div>
            <span className="text-[10px] text-rose-400">Pending Action</span>
          </Card>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-zinc-900 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab("VERIFICATIONS")}
          className={`pb-3 transition ${
            activeTab === "VERIFICATIONS"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Verification Queue ({verifications.filter((v) => v.status === "PENDING").length})
        </button>

        <button
          onClick={() => setActiveTab("REPORTS")}
          className={`pb-3 transition ${
            activeTab === "REPORTS"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Safety Reports ({reports.filter((r) => r.status === "PENDING").length})
        </button>

        <button
          onClick={() => setActiveTab("LOGS")}
          className={`pb-3 transition ${
            activeTab === "LOGS"
              ? "text-rose-500 border-b-2 border-rose-500"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Audit History
        </button>
      </div>

      {/* Main Tab Content */}
      <main className="space-y-4">
        {/* TAB 1: VERIFICATIONS */}
        {activeTab === "VERIFICATIONS" && (
          <div className="space-y-3">
            {verifications.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No verification requests pending.
              </div>
            ) : (
              verifications.map((v) => (
                <Card key={v.id} className="p-4 bg-zinc-950 border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{v.user.name}</span>
                      <span className="text-zinc-500">• {v.user.phone}</span>
                      <span className="text-zinc-500">• {v.user.city}</span>
                    </div>
                    <Badge variant={v.status === "VERIFIED" ? "verified" : "neutral"}>
                      {v.requestType} • {v.status}
                    </Badge>
                  </div>

                  {v.requestType === "DOB_CORRECTION" && (
                    <div className="text-xs text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
                      <div>Current: Age {v.user.currentAge} (DOB: {new Date(v.user.currentDob).toLocaleDateString()})</div>
                      <div className="font-semibold text-amber-400">
                        Requested: {new Date(v.payload.requestedDob).toLocaleDateString()}
                      </div>
                      {v.payload.documentUrl && (
                        <div className="pt-1">
                          <a href={v.payload.documentUrl} target="_blank" rel="noreferrer" className="text-rose-400 underline">
                            View Proof Document →
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {v.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleVerificationDecision(v.id, "APPROVE")}
                        className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleVerificationDecision(v.id, "REJECT")}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 2: REPORTS */}
        {activeTab === "REPORTS" && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No user or event reports pending.
              </div>
            ) : (
              reports.map((r) => (
                <Card key={r.id} className="p-4 bg-zinc-950 border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-rose-400">Report: {r.reason}</span>
                    <Badge variant={r.status === "ACTIONED" ? "pro" : "neutral"}>
                      {r.status}
                    </Badge>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-1">
                    <p>Reporter: <span className="font-semibold text-white">{r.reporter.name}</span></p>
                    {r.reportedUser && (
                      <p>
                        Reported User: <span className="font-semibold text-white">{r.reportedUser.name}</span> (Status: {r.reportedUser.status})
                      </p>
                    )}
                    {r.details && <p className="text-zinc-400 italic">&quot;{r.details}&quot;</p>}
                  </div>

                  {r.status === "PENDING" && (
                    <div className="flex gap-2 pt-1">
                      {r.reportedUser && (
                        <button
                          onClick={() => handleReportAction(r.id, "BAN_USER")}
                          className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Ban className="w-3.5 h-3.5" /> Ban User
                        </button>
                      )}
                      <button
                        onClick={() => handleReportAction(r.id, "DISMISS")}
                        className="py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        )}

        {/* TAB 3: AUDIT LOGS */}
        {activeTab === "LOGS" && (
          <div className="space-y-2">
            {logs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">
                No audit log entries recorded.
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-white mr-2">{log.action}</span>
                    <span className="text-zinc-500">{log.targetType} ({log.targetId.slice(0, 10)}...)</span>
                  </div>
                  <div className="text-right text-[11px] text-zinc-500">
                    <div>{log.adminUser?.email}</div>
                    <div>{new Date(log.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
