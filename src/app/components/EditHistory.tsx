'use client';

import { CommentaryEdit } from '@/lib/types/commentary';
import { marked } from 'marked';
import { format } from 'date-fns';

interface EditHistoryProps {
  edits: CommentaryEdit[];
  onClose: () => void;
}

export default function EditHistory({ edits, onClose }: EditHistoryProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit History</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4">
          {edits.length === 0 ? (
            <p className="text-gray-500 italic">No edit history available.</p>
          ) : (
            <div className="space-y-6">
              {edits.map((edit, index) => (
                <div key={edit.id} className="border-l-4 border-blue-600 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold">{edit.author.displayName}</span>
                      <span className="text-gray-500 ml-2">
                        {format(
                          (edit.timestamp as any)?.seconds ?
                            new Date((edit.timestamp as any).seconds * 1000) :
                            edit.timestamp,
                          'MMM d, yyyy h:mm a'
                        )}
                      </span>
                      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                        edit.author.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                        edit.author.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                        edit.author.role === 'scholar' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {edit.author.role}
                      </span>
                    </div>
                  </div>
                  
                  {edit.summary && (
                    <p className="text-gray-600 text-sm mb-2">
                      Summary: {edit.summary}
                    </p>
                  )}
                  
                  <div className="bg-gray-50 rounded p-4 prose max-w-none text-sm">
                    <div dangerouslySetInnerHTML={{ __html: marked(edit.content) }} />
                  </div>
                  
                  {index < edits.length - 1 && (
                    <div className="mt-4 mb-2 border-t border-dashed"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 