import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Shield, Video, Users, BarChart2, Star } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-xl text-white shadow-lg shadow-brand-500/30">
            <MessageSquare size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight font-display bg-gradient-to-r from-brand-400 to-indigo-400 bg-clip-text text-transparent">
            ConnectSphere
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-brand-600 hover:bg-brand-500 px-4 py-2 rounded-lg text-sm font-semibold transition shadow-md shadow-brand-600/20"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-20 pb-16 px-6 text-center max-w-5xl mx-auto">
          {/* Decorative blurred backgrounds */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[25rem] h-[25rem] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20 mb-6 animate-pulse-slow">
            <Star size={12} fill="currentColor" /> WebRTC & AES-256 Encrypted
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold font-display tracking-tight leading-none mb-6">
            Instant Communication, <br />
            <span className="bg-gradient-to-r from-brand-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Elevated Collaboration.
            </span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            ConnectSphere brings teams together through secure real-time messaging, crystal-clear voice/video calls, and collaborative groups. Inspired by Discord, Slack, and WhatsApp.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto bg-gradient-to-r from-brand-600 to-indigo-600 hover:opacity-90 px-8 py-4 rounded-xl text-base font-bold transition shadow-lg shadow-brand-500/25"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 px-8 py-4 rounded-xl text-base font-bold transition border border-slate-700"
            >
              Sign In to Dashboard
            </Link>
          </div>
        </section>

        {/* Feature Cards Grid */}
        <section className="bg-slate-950/50 border-t border-slate-900 py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Core Platform Capabilities</h2>
              <p className="text-slate-400 max-w-xl mx-auto">
                Built with a professional tech stack (React, Node, Express, MongoDB, Socket.IO, WebRTC, CryptoJS, and Redis).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Real-Time Messaging</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Instant message delivery, typing indicators, statuses (sent/delivered/read), edit/delete functionality, pinned and starred highlights.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Video size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">WebRTC Video & Voice</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  One-to-one audio and video calling directly in your browser. Complete with camera controls, audio muting, and real-time screen sharing.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Shield size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">E2E AES Encryption</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Simulated client-side AES-256 message encryption using CryptoJS. The server database only stores ciphertexts and IVs, ensuring privacy.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Group Collaboration</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Create custom groups, define descriptions, customize avatars, and invite or remove members with admin role hierarchies.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <BarChart2 size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Admin Dashboard</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Comprehensive analytics panels showing total active users, online status, messages traffic, database volumes, and user moderation controls.
                </p>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl hover:border-brand-500/30 transition group">
                <div className="bg-brand-500/10 text-brand-400 p-3 rounded-xl w-fit mb-6 group-hover:bg-brand-600 group-hover:text-white transition">
                  <Users size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-3">Presence & Files</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  User online, away, busy states backed by Redis fallback tracking. Drag-and-drop file sharing with previews for documents and media.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section with Developer Details */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12 px-6 text-center text-slate-500 text-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg text-white">
              <MessageSquare size={16} />
            </div>
            <span className="font-semibold text-white">ConnectSphere</span>
          </div>
          <div>
            <p className="font-medium text-slate-300">Project Developer: Mukesh Podugu</p>
            <p className="text-xs">Mobile: +91 8143999463 | Email: mukeshpodugu123@gmail.com</p>
          </div>
          <p>© 2026 ConnectSphere. Final Year Capstone Project. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
