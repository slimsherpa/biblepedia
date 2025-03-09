'use client';

import { useState } from 'react';
import { UserProfile } from '@/lib/types/user';

interface ProfileEditorProps {
  section: 'academicHistory' | 'workHistory' | 'achievements' | 'websites' | 'socialMedia';
  profile: UserProfile;
  onUpdate: (updates: Partial<UserProfile>) => void;
}

interface EditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
  section: ProfileEditorProps['section'];
}

function EditorModal({ isOpen, onClose, onSave, initialData, section }: EditorModalProps) {
  const [formData, setFormData] = useState(initialData || getEmptyForm(section));

  if (!isOpen) return null;

  function getEmptyForm(section: ProfileEditorProps['section']) {
    switch (section) {
      case 'academicHistory':
        return {
          institution: '',
          degree: '',
          field: '',
          graduationYear: ''
        };
      case 'workHistory':
        return {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: ''
        };
      case 'achievements':
        return {
          title: '',
          date: '',
          description: ''
        };
      case 'websites':
        return '';
      case 'socialMedia':
        return {
          platform: '',
          url: ''
        };
      default:
        return {};
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">
          {initialData ? 'Edit' : 'Add'} {section.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
          onClose();
        }}>
          {section === 'academicHistory' && (
            <>
              <input
                type="text"
                placeholder="Institution"
                value={formData.institution}
                onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Degree"
                value={formData.degree}
                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Field of Study"
                value={formData.field}
                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Graduation Year"
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
            </>
          )}

          {section === 'workHistory' && (
            <>
              <input
                type="text"
                placeholder="Company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="End Date (leave empty if current)"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded mb-2"
                rows={3}
              />
            </>
          )}

          {section === 'achievements' && (
            <>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                placeholder="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded mb-2"
                rows={3}
              />
            </>
          )}

          {section === 'websites' && (
            <input
              type="url"
              placeholder="Website URL"
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              className="w-full p-2 border rounded mb-2"
            />
          )}

          {section === 'socialMedia' && (
            <>
              <input
                type="text"
                placeholder="Platform (e.g., Twitter, LinkedIn)"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="url"
                placeholder="Profile URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full p-2 border rounded mb-2"
              />
            </>
          )}

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProfileEditor({ section, profile, onUpdate }: ProfileEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newItem: any) => {
    const updatedItems = [...(profile[section] as any[])];
    if (editingIndex !== null) {
      updatedItems[editingIndex] = newItem;
    } else {
      updatedItems.push(newItem);
    }
    onUpdate({ [section]: updatedItems });
  };

  const handleDelete = (index: number) => {
    const updatedItems = [...(profile[section] as any[])];
    updatedItems.splice(index, 1);
    onUpdate({ [section]: updatedItems });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          {section.replace(/([A-Z])/g, ' $1').trim()}
        </h2>
        <button
          onClick={() => {
            setEditingIndex(null);
            setIsModalOpen(true);
          }}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add New
        </button>
      </div>

      <EditorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingIndex(null);
        }}
        onSave={handleAdd}
        initialData={editingIndex !== null ? profile[section][editingIndex] : undefined}
        section={section}
      />

      <div className="space-y-4">
        {(profile[section] as any[]).map((item, index) => (
          <div key={index} className="flex justify-between items-start border-l-4 border-blue-600 pl-4 py-2">
            <div>
              {section === 'academicHistory' && (
                <>
                  <h3 className="font-semibold">{item.institution}</h3>
                  <p>{item.degree} in {item.field}</p>
                  <p className="text-sm text-gray-500">Graduated {item.graduationYear}</p>
                </>
              )}
              {section === 'workHistory' && (
                <>
                  <h3 className="font-semibold">{item.company}</h3>
                  <p>{item.position}</p>
                  <p className="text-sm text-gray-500">{item.startDate} - {item.endDate || 'Present'}</p>
                  <p className="text-sm mt-1">{item.description}</p>
                </>
              )}
              {section === 'achievements' && (
                <>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-500">{item.date}</p>
                  <p className="text-sm mt-1">{item.description}</p>
                </>
              )}
              {section === 'websites' && (
                <a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                  {item}
                </a>
              )}
              {section === 'socialMedia' && (
                <>
                  <h3 className="font-semibold">{item.platform}</h3>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                    {item.url}
                  </a>
                </>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(index)}
                className="text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(index)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 