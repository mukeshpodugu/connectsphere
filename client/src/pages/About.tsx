import React from 'react';
import { Mail, Phone, ShieldCheck, Cpu, Code, Network } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">About ConnectSphere</h2>
          <p className="text-slate-400 text-sm">Real-Time Communication & Collaboration Platform</p>
        </div>

        {/* Project Description */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Project Scope & Summary</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            ConnectSphere is a full-stack real-time collaboration application designed and developed as an academic capstone portfolio project. The system mirrors the core communication paradigms of modern industry platforms like Slack and Discord.
          </p>
          <p className="text-sm text-slate-400 leading-relaxed">
            The key focus of this project is demonstrating the integration of high-concurrency protocols (WebSockets) with media streaming (WebRTC signaling) and client-side encryption simulation (CryptoJS AES-256) to establish secure direct channels.
          </p>
        </div>

        {/* Key Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
            <Cpu size={24} className="text-brand-500 mb-3" />
            <h4 className="font-semibold text-sm mb-1">WebSockets Protocol</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Maintains persistence connections for messaging, typing states, and WebRTC signaling.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
            <Network size={24} className="text-brand-500 mb-3" />
            <h4 className="font-semibold text-sm mb-1">WebRTC Streaming</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enables peer-to-peer media negotiations for low-latency audio/video calling.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl">
            <ShieldCheck size={24} className="text-brand-500 mb-3" />
            <h4 className="font-semibold text-sm mb-1">AES-256 Encryption</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Simulates cryptographic confidentiality by encrypting texts before sending to databases.
            </p>
          </div>
        </div>

        {/* Developer Info Card */}
        <div className="bg-brand-500/5 border border-brand-500/15 rounded-2xl p-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Developer Information</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="text-lg font-bold text-white">Mukesh Podugu</p>
              <p className="text-xs text-brand-400 font-semibold mt-0.5">Software Engineering Student & Project Owner</p>
            </div>
            
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-brand-400" />
                <span>+91 8143999463</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-brand-400" />
                <a href="mailto:mukeshpodugu123@gmail.com" className="hover:underline">
                  mukeshpodugu123@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
