'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserProfile, updateUserProfile } from '@/lib/firebase/userManagement';
import { UserProfile } from '@/lib/types/user';
import Link from 'next/link';
import ProfileEditor from '@/app/components/ProfileEditor';

const ROLE_BADGES = {
  superadmin: { label: 'Super Admin', class: 'bg-purple-100 text-purple-800' },
  admin: { label: 'Admin', class: 'bg-blue-100 text-blue-800' },
  scholar: { label: 'Scholar', class: 'bg-green-100 text-green-800' },
  user: { label: 'User', class: 'bg-gray-100 text-gray-800' }
};

export default function ProfilePage({ params }: { params: Promise<{ uid: string }> }) {
  const resolvedParams = use(params);
  const { user, userProfile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  const isOwnProfile = user?.uid === resolvedParams.uid;

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const profileData = await getUserProfile(resolvedParams.uid);
        if (!profileData) {
          setError('Profile not found');
          return;
        }
        setProfile(profileData);
        setEditedProfile(profileData);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [resolvedParams.uid]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      const success = await updateUserProfile(profile.uid, editedProfile);
      if (success) {
        setProfile({ ...profile, ...editedProfile });
        setIsEditing(false);
      } else {
        setError('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 py-1">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white shadow rounded-lg p-6">
            <h1 className="text-xl font-semibold text-red-600 mb-2">Error</h1>
            <p className="text-gray-600">{error || 'Profile not found'}</p>
            <Link href="/" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="relative h-32 bg-gradient-to-r from-blue-800 to-indigo-900">
            {profile.photoURL && (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="absolute bottom-0 left-6 transform translate-y-1/2 w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            )}
          </div>
          <div className="pt-16 pb-6 px-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.displayName}</h1>
                <p className="text-gray-600">{profile.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${ROLE_BADGES[profile.role].class}`}>
                {ROLE_BADGES[profile.role].label}
              </span>
            </div>
            {isOwnProfile && (
              <div className="flex justify-end">
                {isEditing ? (
                  <div className="space-x-2">
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedProfile(profile);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Content */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Bio Section */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
            {isEditing ? (
              <textarea
                value={editedProfile.bio || ''}
                onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                className="w-full p-2 border rounded-lg"
                rows={4}
                placeholder="Tell us about yourself..."
              />
            ) : (
              <p className="text-gray-600">{profile.bio || 'No bio provided'}</p>
            )}
          </section>

          {/* Editable Sections */}
          {isEditing ? (
            <>
              <ProfileEditor
                section="academicHistory"
                profile={editedProfile as UserProfile}
                onUpdate={(updates) => setEditedProfile({ ...editedProfile, ...updates })}
              />
              <div className="border-t my-8" />
              
              <ProfileEditor
                section="workHistory"
                profile={editedProfile as UserProfile}
                onUpdate={(updates) => setEditedProfile({ ...editedProfile, ...updates })}
              />
              <div className="border-t my-8" />
              
              <ProfileEditor
                section="achievements"
                profile={editedProfile as UserProfile}
                onUpdate={(updates) => setEditedProfile({ ...editedProfile, ...updates })}
              />
              <div className="border-t my-8" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfileEditor
                  section="websites"
                  profile={editedProfile as UserProfile}
                  onUpdate={(updates) => setEditedProfile({ ...editedProfile, ...updates })}
                />
                
                <ProfileEditor
                  section="socialMedia"
                  profile={editedProfile as UserProfile}
                  onUpdate={(updates) => setEditedProfile({ ...editedProfile, ...updates })}
                />
              </div>
            </>
          ) : (
            <>
              {/* Academic History */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Academic History</h2>
                {profile.academicHistory.length > 0 ? (
                  <div className="space-y-4">
                    {profile.academicHistory.map((item, index) => (
                      <div key={index} className="border-l-4 border-blue-600 pl-4">
                        <h3 className="font-semibold text-gray-900">{item.institution}</h3>
                        <p className="text-gray-600">{item.degree} in {item.field}</p>
                        <p className="text-gray-500">Graduated {item.graduationYear}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No academic history provided</p>
                )}
              </section>

              {/* Work History */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Work History</h2>
                {profile.workHistory.length > 0 ? (
                  <div className="space-y-4">
                    {profile.workHistory.map((item, index) => (
                      <div key={index} className="border-l-4 border-green-600 pl-4">
                        <h3 className="font-semibold text-gray-900">{item.company}</h3>
                        <p className="text-gray-600">{item.position}</p>
                        <p className="text-gray-500">
                          {item.startDate} - {item.endDate || 'Present'}
                        </p>
                        <p className="text-gray-600 mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No work history provided</p>
                )}
              </section>

              {/* Achievements */}
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievements</h2>
                {profile.achievements.length > 0 ? (
                  <div className="space-y-4">
                    {profile.achievements.map((achievement, index) => (
                      <div key={index} className="border-l-4 border-yellow-600 pl-4">
                        <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                        <p className="text-gray-500">{achievement.date}</p>
                        <p className="text-gray-600 mt-1">{achievement.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No achievements listed</p>
                )}
              </section>

              {/* Links Section */}
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Websites */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Websites</h3>
                    {profile.websites.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.websites.map((website, index) => (
                          <li key={index}>
                            <a
                              href={website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {website}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No websites listed</p>
                    )}
                  </div>

                  {/* Social Media */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Social Media</h3>
                    {profile.socialMedia.length > 0 ? (
                      <ul className="space-y-2">
                        {profile.socialMedia.map((social, index) => (
                          <li key={index}>
                            <a
                              href={social.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {social.platform}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 italic">No social media links</p>
                    )}
                  </div>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 