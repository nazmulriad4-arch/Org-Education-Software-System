import React, { useState } from 'react';
import { 
  UserPlus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export interface UserItem {
  id: string; // Used as the identifier / User Email / Username
  name: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[]; // e.g. ['Exam', 'Team', 'Administration']
  blocked?: boolean;
}

interface UserManagementProps {
  usersList: UserItem[];
  setUsersList: React.Dispatch<React.SetStateAction<UserItem[]>>;
  currentUser: UserItem;
}

interface PermissionNode {
  id: string;
  label: string;
  subItems?: PermissionNode[];
}

const NAVIGATION_TREE: Record<string, { label: string; items: PermissionNode[] }> = {
  'Administration': {
    label: 'Administration Module',
    items: [
      { id: 'teacher-management', label: 'Teacher Management' },
      { id: 'user-management', label: 'User Management' },
    ]
  },
  'Exam': {
    label: 'Exam Module',
    items: [
      {
        id: 'online-script-eval',
        label: 'Online Script Evaluation',
        subItems: [
          { id: 'admin-dash', label: 'Admin Dashboard' },
          { id: 'examiner-perm', label: 'Examiner Permission' },
          { id: 'eval-report', label: 'Evaluation Report' },
          { id: 'admin-review', label: 'Admin Review' },
          { id: 'exam-perm', label: 'Exam Permission' },
          { id: 'admin-review-req', label: 'Review Request' },
          { id: 'teacher-user-perm', label: 'Assign Teacher User Permission' },
        ]
      },
      {
        id: 'ai-script-eval',
        label: 'AI Script Evaluation',
        subItems: [
          { id: 'ai-eval', label: 'AI Evaluation' },
          { id: 'ai-review', label: 'Review' },
          { id: 'eval-history', label: 'Evaluation History' },
        ]
      }
    ]
  },
  'Team': {
    label: 'Team Module',
    items: [
      { id: 'team-hr', label: 'Hr' },
      {
        id: 'team-account',
        label: 'My Account',
        subItems: [
          { id: 'my-profile', label: 'My Profile' },
          { id: 'my-attendance', label: 'My Attendance' },
          { id: 'my-notice', label: 'My Notice' },
        ]
      },
      {
        id: 'team-apply',
        label: 'Apply For',
        subItems: [
          { id: 'attendance-adjustment', label: 'Attendance Adjustment' },
          { id: 'leave', label: 'Leave' },
        ]
      },
      {
        id: 'team-management',
        label: 'Member Management',
        subItems: [
          { id: 'member-directory', label: 'Member Directory' },
        ]
      }
    ]
  }
};

export default function UserManagementPanel({ usersList, setUsersList, currentUser }: UserManagementProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({});
  
  // Expanded modules state for visual layout
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'Administration': true,
    'Exam': true,
    'Team': true
  });

  // Permissions Modal States
  const [permissionModalUser, setPermissionModalUser] = useState<UserItem | null>(null);
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);
  const [expandedModalModules, setExpandedModalModules] = useState<Record<string, boolean>>({
    'Administration': true,
    'Exam': true,
    'Team': true
  });

  // Custom delete confirmation modal state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserItem | null>(null);

  // Form states
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [permissions, setPermissions] = useState<string[]>(['Exam']);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const togglePasswordVisibility = (id: string) => {
    setShowPasswordMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleModuleAccordion = (mod: string) => {
    setExpandedModules(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const resetForm = () => {
    setUserId('');
    setName('');
    setPassword('');
    setRole('User');
    setPermissions(['Exam']);
    setEditingUserId(null);
    setErrorMsg('');
  };

  const handleEditClick = (user: UserItem) => {
    if (!canEditUser(user)) {
      setErrorMsg('You do not have permission to edit this user.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    setEditingUserId(user.id);
    setUserId(user.id);
    setName(user.name);
    setPassword(user.password || '');
    setRole(user.role);
    setPermissions(user.permissions || []);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTogglePermission = (id: string, type: 'module' | 'item' | 'subitem', parentId?: string, grandParentId?: string) => {
    setPermissions(prev => {
      let next = [...prev];
      const isCurrentlyChecked = prev.includes(id);

      if (type === 'module') {
        if (isCurrentlyChecked) {
          // Unchecking a module -> remove the module and all its items and sub-items
          next = next.filter(p => p !== id);
          const config = NAVIGATION_TREE[id];
          if (config) {
            config.items.forEach(item => {
              next = next.filter(p => p !== item.id);
              if (item.subItems) {
                item.subItems.forEach(sub => {
                  next = next.filter(p => p !== sub.id);
                });
              }
            });
          }
        } else {
          // Checking a module -> add module and automatically check all items and sub-items
          next.push(id);
          const config = NAVIGATION_TREE[id];
          if (config) {
            config.items.forEach(item => {
              if (!next.includes(item.id)) next.push(item.id);
              if (item.subItems) {
                item.subItems.forEach(sub => {
                  if (!next.includes(sub.id)) next.push(sub.id);
                });
              }
            });
          }
        }
      } else if (type === 'item') {
        if (isCurrentlyChecked) {
          // Unchecking a sidebar item -> remove item and all its sub-items
          next = next.filter(p => p !== id);
          if (parentId) {
            const moduleConfig = NAVIGATION_TREE[parentId];
            const itemConfig = moduleConfig?.items.find(i => i.id === id);
            if (itemConfig?.subItems) {
              itemConfig.subItems.forEach(sub => {
                next = next.filter(p => p !== sub.id);
              });
            }
          }
        } else {
          // Checking a sidebar item -> add item, its parent module, and all its sub-items
          next.push(id);
          if (parentId && !next.includes(parentId)) {
            next.push(parentId);
          }
          if (parentId) {
            const moduleConfig = NAVIGATION_TREE[parentId];
            const itemConfig = moduleConfig?.items.find(i => i.id === id);
            if (itemConfig?.subItems) {
              itemConfig.subItems.forEach(sub => {
                if (!next.includes(sub.id)) next.push(sub.id);
              });
            }
          }
        }
      } else if (type === 'subitem') {
        if (isCurrentlyChecked) {
          // Unchecking a sub-item -> just remove it
          next = next.filter(p => p !== id);
        } else {
          // Checking a sub-item -> add it, its parent item, and its grandparent module
          next.push(id);
          if (parentId && !next.includes(parentId)) {
            next.push(parentId);
          }
          if (grandParentId && !next.includes(grandParentId)) {
            next.push(grandParentId);
          }
        }
      }

      return Array.from(new Set(next));
    });
  };

  const handleManagePermissionsClick = (user: UserItem) => {
    setPermissionModalUser(user);
    setTempPermissions(user.permissions || []);
  };

  const handleSaveModalPermissions = () => {
    if (!permissionModalUser) return;
    setUsersList(prev => prev.map(u => {
      if (u.id.toLowerCase() === permissionModalUser.id.toLowerCase()) {
        return {
          ...u,
          permissions: tempPermissions
        };
      }
      return u;
    }));
    setPermissionModalUser(null);
    setSuccessMsg(`Permissions updated for "${permissionModalUser.name}"`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleToggleModalPermission = (id: string, type: 'module' | 'item' | 'subitem', parentId?: string, grandParentId?: string) => {
    setTempPermissions(prev => {
      let next = [...prev];
      const isCurrentlyChecked = prev.includes(id);

      if (type === 'module') {
        if (isCurrentlyChecked) {
          next = next.filter(p => p !== id);
          const config = NAVIGATION_TREE[id];
          if (config) {
            config.items.forEach(item => {
              next = next.filter(p => p !== item.id);
              if (item.subItems) {
                item.subItems.forEach(sub => {
                  next = next.filter(p => p !== sub.id);
                });
              }
            });
          }
        } else {
          next.push(id);
          const config = NAVIGATION_TREE[id];
          if (config) {
            config.items.forEach(item => {
              if (!next.includes(item.id)) next.push(item.id);
              if (item.subItems) {
                item.subItems.forEach(sub => {
                  if (!next.includes(sub.id)) next.push(sub.id);
                });
              }
            });
          }
        }
      } else if (type === 'item') {
        if (isCurrentlyChecked) {
          next = next.filter(p => p !== id);
          if (parentId) {
            const moduleConfig = NAVIGATION_TREE[parentId];
            const itemConfig = moduleConfig?.items.find(i => i.id === id);
            if (itemConfig?.subItems) {
              itemConfig.subItems.forEach(sub => {
                next = next.filter(p => p !== sub.id);
              });
            }
          }
        } else {
          next.push(id);
          if (parentId && !next.includes(parentId)) {
            next.push(parentId);
          }
          if (parentId) {
            const moduleConfig = NAVIGATION_TREE[parentId];
            const itemConfig = moduleConfig?.items.find(i => i.id === id);
            if (itemConfig?.subItems) {
              itemConfig.subItems.forEach(sub => {
                if (!next.includes(sub.id)) next.push(sub.id);
              });
            }
          }
        }
      } else if (type === 'subitem') {
        if (isCurrentlyChecked) {
          next = next.filter(p => p !== id);
        } else {
          next.push(id);
          if (parentId && !next.includes(parentId)) {
            next.push(parentId);
          }
          if (grandParentId && !next.includes(grandParentId)) {
            next.push(grandParentId);
          }
        }
      }

      return Array.from(new Set(next));
    });
  };

  const currentUserRole = (currentUser && (currentUser.id?.toLowerCase() === 'nazmulriad4@gmail.com' || currentUser.id?.toLowerCase() === 'nazmul.2853@udvash.net'))
    ? 'Owner'
    : (currentUser?.role || '');

  const canEditUser = (userToEdit: UserItem) => {
    if (!currentUser) return false;
    if (currentUserRole === 'Owner') {
      return true; // Owner can edit anyone
    }
    if (currentUserRole === 'Admin') {
      // Admin can edit Users or themselves, but not other Admins or Owners
      return (userToEdit.role === 'User' || userToEdit.id.toLowerCase() === currentUser.id.toLowerCase());
    }
    return false;
  };

  const canDeleteUser = (userToDelete: UserItem) => {
    if (!currentUser) return false;
    if (currentUserRole === 'Owner') {
      return userToDelete.id.toLowerCase() !== currentUser.id.toLowerCase(); // Owner can delete anyone except themselves
    }
    if (currentUserRole === 'Admin') {
      // Admin can only delete users with role 'User'
      return userToDelete.role === 'User' && userToDelete.id.toLowerCase() !== currentUser.id.toLowerCase();
    }
    return false;
  };

  const isManagementAllowed = currentUser && (currentUserRole === 'Owner' || currentUserRole === 'Admin');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isManagementAllowed) {
      setErrorMsg('Unauthorized: Only Owners and Admins can add or edit users.');
      return;
    }

    if (!userId.trim()) {
      setErrorMsg('User ID / Email is required.');
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Full Name is required.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('Password is required.');
      return;
    }
    if (permissions.length === 0) {
      setErrorMsg('Please select at least one Menu Access permission.');
      return;
    }

    const trimmedId = userId.trim();

    if (editingUserId) {
      // Check if trying to change to an ID that already exists (other than the edited user)
      if (trimmedId !== editingUserId && usersList.some(u => u.id.toLowerCase() === trimmedId.toLowerCase())) {
        setErrorMsg('A user with this ID / Email already exists.');
        return;
      }

      // Enforce Admin cannot change Owner role or details
      const targetUser = usersList.find(u => u.id === editingUserId);
      if (currentUserRole === 'Admin' && targetUser && targetUser.role === 'Owner' && role !== 'Owner') {
        setErrorMsg('Security Block: Administrators cannot change the Owner role.');
        return;
      }

      setUsersList(prev => prev.map(u => {
        if (u.id === editingUserId) {
          return {
            id: trimmedId,
            name: name.trim(),
            email: trimmedId,
            password: password,
            role: role,
            permissions: permissions
          };
        }
        return u;
      }));

      setSuccessMsg('User updated successfully!');
      resetForm();
    } else {
      // Check duplicate ID
      if (usersList.some(u => u.id.toLowerCase() === trimmedId.toLowerCase())) {
        setErrorMsg('A user with this ID / Email already exists.');
        return;
      }

      // Enforce Admin cannot create Owner accounts
      if (currentUserRole === 'Admin' && role === 'Owner') {
        setErrorMsg('Security Block: Administrators cannot create Owner accounts.');
        return;
      }

      const newUser: UserItem = {
        id: trimmedId,
        name: name.trim(),
        email: trimmedId,
        password: password,
        role: role,
        permissions: permissions
      };

      setUsersList(prev => [...prev, newUser]);
      setSuccessMsg('User added successfully!');
      resetForm();
    }

    // Hide success message after 3s
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteUser = (id: string) => {
    const userToDelete = usersList.find(u => u.id === id);
    if (!userToDelete) return;

    if (!canDeleteUser(userToDelete)) {
      setErrorMsg('Unauthorized: You do not have permission to delete this user.');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    setDeleteConfirmUser(userToDelete);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmUser) return;
    setUsersList(prev => prev.filter(u => u.id !== deleteConfirmUser.id));
    setSuccessMsg(`User "${deleteConfirmUser.id}" has been permanently deleted.`);
    setTimeout(() => setSuccessMsg(''), 4000);
    setDeleteConfirmUser(null);
  };

  return (
    <div className="p-6 bg-gray-50/50 min-h-screen text-left font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center">
              <span>User Management</span>
              <span className="ml-3 px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 border border-blue-200">
                Logged in: {currentUser?.role || 'User'}
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">Manage system logins, passwords, roles, and granular sub-menu navigation access.</p>
          </div>
          {editingUserId && (
            <button 
              onClick={resetForm}
              className="mt-2 sm:mt-0 flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-xs font-semibold transition-all"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Cancel Edit
            </button>
          )}
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded text-xs font-semibold flex items-center shadow-xs">
            <Check className="w-4 h-4 mr-2" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded text-xs font-semibold flex items-center shadow-xs">
            <ShieldAlert className="w-4 h-4 mr-2" />
            {errorMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Create / Edit Form Card */}
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden h-fit">
            <div className="bg-[#002d5b] text-white px-4 py-3.5 text-sm font-bold flex items-center justify-between">
              <span>{editingUserId ? 'Edit User Details' : 'Add New User'}</span>
              <UserPlus className="w-4 h-4" />
            </div>
            
            {isManagementAllowed ? (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* User ID / Email */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">User ID / Login Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. user@udvash.net"
                      value={userId}
                      disabled={!!editingUserId} // Disable modifying ID on edit to maintain Firestore key mapping
                      onChange={(e) => setUserId(e.target.value)}
                      className={`w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800 ${editingUserId ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="e.g. M. Nazmul Alam"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Set account password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400">Plain text password for user administration.</p>
                </div>

                {/* Role selection strictly Owner, Admin, User */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">User Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-gray-800"
                  >
                    {currentUserRole === 'Owner' && <option value="Owner">Owner</option>}
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                  <p className="text-[10px] text-gray-400">
                    {currentUserRole === 'Owner' 
                      ? 'Owners can create/delete anyone. Admins can create and manage User accounts.'
                      : 'Admins can create and manage Admin or User accounts.'}
                  </p>
                </div>

                {/* Granular Menu & Sub-menu Access checkboxes */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700">Menu Navigation Access</label>
                  <div className="border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden bg-gray-50 text-xs">
                    
                    {Object.entries(NAVIGATION_TREE).map(([modId, modData]) => {
                      const isModExpanded = expandedModules[modId];
                      const isModChecked = permissions.includes(modId);
                      
                      return (
                        <div key={modId} className="bg-white">
                          {/* Module Accordion Header */}
                          <div className="bg-gray-50 flex items-center justify-between px-3 py-2 border-b border-gray-100">
                            <label className="flex items-center space-x-2 font-bold text-gray-800 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isModChecked}
                                onChange={() => handleTogglePermission(modId, 'module')}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                              />
                              <span>{modData.label}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => toggleModuleAccordion(modId)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500"
                            >
                              {isModExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* Module Items list */}
                          {isModExpanded && (
                            <div className="px-3 py-1.5 space-y-2.5 bg-white border-b border-gray-100">
                              {modData.items.map(item => {
                                const isItemChecked = permissions.includes(item.id);
                                
                                return (
                                  <div key={item.id} className="pl-3 space-y-1.5">
                                    {/* Sidebar main item */}
                                    <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={isItemChecked}
                                        onChange={() => handleTogglePermission(item.id, 'item', modId)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                                      />
                                      <span className="text-gray-800">{item.label}</span>
                                    </label>

                                    {/* Sub Items */}
                                    {item.subItems && item.subItems.length > 0 && (
                                      <div className="pl-5 space-y-1.5 border-l border-gray-100 py-0.5">
                                        {item.subItems.map(sub => {
                                          const isSubChecked = permissions.includes(sub.id);
                                          
                                          return (
                                            <label key={sub.id} className="flex items-center space-x-2 text-[11px] text-gray-600 cursor-pointer">
                                              <input
                                                type="checkbox"
                                                checked={isSubChecked}
                                                onChange={() => handleTogglePermission(sub.id, 'subitem', item.id, modId)}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                                              />
                                              <span>{sub.label}</span>
                                            </label>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                  </div>
                  <p className="text-[10px] text-gray-400">Selecting any item or sub-item will automatically grant access to its parent module so the user can navigate to it.</p>
                </div>

                <div className="pt-2 flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-[#4395d1] hover:bg-[#3484c0] text-white py-2 rounded text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>{editingUserId ? 'Update User' : 'Save User'}</span>
                  </button>
                  {editingUserId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded text-xs font-bold transition-all border border-gray-300 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-6 text-center text-gray-500 space-y-3">
                <Lock className="w-12 h-12 text-gray-300 mx-auto" />
                <div className="text-xs font-bold text-gray-700">Access Restricted</div>
                <p className="text-[11px] text-gray-400">
                  Standard Users do not have permission to create or edit accounts. Please consult the system Owner or Administrator.
                </p>
              </div>
            )}
          </div>

          {/* Users List Table Card */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
            {/* Top dark blue header bar to match image */}
            <div className="bg-[#002d5b] text-white px-4 py-3 text-sm font-bold flex items-center justify-between">
              <span className="flex items-center">
                <User className="w-4 h-4 mr-2 text-white/90" />
                Management List
              </span>
              <ShieldCheck className="w-4 h-4 text-white/90" />
            </div>

            {/* Inner body content */}
            <div className="p-4 flex-1 flex flex-col space-y-4">
              {/* Small title header row inside card, matching image */}
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 border-b border-gray-100 pb-2">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-semibold text-gray-600">Management List</span>
              </div>

              <div className="overflow-x-auto flex-1 border border-gray-100 rounded">
                <table className="w-full border-collapse text-left text-xs text-gray-700">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200 uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-3 font-semibold">USER INFO</th>
                      <th className="px-4 py-3 font-semibold">ACCESS</th>
                      <th className="px-4 py-3 font-semibold">ROLE/STATUS</th>
                      <th className="px-4 py-3 font-semibold text-center">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {usersList.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic font-medium">
                          No users registered. Add a user from the panel on the left.
                        </td>
                      </tr>
                    ) : (
                      usersList.map((user) => {
                        const userEditable = canEditUser(user);
                        const userDeletable = canDeleteUser(user);
                        
                        // "All Access" if user is Owner or has all 3 major modules
                        const isAllAccess = user.role === 'Owner' || 
                          (user.permissions && 
                           user.permissions.includes('Exam') && 
                           user.permissions.includes('Team') && 
                           user.permissions.includes('Administration'));

                        const isBlocked = !!user.blocked;

                        return (
                          <tr key={user.id} className="hover:bg-gray-50/40 transition-colors">
                            {/* USER INFO COLUMN */}
                            <td className="px-4 py-3">
                              <div 
                                onClick={() => userEditable && handleEditClick(user)}
                                className={`group flex flex-col ${userEditable ? 'cursor-pointer' : ''}`}
                                title={userEditable ? "Click to edit user details in the left panel" : ""}
                              >
                                <div className="flex items-center space-x-1">
                                  <span className="font-bold text-gray-900 text-xs group-hover:text-[#3484c0] transition-colors">
                                    {user.name}
                                  </span>
                                  {userEditable && (
                                    <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-all ml-1" />
                                  )}
                                </div>
                                <div className="text-gray-400 text-[10.5px] mt-0.5 flex items-center space-x-1.5">
                                  <span>{user.id}</span>
                                  <span className="text-gray-300">|</span>
                                  <span className="font-mono bg-gray-50 px-1 py-0.2 rounded border border-gray-100 text-[10px]">
                                    {showPasswordMap[user.id] ? (user.password || '••••••••') : '••••••••'}
                                  </span>
                                  <button 
                                    type="button" 
                                    onClick={(e) => {
                                      e.stopPropagation(); // prevent edit trigger
                                      togglePasswordVisibility(user.id);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
                                    title={showPasswordMap[user.id] ? "Hide Password" : "Show Password"}
                                  >
                                    {showPasswordMap[user.id] ? (
                                      <EyeOff className="w-3 h-3" />
                                    ) : (
                                      <Eye className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </td>

                            {/* ACCESS COLUMN */}
                            <td className="px-4 py-3">
                              {isAllAccess ? (
                                <span className="inline-flex items-center px-2.5 py-1 rounded bg-blue-50 text-[#3484c0] border border-blue-100 text-[10.5px] font-semibold shadow-2xs">
                                  All Access
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleManagePermissionsClick(user)}
                                  className="inline-flex items-center space-x-2 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-2.5 py-1.5 rounded shadow-2xs text-[10.5px] text-gray-700 transition-all cursor-pointer font-medium"
                                >
                                  <span className="flex items-center text-gray-500 font-semibold">
                                    <svg className="w-3.5 h-3.5 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Manage Menu Permissions
                                  </span>
                                  <span className="bg-gray-100 border border-gray-200 px-1 py-0.2 rounded font-mono text-[10px] font-bold text-gray-600">
                                    {user.permissions ? user.permissions.length : 0}
                                  </span>
                                </button>
                              )}
                            </td>

                            {/* ROLE/STATUS COLUMN */}
                            <td className="px-4 py-3">
                              <div className="flex flex-col space-y-1 items-start">
                                {/* Role Badge */}
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  user.role === 'Owner' 
                                    ? 'bg-red-50 text-red-600 border border-red-100' 
                                    : user.role === 'Admin'
                                    ? 'bg-blue-50 text-blue-600 border border-blue-100'
                                    : 'bg-gray-50 text-gray-600 border border-gray-100'
                                }`}>
                                  {user.role}
                                </span>
                                
                                {/* Status Badge (interactive click toggle if permitted) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (canEditUser(user)) {
                                      setUsersList(prev => prev.map(u => u.id === user.id ? { ...u, blocked: !u.blocked } : u));
                                    }
                                  }}
                                  disabled={!canEditUser(user)}
                                  className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${
                                    isBlocked 
                                      ? 'bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100' 
                                      : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                  } ${canEditUser(user) ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                                  title={canEditUser(user) ? "Click to toggle Status" : "Status toggling restricted"}
                                >
                                  {isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                </button>
                              </div>
                            </td>

                            {/* ACTION COLUMN */}
                            <td className="px-4 py-3 text-center">
                              {userDeletable ? (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-1.5 rounded text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer shadow-2xs"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span className="text-gray-400 italic text-[11px] font-medium">Immutable</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notice line at bottom of table card as pictured */}
              <div className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 p-2.5 rounded font-medium">
                Notice: Newly added authenticated users will be able to log in starting from the login page. Blocked users cannot log in.
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Interactive Permission Modal */}
      {permissionModalUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#002d5b] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold flex items-center">
                  <ShieldCheck className="w-4 h-4 mr-2 text-white" />
                  Manage Menu Permissions
                </h3>
                <p className="text-[11px] text-white/85 mt-0.5">
                  Configure granular navigation rights for <span className="font-bold underline">{permissionModalUser.name}</span> ({permissionModalUser.id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable permission checkboxes) */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-gray-50 text-xs">
              <div className="border border-gray-200 rounded divide-y divide-gray-100 overflow-hidden bg-white shadow-xs">
                
                {Object.entries(NAVIGATION_TREE).map(([modId, modData]) => {
                  const isModChecked = tempPermissions.includes(modId);
                  const isModExpanded = expandedModalModules[modId];
                  
                  return (
                    <div key={modId} className="bg-white">
                      {/* Module Header */}
                      <div className="bg-gray-50 flex items-center justify-between px-3 py-2 border-b border-gray-100">
                        <label className="flex items-center space-x-2 font-bold text-gray-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isModChecked}
                            onChange={() => handleToggleModalPermission(modId, 'module')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>{modData.label}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setExpandedModalModules(prev => ({ ...prev, [modId]: !prev[modId] }))}
                          className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-500 cursor-pointer"
                        >
                          {isModExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      {/* Module Items list */}
                      {isModExpanded && (
                        <div className="px-3 py-1.5 space-y-2.5 bg-white border-b border-gray-100">
                          {modData.items.map(item => {
                            const isItemChecked = tempPermissions.includes(item.id);
                            
                            return (
                              <div key={item.id} className="pl-3 space-y-1.5">
                                {/* Sidebar main item */}
                                <label className="flex items-center space-x-2 font-semibold text-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={isItemChecked}
                                    onChange={() => handleToggleModalPermission(item.id, 'item', modId)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                                  />
                                  <span className="text-gray-800">{item.label}</span>
                                </label>

                                {/* Sub Items */}
                                {item.subItems && item.subItems.length > 0 && (
                                  <div className="pl-5 space-y-1.5 border-l border-gray-100 py-0.5">
                                    {item.subItems.map(sub => {
                                      const isSubChecked = tempPermissions.includes(sub.id);
                                      
                                      return (
                                        <label key={sub.id} className="flex items-center space-x-2 text-[11px] text-gray-600 cursor-pointer">
                                          <input
                                            type="checkbox"
                                            checked={isSubChecked}
                                            onChange={() => handleToggleModalPermission(sub.id, 'subitem', item.id, modId)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3 cursor-pointer"
                                          />
                                          <span>{sub.label}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-medium leading-relaxed">
                Selecting any item or sub-item will automatically grant access to its parent module so the user can navigate to it.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setPermissionModalUser(null)}
                className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300 rounded text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModalPermissions}
                className="bg-[#4395d1] hover:bg-[#3484c0] text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Check className="w-3.5 h-3.5 mr-1 text-white" />
                Save Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Interactive Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full flex flex-col overflow-hidden animate-in fade-in duration-200 text-xs">
            
            {/* Modal Header */}
            <div className="bg-rose-600 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center">
                <ShieldAlert className="w-4 h-4 mr-2 text-white" />
                স্থায়ীভাবে অ্যাকাউন্ট ডিলিট করুন (Permanent Deletion)
              </h3>
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 bg-gray-50 text-gray-700 leading-relaxed text-xs">
              <p className="font-semibold text-gray-900">
                আপনি কি নিশ্চিত যে আপনি {deleteConfirmUser.role} <span className="text-rose-600 font-bold">"{deleteConfirmUser.name}"</span> ({deleteConfirmUser.id}) কে স্থায়ীভাবে ডিলিট করতে চান?
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-md p-3 text-rose-800 text-[11px] font-medium space-y-1">
                <p>⚠️ <strong>সতর্কতা:</strong> এটি করলে আইডিটি চিরতরে ডিলিট হয়ে যাবে এবং এই আইডি দিয়ে আর কখনো সিস্টেমে লগ ইন করা যাবে না। এই পরিবর্তনটি অপরিবর্তনযোগ্য।</p>
                <p className="mt-1">⚠️ <strong>Warning:</strong> This action is permanent and irreversible. This account will never be able to access the system again.</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex items-center justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="bg-white hover:bg-gray-100 text-gray-700 px-4 py-2 border border-gray-300 rounded text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Cancel / বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1 text-white" />
                Confirm Delete / নিশ্চিত করুন
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
