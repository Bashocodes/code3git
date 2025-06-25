import React, { useState, useEffect } from 'react';
import { ArrowLeft, User as UserIcon, Save, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AccountSettingsViewProps {
  onClose: () => void;
}

export function AccountSettingsView({ onClose }: AccountSettingsViewProps) {
  const { user, profile, booting, updateProfile, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    console.log('🔄 AccountSettingsView: Profile data updated:', profile);
    if (profile) {
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user?.id) {
      setStatusMessage({ type: 'error', message: 'You must be logged in to update your profile.' });
      return;
    }

    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 4 || trimmedUsername.length > 9) {
      setStatusMessage({ type: 'error', message: 'Username must be between 4 and 9 characters.' });
      return;
    }

    if (trimmedUsername === profile?.username) {
      setStatusMessage({ type: 'error', message: 'No changes to save.' });
      return;
    }

    setIsUpdating(true);
    setStatusMessage(null);

    try {
      const { success, error } = await updateProfile({
        username: trimmedUsername,
      });
      
      if (success) {
        setStatusMessage({ type: 'success', message: 'Profile updated successfully!' });
        console.log('✅ Profile updated successfully');
      } else {
        setStatusMessage({ type: 'error', message: error || 'Failed to update profile.' });
      }
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'An unexpected error occurred.' });
      console.error('Update profile error:', error);
    } finally {
      setIsUpdating(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose(); // Close settings and go back to main view
    } catch (error) {
      setStatusMessage({ type: 'error', message: 'Failed to sign out.' });
      console.error('Sign out error:', error);
    }
  };

  if (booting) {
    return (
      <div className="pt-16 h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#B8A082] w-10 h-10" />
        <p className="text-white/70 ml-4">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-16 h-screen flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-light text-[#E0E0E0] mb-4">Not Signed In</h2>
        <p className="text-white/70 mb-6">Please sign in to manage your account settings.</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-[#B8A082] hover:bg-[#A69072] text-[#1a1a1a] rounded-xl font-medium transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="pt-16 min-h-screen bg-[#1a1a1a]">
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Back to main page"
            >
              <ArrowLeft size={20} className="text-white" />
            </button>
            <div className="flex items-center gap-3">
              <UserIcon size={24} className="text-[#7C9A92]" />
              <div>
                <h1 className="text-2xl font-light text-[#E0E0E0]">Account Settings</h1>
                <p className="text-[#7C9A92] font-mono text-sm">Manage your profile and preferences</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg mx-auto bg-white/5 rounded-2xl p-6 shadow-lg border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>

            <div className="mb-4">
              <label htmlFor="email" className="block text-white/70 text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={user.email || 'N/A'}
                readOnly
                className="w-full p-3 rounded-xl bg-white/10 text-white/80 cursor-not-allowed border border-white/20"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="username" className="block text-white/70 text-sm font-medium mb-2">
                Username (4-9 characters)
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#B8A082] border border-white/20"
                maxLength={9}
                minLength={4}
                placeholder={profile?.username ? '' : 'Enter username'}
              />
            </div>

            {statusMessage && (
              <div className={`mb-4 flex items-center gap-2 text-sm ${statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                {statusMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>{statusMessage.message}</span>
              </div>
            )}

            <button
              onClick={handleUpdateProfile}
              disabled={isUpdating || username.trim().length < 4}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                isUpdating || username.trim().length < 4
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-[#B8A082] hover:bg-[#A69072] text-[#1a1a1a]'
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={20} />
                  Save Changes
                </>
              )}
            </button>

            <div className="mt-8 pt-6 border-t border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Session Management</h2>
              <button
                onClick={handleSignOut}
                disabled={isUpdating}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isUpdating
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}