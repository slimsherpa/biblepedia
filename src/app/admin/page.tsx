'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { UserProfile, UserRole, canManageAdmins } from '@/lib/types/user';
import { getUsersByRole, updateUserRole } from '@/lib/firebase/userManagement';

export default function AdminPage() {
  const { userProfile } = useAuth();
  const router = useRouter();
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [scholars, setScholars] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not admin
    if (userProfile && !['superadmin', 'admin'].includes(userProfile.role)) {
      router.push('/');
    }
  }, [userProfile, router]);

  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        const [adminsList, scholarsList] = await Promise.all([
          getUsersByRole('admin'),
          getUsersByRole('scholar')
        ]);
        setAdmins(adminsList);
        setScholars(scholarsList);
        setError(null);
      } catch (err) {
        setError('Failed to load users');
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    }

    if (userProfile && ['superadmin', 'admin'].includes(userProfile.role)) {
      loadUsers();
    }
  }, [userProfile]);

  const handleRoleChange = async (targetUser: UserProfile, newRole: UserRole) => {
    if (!userProfile) return;

    try {
      const success = await updateUserRole(userProfile, targetUser.uid, newRole);
      if (success) {
        // Refresh the lists
        const [adminsList, scholarsList] = await Promise.all([
          getUsersByRole('admin'),
          getUsersByRole('scholar')
        ]);
        setAdmins(adminsList);
        setScholars(scholarsList);
      } else {
        setError('Failed to update user role');
      }
    } catch (err) {
      setError('Error updating user role');
      console.error('Error updating role:', err);
    }
  };

  if (!userProfile || !['superadmin', 'admin'].includes(userProfile.role)) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Control Center</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Admins Section - Only visible to superadmin */}
          {canManageAdmins(userProfile) && (
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Administrators</h2>
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.map((admin) => (
                      <tr key={admin.uid}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {admin.photoURL && (
                              <img 
                                src={admin.photoURL} 
                                alt="" 
                                className="h-8 w-8 rounded-full mr-3"
                              />
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {admin.displayName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {admin.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleRoleChange(admin, 'scholar')}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove Admin
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Scholars Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Approved Scholars</h2>
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scholars.map((scholar) => (
                    <tr key={scholar.uid}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {scholar.photoURL && (
                            <img 
                              src={scholar.photoURL} 
                              alt="" 
                              className="h-8 w-8 rounded-full mr-3"
                            />
                          )}
                          <div className="text-sm font-medium text-gray-900">
                            {scholar.displayName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {scholar.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {canManageAdmins(userProfile) && (
                          <button
                            onClick={() => handleRoleChange(scholar, 'admin')}
                            className="text-blue-600 hover:text-blue-800 mr-4"
                          >
                            Make Admin
                          </button>
                        )}
                        <button
                          onClick={() => handleRoleChange(scholar, 'user')}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove Scholar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
} 