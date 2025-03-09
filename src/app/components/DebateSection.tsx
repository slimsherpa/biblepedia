'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { DebatePost } from '@/lib/types/commentary';
import { addDebatePost, voteOnDebatePost } from '@/lib/firebase/commentaryManagement';
import { canAddCommentary } from '@/lib/types/user';
import { marked } from 'marked';
import { format } from 'date-fns';

interface DebateSectionProps {
  verseId: string;
  debate: DebatePost[];
  onClose: () => void;
  onUpdate: () => void;
}

export default function DebateSection({ verseId, debate, onClose, onUpdate }: DebateSectionProps) {
  const { userProfile } = useAuth();
  const [content, setContent] = useState('');
  const [references, setReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleAddReference = () => {
    if (newReference.trim()) {
      setReferences([...references, newReference.trim()]);
      setNewReference('');
    }
  };

  const handleRemoveReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!userProfile || !canAddCommentary(userProfile)) return;
    
    const success = await addDebatePost(
      verseId,
      content,
      references,
      userProfile,
      replyTo || undefined
    );

    if (success) {
      setContent('');
      setReferences([]);
      setReplyTo(null);
      onUpdate();
    }
  };

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!userProfile) return;
    
    const success = await voteOnDebatePost(
      verseId,
      postId,
      userProfile.uid,
      voteType
    );

    if (success) {
      onUpdate();
    }
  };

  const sortedDebate = [...debate].sort((a, b) => {
    const scoreA = a.votes.up.length - a.votes.down.length;
    const scoreB = b.votes.up.length - b.votes.down.length;
    if (scoreB !== scoreA) return scoreB - scoreA;
    
    const timeA = (a.timestamp as any)?.seconds || 0;
    const timeB = (b.timestamp as any)?.seconds || 0;
    return timeB - timeA;
  });

  const threadedDebate = sortedDebate.reduce((acc, post) => {
    if (!post.parentPostId) {
      acc.push({
        ...post,
        replies: sortedDebate.filter(p => p.parentPostId === post.id)
      });
    }
    return acc;
  }, [] as (DebatePost & { replies: DebatePost[] })[]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scholarly Debate</h2>
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
          {/* Debate Posts */}
          <div className="space-y-6">
            {threadedDebate.map(post => (
              <div key={post.id} className="border-l-4 border-green-600 pl-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold">{post.author.displayName}</span>
                    <span className="text-gray-500 ml-2">
                      {format(
                        (post.timestamp as any)?.seconds ? 
                          new Date((post.timestamp as any).seconds * 1000) : 
                          new Date(),
                        'MMM d, yyyy h:mm a'
                      )}
                    </span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      post.author.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                      post.author.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {post.author.role}
                    </span>
                  </div>
                  
                  {userProfile && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleVote(post.id, 'up')}
                        className={`text-gray-500 hover:text-green-600 ${
                          post.votes.up.includes(userProfile.uid) ? 'text-green-600' : ''
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-sm font-medium">
                        {post.votes.up.length - post.votes.down.length}
                      </span>
                      <button
                        onClick={() => handleVote(post.id, 'down')}
                        className={`text-gray-500 hover:text-red-600 ${
                          post.votes.down.includes(userProfile.uid) ? 'text-red-600' : ''
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                <div className="prose max-w-none text-sm mb-4">
                  <div dangerouslySetInnerHTML={{ __html: marked(post.content) }} />
                </div>

                {post.references.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold mb-2">References:</h4>
                    <ul className="text-sm space-y-1">
                      {post.references.map((ref, index) => (
                        <li key={index} className="text-blue-600">
                          <a href={ref} target="_blank" rel="noopener noreferrer">
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {userProfile && canAddCommentary(userProfile) && (
                  <button
                    onClick={() => setReplyTo(post.id)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Reply
                  </button>
                )}

                {/* Replies */}
                {post.replies.length > 0 && (
                  <div className="mt-4 ml-4 space-y-4">
                    {post.replies.map(reply => (
                      <div key={reply.id} className="border-l-4 border-green-300 pl-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <span className="font-semibold">{reply.author.displayName}</span>
                            <span className="text-gray-500 ml-2">
                              {format(
                                (reply.timestamp as any)?.seconds ? 
                                  new Date((reply.timestamp as any).seconds * 1000) : 
                                  new Date(),
                                'MMM d, yyyy h:mm a'
                              )}
                            </span>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                              reply.author.role === 'superadmin' ? 'bg-purple-100 text-purple-800' :
                              reply.author.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {reply.author.role}
                            </span>
                          </div>
                        </div>

                        <div className="prose max-w-none text-sm">
                          <div dangerouslySetInnerHTML={{ __html: marked(reply.content) }} />
                        </div>

                        {reply.references.length > 0 && (
                          <div className="mt-2">
                            <h4 className="text-sm font-semibold mb-1">References:</h4>
                            <ul className="text-sm space-y-1">
                              {reply.references.map((ref, index) => (
                                <li key={index} className="text-blue-600">
                                  <a href={ref} target="_blank" rel="noopener noreferrer">
                                    {ref}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* New Post Form */}
          {userProfile && canAddCommentary(userProfile) && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">
                {replyTo ? 'Write a Reply' : 'Add to the Discussion'}
              </h3>
              
              <div className="space-y-4">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full h-32 p-4 border rounded"
                  placeholder="Write your contribution (supports Markdown)..."
                />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Add References</h4>
                  <div className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="Enter reference URL"
                    />
                    <button
                      onClick={handleAddReference}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Add
                    </button>
                  </div>

                  {references.length > 0 && (
                    <ul className="space-y-2">
                      {references.map((ref, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span className="text-blue-600">{ref}</span>
                          <button
                            onClick={() => handleRemoveReference(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="flex justify-end space-x-2">
                  {replyTo && (
                    <button
                      onClick={() => setReplyTo(null)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel Reply
                    </button>
                  )}
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 