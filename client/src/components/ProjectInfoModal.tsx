import React from 'react';
import { X, Mail, Phone, Code, Database, Info } from 'lucide-react';

interface ProjectInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2 text-brand-400">
            <Info size={20} />
            <h2 className="text-lg font-bold font-display text-white">About ConnectSphere</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Project Goal</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              ConnectSphere is a high-performance, secure, real-time collaboration application that simulates modern chats, voice call signaling, WebRTC media streaming, and simulated E2E AES messaging encryption.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-brand-400 mb-1.5">
                <Code size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Frontend Stack</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                React.js, TypeScript, Tailwind CSS, Redux Toolkit, React Router, Socket.IO Client, Framer Motion, Chart.js
              </p>
            </div>
            <div className="bg-slate-950/40 border border-slate-800/80 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 text-brand-400 mb-1.5">
                <Database size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Backend & Db</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Node.js, Express, TypeScript, MongoDB Atlas, Socket.IO, WebRTC signals, CryptoJS, Redis Presence
              </p>
            </div>
          </div>

          {/* Owner details - VERY IMPORTANT */}
          <div className="border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Project Owner & Developer</h3>
            <div className="bg-brand-500/5 border border-brand-500/15 rounded-xl p-4 space-y-2.5">
              <p className="text-sm font-bold text-white">Mukesh Podugu</p>
              
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Phone size={14} className="text-brand-400" />
                <span>+91 8143999463</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Mail size={14} className="text-brand-400" />
                <a href="mailto:mukeshpodugu123@gmail.com" className="hover:underline hover:text-brand-300">
                  mukeshpodugu123@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-xs font-bold transition"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoModal;
