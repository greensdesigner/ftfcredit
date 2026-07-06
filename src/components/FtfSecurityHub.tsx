import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Fingerprint, Eye, EyeOff, 
  RefreshCw, AlertCircle, Smartphone, CheckSquare, List 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { auditLogs } from '../data/ftfMockData';

export default function FtfSecurityHub() {
  const [twoFactorActive, setTwoFactorActive] = useState(true);
  const [biometricSimulated, setBiometricSimulated] = useState(true);
  const [dataEncrypted, setDataEncrypted] = useState(true);
  const [showSSNCode, setShowSSNCode] = useState(false);
  const [refreshingLogs, setRefreshingLogs] = useState(false);
  const [liveLogs, setLiveLogs] = useState(auditLogs);

  const handleRefreshSecurityLogs = () => {
    setRefreshingLogs(true);
    setTimeout(() => {
      const newLog = {
        id: `log-${Date.now()}`,
        action: 'Direct IP session integrity hand-shake compiled successfully',
        ipAddress: '192.168.1.104',
        device: 'Chrome v126 on Windows 11',
        timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setLiveLogs([newLog, ...liveLogs]);
      setRefreshingLogs(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 text-left animate-in fade-in duration-300">
      
      {/* COMPLIANCE STATUS BAR */}
      <div className="bg-neutral-900 text-white rounded-[32px] p-8 shadow-lg space-y-6">
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono">PHASE 14: ENTERPRISE-GRADE CRYPTO VAULT</span>
          <h2 className="font-display font-black text-2xl tracking-tight leading-none">Security, Audits & Regulatory Compliance</h2>
          <p className="text-xs text-neutral-400">Strictly satisfying national frameworks regarding SSN, tax documents, and financial files handling.</p>
        </div>

        {/* Mapped framework compliance badges */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-white/10">
          {[
            { name: 'FCRA Compliant', desc: 'Fair Credit Reporting' },
            { name: 'GLBA Safe', desc: 'Financial Data Security' },
            { name: 'FTC Safeguards', desc: 'Double Encryption' },
            { name: 'SOC 2 Type II', desc: 'Third-Party Audited' },
            { name: 'PCI-DSS v4.0', desc: 'Card Processing standard' }
          ].map((c) => (
            <div key={c.name} className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center space-y-1">
              <ShieldCheck className="text-emerald-400 mx-auto" size={18} />
              <div className="text-[10px] font-black text-white">{c.name}</div>
              <p className="text-[8px] text-neutral-400 font-medium">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ENCRYPTION & SECURITY ACTIONS (5 Columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
            <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
              <Lock size={18} /> Interactive Authentication Controls
            </h3>

            {/* Auth Settings switches */}
            <div className="space-y-4">
              
              {/* 2FA */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="text-left space-y-0.5">
                  <h4 className="font-bold text-xs text-neutral-800">Two-Factor Authentication (2FA)</h4>
                  <p className="text-[10px] text-neutral-400 leading-normal font-semibold">Requests cell/email dynamic OTP codes on unrecognized logons.</p>
                </div>
                <button
                  onClick={() => setTwoFactorActive(!twoFactorActive)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border cursor-pointer transition-all",
                    twoFactorActive ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-black" : "bg-neutral-100 text-neutral-500 border-neutral-200"
                  )}
                >
                  {twoFactorActive ? "Active" : "Disabled"}
                </button>
              </div>

              {/* Biometrics */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100">
                <div className="text-left space-y-0.5">
                  <h4 className="font-bold text-xs text-neutral-800 flex items-center gap-1">
                    <Fingerprint size={14} className="text-neutral-500" /> Biometric Key-Signature
                  </h4>
                  <p className="text-[10px] text-neutral-400 leading-normal font-semibold">Enables face-recognition or fingerprint access on companion mobile channels.</p>
                </div>
                <button
                  onClick={() => setBiometricSimulated(!biometricSimulated)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border cursor-pointer transition-all",
                    biometricSimulated ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-black" : "bg-neutral-100 text-neutral-500 border-neutral-200"
                  )}
                >
                  {biometricSimulated ? "Simulated" : "Disabled"}
                </button>
              </div>

              {/* Encrypted Vault status */}
              <div className="p-4 bg-blue-50 border border-blue-150 rounded-2xl flex gap-3 text-left">
                <ShieldCheck size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-blue-900 leading-normal">
                  <span className="font-extrabold block uppercase tracking-wider text-[10px]">AES-256 Storage Status</span>
                  <p className="font-medium text-blue-800">
                    All document archives (SSN cards, pass ports, billing utility receipts) are fully processed into decentralized client-isolated database blocks, protected by TLS 1.3 tunnels.
                  </p>
                </div>
              </div>

              {/* SSN Access audit logger */}
              <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-2xl flex justify-between items-center text-xs">
                <div className="text-left space-y-0.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Vault Decryption Tool</span>
                  <div className="font-bold text-neutral-800 mt-1">
                    {showSSNCode ? "Client SSN Card: Decrypted" : "Verify Enrolled Client SSN"}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSSNCode(!showSSNCode);
                    // Add audit log entry
                    const actionName = showSSNCode ? 'Authorized client SSN token masked' : 'Decrypted client SSN for letter alignment';
                    const newLog = {
                      id: `log-${Date.now()}`,
                      action: actionName,
                      ipAddress: '192.168.1.104',
                      device: 'Chrome v126 on Windows 11',
                      timestamp: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                    setLiveLogs([newLog, ...liveLogs]);
                  }}
                  className="px-2.5 py-1.5 bg-neutral-900 text-white hover:bg-neutral-800 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer flex items-center gap-1"
                >
                  {showSSNCode ? <EyeOff size={12} /> : <Fingerprint size={12} />}
                  {showSSNCode ? "Hide SSN" : "Authorize View"}
                </button>
              </div>

              {showSSNCode && (
                <div className="p-4 bg-neutral-950 text-emerald-400 font-mono text-[10px] rounded-2xl border border-neutral-800 text-center leading-relaxed">
                  DECRYPTED METRIC: SSN: ***-**-1234 (Verified)
                </div>
              )}

            </div>
          </div>
        </div>

        {/* AUDIT LOGS DISPLAY (7 Columns) */}
        <div className="lg:col-span-7 bg-white border border-neutral-150 rounded-[32px] p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
            <div>
              <h3 className="font-display font-black text-base text-neutral-900 flex items-center gap-2">
                <List size={18} /> Active System Security Audit Logs
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">All actions (SSN decrypts, file downloads, login verifications) are irreversibly logged with IP and hardware signatures.</p>
            </div>
            <button
              onClick={handleRefreshSecurityLogs}
              disabled={refreshingLogs}
              className="px-3.5 py-1.5 border border-neutral-200 hover:border-neutral-950 rounded-xl text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw size={12} className={refreshingLogs ? "animate-spin" : ""} />
              {refreshingLogs ? "Encrypting..." : "Scan Logs"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="pb-3 font-extrabold">Logged Action Trigger</th>
                  <th className="pb-3 font-extrabold text-center">IP Address</th>
                  <th className="pb-3 font-extrabold text-right">Audit Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 text-xs font-bold text-neutral-800">
                {liveLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/50">
                    <td className="py-4">
                      <div className="space-y-0.5 text-left">
                        <p className="text-neutral-900 font-extrabold">{log.action}</p>
                        <p className="text-[10px] text-neutral-400 font-semibold font-mono">{log.device}</p>
                      </div>
                    </td>
                    <td className="py-4 text-center font-mono font-medium text-neutral-500 text-[11px]">{log.ipAddress}</td>
                    <td className="py-4 text-right text-neutral-500 font-mono text-[11px] font-medium">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
