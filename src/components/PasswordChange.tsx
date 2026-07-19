import React, { useState } from 'react';
import { Lock, Check, ShieldAlert } from 'lucide-react';
import { UserItem } from './UserManagement';

interface PasswordChangeProps {
  currentUser: UserItem;
  usersList: UserItem[];
  setUsersList: React.Dispatch<React.SetStateAction<UserItem[]>>;
  onLogout: () => void;
  onClose: () => void;
}

export default function PasswordChange({ currentUser, usersList, setUsersList, onLogout, onClose }: PasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check current password
    if (currentPassword !== currentUser.password) {
        setErrorMsg('Current password does not match.');
        return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        return;
    }
    
    setUsersList(prev => prev.map(u => {
        if (u.id === currentUser.id) {
            return { ...u, password: newPassword };
        }
        return u;
    }));
    
    setSuccessMsg('Password updated successfully! Logging out...');
    setTimeout(() => {
        onLogout();
    }, 2000);
  };
  
  return (
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm max-w-md mx-auto relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">×</button>
        <h2 className="text-lg font-bold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Change Password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full border border-gray-300 rounded p-2 text-sm" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full border border-gray-300 rounded p-2 text-sm" />
            </div>
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full border border-gray-300 rounded p-2 text-sm" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded text-sm transition-all">Update Password</button>
        </form>
        {successMsg && <p className="text-emerald-600 text-xs mt-3 flex items-center"><Check className="w-4 h-4 mr-1"/>{successMsg}</p>}
        {errorMsg && <p className="text-rose-600 text-xs mt-3 flex items-center"><ShieldAlert className="w-4 h-4 mr-1"/>{errorMsg}</p>}
    </div>
  );
}
