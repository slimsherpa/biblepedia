 'use client';

import { useAuth } from "@/lib/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import Link from 'next/link';

interface HeaderProps {
  version?: string;
  onVersionChange?: (version: string) => void;
  versions?: { id: string; name: string; language: string; }[];
  loading?: boolean;
}

const ROLE_BADGES = {
  superadmin: { label: 'Super Admin', class: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', class: 'bg-blue-100 text-blue-800' },
  scholar: { label: 'Scholar', class: 'bg-green-100 text-green-800' },
  user: { label: 'User', class: 'bg-gray-100 text-gray-800' }
};

export default function Header({ 
  version = 'en-nrsv',
  onVersionChange = () => {},
  versions = [],
  loading = false
}: HeaderProps) {
  const { user, userProfile, signInWithGoogle, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-gradient-to-r from-blue-800 to-indigo-900 text-white shadow-md">
      <div className="w-full px-6 flex items-center justify-between h-16">
        <div className="flex-shrink-0">
          <div className="biblepedia-logo">
            <h1>biblepedia.io</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2">
            <label htmlFor="version-select" className="text-blue-100 text-sm whitespace-nowrap">
              Version:
            </label>
            <select
              id="version-select"
              value={version}
              onChange={(e) => onVersionChange(e.target.value)}
              className="bg-white/10 border border-blue-400 text-white rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-300 w-[200px]"
              disabled={loading}
            >
              {loading ? (
                <option>Loading...</option>
              ) : (
                versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.language})
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div className="relative">
            {user ? (
              <div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-colors"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 text-sm font-medium">
                      {user.email?.[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm">{user.displayName || 'Expert Login'}</span>
                </button>

                {isDropdownOpen && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50"
                    ref={dropdownRef}
                  >
                    {/* User Info */}
                    <div className="px-4 py-2 border-b">
                      <div className="text-sm font-medium text-gray-900">
                        {userProfile?.displayName || 'Anonymous'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                      </div>
                    </div>

                    {/* Admin Controls */}
                    {userProfile && ['superadmin', 'admin'].includes(userProfile.role) && (
                      <>
                        <div className="border-b"></div>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          Admin Control Center
                        </Link>
                      </>
                    )}

                    {/* Profile Link */}
                    <div className="border-b"></div>
                    <Link
                      href={`/profile/${user.uid}`}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      View Profile
                    </Link>

                    {/* Mobile Version Selector */}
                    <div className="sm:hidden px-4 py-2 border-t">
                      <label htmlFor="mobile-version-select" className="block text-xs text-gray-500 mb-1">
                        Bible Version
                      </label>
                      <select
                        id="mobile-version-select"
                        value={version}
                        onChange={(e) => onVersionChange(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-700 rounded-md px-2 py-1 text-sm"
                        disabled={loading}
                      >
                        {loading ? (
                          <option>Loading...</option>
                        ) : (
                          versions.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="border-t"></div>
                    <button 
                      onClick={() => {
                        signOut();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md hover:bg-white/20 transition-colors"
              >
                <span className="text-sm">Expert Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 