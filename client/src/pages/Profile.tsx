import React, { useState } from 'react';
import { useAppSelector, useAppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';
import api from '../services/api';
import { User, Camera, Loader2, Save, BadgeCheck } from 'lucide-react';

const Profile: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);

  const [bio, setBio] = useState(currentUser?.bio || '');
  const [status, setStatus] = useState(currentUser?.status || 'online');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('bio', bio);
      formData.append('status', status);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update Redux Store
      dispatch(updateUser(res.data.user));
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 selection:bg-brand-500 selection:text-white">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold font-display mb-6">Account Profile Settings</h2>

        {success && (
          <div className="mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl">
            Profile details updated successfully.
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* Avatar editor */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800/80">
            <div className="relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-brand-500 shadow-md" />
              ) : currentUser?.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-2 border-slate-700 shadow-md" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-brand-700 text-white text-3xl font-bold flex items-center justify-center border-2 border-slate-700 shadow-md">
                  {currentUser?.username.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 p-2 bg-brand-600 hover:bg-brand-500 rounded-full text-white cursor-pointer shadow-lg transition">
                <Camera size={14} />
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            </div>
            
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-lg font-bold flex items-center gap-1.5 justify-center sm:justify-start">
                <span>{currentUser?.username}</span>
                {currentUser?.isVerified && <BadgeCheck size={18} className="text-brand-500 fill-brand-500/10" />}
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Registered: {new Date(currentUser?.createdAt || '').toLocaleDateString()}</p>
              <p className="text-xs text-slate-400">Supported formats: JPG, PNG, GIF. Max 5MB.</p>
            </div>
          </div>

          {/* Bio Editor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              User Biography (Bio)
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell other users about yourself..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 h-28 text-sm"
              maxLength={200}
            />
          </div>

          {/* Online status tag selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Online Status Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['online', 'away', 'busy', 'offline'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold capitalize transition ${
                    status === st
                      ? 'bg-brand-500/10 border-brand-500 text-brand-600 dark:text-brand-400 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-500'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-bold shadow-md shadow-brand-600/15 disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
