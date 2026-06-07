import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">Get in Touch</h2>
          <p className="text-slate-400 text-sm">Have feedback or questions? Reach out to the developer.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          
          {/* Left panel: Info cards */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-6">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Developer Coordinates</h3>
              
              <div className="space-y-4 text-xs">
                <div className="flex items-start gap-3">
                  <Phone className="text-brand-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-300">Call / Mobile</p>
                    <p className="text-slate-400 mt-1">+91 8143999463</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-150 dark:border-slate-800/80 pt-4">
                  <Mail className="text-brand-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-300">Email Address</p>
                    <a href="mailto:mukeshpodugu123@gmail.com" className="text-slate-400 mt-1 block hover:underline">
                      mukeshpodugu123@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-slate-150 dark:border-slate-800/80 pt-4">
                  <MapPin className="text-brand-500 shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-300">Campus Location</p>
                    <p className="text-slate-400 mt-1">University Department of Computer Science</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Feedback form */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">Send a Message</h3>

            {success && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs px-4 py-2.5 rounded-xl">
                Thank you! Your feedback message has been simulated and saved.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mukesh Podugu"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. mukeshpodugu123@gmail.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase">Message Details</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask a question or request project help..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 h-28"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/15 disabled:opacity-50 transition"
              >
                {submitting ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                <span>Send Feedback</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Contact;
