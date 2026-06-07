import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import ProjectInfoModal from '../components/ProjectInfoModal';
import { Moon, Sun, Bell, Volume2, ShieldCheck, Mail, Info } from 'lucide-react';

const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const [soundAlerts, setSoundAlerts] = useState(true);
  const [browserPush, setBrowserPush] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold font-display mb-6">User Preferences & Settings</h2>

        <div className="space-y-6">
          {/* Theme Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Aesthetics & Layout</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Theme Mode</p>
                <p className="text-xs text-slate-400 mt-0.5">Toggle between light and dark aesthetics.</p>
              </div>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold transition"
              >
                {theme === 'dark' ? (
                  <>
                    <Sun size={14} className="text-amber-500" />
                    <span>Switch to Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-brand-500" />
                    <span>Switch to Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Notification Center</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Sound Notifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Play alert audio clips on incoming text messages.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundAlerts}
                  onChange={(e) => setSoundAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
              <div>
                <p className="font-semibold text-sm">Browser Push Alerts</p>
                <p className="text-xs text-slate-400 mt-0.5">Push OS alerts when client dashboard runs in background.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={browserPush}
                  onChange={(e) => setBrowserPush(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-950 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
          </div>

          {/* Project owner credentials */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Application Details</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Project Specifications</p>
                <p className="text-xs text-slate-400 mt-0.5">Explore capstone features, stack configurations, and developer bio.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-650 hover:bg-brand-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-brand-600/15"
              >
                <Info size={14} />
                <span>Show Information</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <ProjectInfoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default Settings;
