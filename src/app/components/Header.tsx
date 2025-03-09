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
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex-shrink-0">
          <div className="biblepedia-logo">
            <h1 className="font-biblepedia">biblepedia.io</h1>
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
          
          <div className="relative" ref={dropdownRef}>
            {user ? (
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {user.photoURL && (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Expert profile'} 
                    className="w-6 h-6 rounded-full border border-white/50"
                  />
                )}
                <span className="text-sm font-medium hidden sm:inline">
                  {user.displayName?.split(' ')[0] || 'Expert'}
                </span>
                <svg 
                  className={`w-4 h-4 opacity-70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <button 
                onClick={() => signInWithGoogle()}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm6.604 16.274h-1.227v-.975h-1.226v1.95h1.226v.975h1.227v-1.95zm-3.679 0h-1.227v-.975h-1.227v1.95h1.227v.975h1.227v-1.95zm-3.679 0h-1.227v-.975H8.792v1.95h1.227v.975h1.227v-1.95z"/>
                </svg>
                <span className="text-sm font-medium hidden sm:inline">Expert Login</span>
              </button>
            )}
            
            {/* Dropdown menu */}
            {user && isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg py-1 z-50 animate-fadeIn">
                <div className="px-4 py-2 border-b">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{user.displayName}</p>
                    {userProfile && (
                      <span className={`text-xs px-2 py-1 rounded-full ${ROLE_BADGES[userProfile.role].class}`}>
                        {ROLE_BADGES[userProfile.role].label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                </div>

                {/* Profile Link */}
                <Link 
                  href={`/profile/${user.uid}`}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  View Profile
                </Link>

                {/* Admin Controls - Only visible to admins */}
                {userProfile && ['superadmin', 'admin'].includes(userProfile.role) && (
                  <>
                    <div className="border-t"></div>
                    <Link 
                      href="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Admin Control Center
                    </Link>
                  </>
                )}

                {/* Mobile-only version selector */}
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
        </div>
      </div>
    </header>
  );
} 