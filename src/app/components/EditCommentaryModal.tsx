import { useState, useEffect } from 'react'
import { marked } from 'marked'
import { VerseCommentary } from '@/lib/types/commentary'
import { DebatePost } from '@/lib/types/debate'
import { addDebatePost, voteOnDebatePost } from '@/lib/firebase/commentaryManagement'
import { useAuth } from '@/lib/hooks/useAuth'
import { format } from 'date-fns'
import { BIBLE_VERSIONS } from '@/lib/api/bibleConfig'
import { getVerse } from '@/lib/api/bibleApi'
import Image from 'next/image'

interface TranslationType {
  version: string;
  text: string;
  type: 'modern' | 'classical' | 'original';
  displayName?: string;
}

interface Commentary {
  text: string;
  author: string;
  timestamp: number;
  references?: string[];
  tags?: string[];
}

interface EditCommentaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (commentary: Commentary) => void;
  initialCommentary?: Commentary | null;
  reference: string;
  text: string;
}

interface ExtendedDebatePost extends DebatePost {
  verseId: string;
  votes: {
    up: string[];
    down: string[];
  };
  references: string[];
  replies?: ExtendedDebatePost[];
  parentPostId?: string;
}

function DebateThread({ post, depth = 0, onUpdate }: { 
  post: ExtendedDebatePost, 
  depth?: number,
  onUpdate: () => void 
}) {
  const [showReply, setShowReply] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const { userProfile } = useAuth()

  const handleVote = async (postId: string, voteType: 'up' | 'down') => {
    if (!userProfile) return;
    
    const success = await voteOnDebatePost(
      post.verseId,
      postId,
      userProfile.uid,
      voteType
    );

    if (success) {
      onUpdate();
    }
  };

  const handleReply = async () => {
    if (!userProfile || !replyContent.trim()) return
    
    const success = await addDebatePost(
      post.verseId,
      replyContent,
      userProfile,
      post.id
    );

    if (success) {
      setShowReply(false)
      setReplyContent('')
      onUpdate()
    }
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-4 border-green-300' : 'border-l-4 border-green-600'} pl-4`}>
      <div className={`relative ${depth > 0 ? 'mt-2' : 'mt-4'}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            {post.author?.photoURL ? (
              <Image 
                src={post.author.photoURL} 
                alt={post.author.displayName || 'User'}
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 flex items-center justify-center">
                <span className="text-xs text-gray-500">
                  {(post.author?.displayName || 'A').charAt(0)}
                </span>
              </div>
            )}
            <span className="font-semibold">{post.author?.displayName}</span>
            <span className="text-gray-500 ml-2 text-xs">
              {format(
                typeof post.timestamp === 'object' && post.timestamp && 'seconds' in post.timestamp
                  ? new Date((post.timestamp as { seconds: number }).seconds * 1000)
                  : new Date(post.timestamp),
                'MMM d, yyyy h:mm a'
              )}
            </span>
            {post.author?.role && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                post.author.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {post.author.role}
              </span>
            )}
          </div>
          
          {userProfile && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleVote(post.id, 'up')}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  post.votes?.up.includes(userProfile.uid) 
                    ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                    : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                }`}
              >
                <i className="material-icons" style={{ fontSize: '20px' }}>arrow_upward</i>
              </button>
              <span className={`text-sm font-bold w-6 text-center ${
                post.votes?.up.includes(userProfile.uid) ? 'text-green-600' :
                post.votes?.down.includes(userProfile.uid) ? 'text-red-600' :
                'text-gray-700'
              }`}>
                {(post.votes?.up.length || 0) - (post.votes?.down.length || 0)}
              </span>
              <button
                onClick={() => handleVote(post.id, 'down')}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  post.votes?.down.includes(userProfile.uid) 
                    ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                    : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
                }`}
              >
                <i className="material-icons" style={{ fontSize: '20px' }}>arrow_downward</i>
              </button>
            </div>
          )}
        </div>

        <div className="prose max-w-none text-sm mb-4">
          <div dangerouslySetInnerHTML={{ __html: marked(post.content) }} />
        </div>

        {post.references?.length > 0 && (
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

        {userProfile && (
          <button
            onClick={() => setShowReply(!showReply)}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Reply
          </button>
        )}

        {/* Reply form */}
        {showReply && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              rows={4}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => setShowReply(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleReply}
                className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
              >
                Reply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {post.replies && post.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {post.replies.map((reply, index) => (
            <DebateThread key={index} post={reply} depth={depth + 1} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  )
}

// Add a helper function to get version display name
function getVersionDisplayName(versionId: string): string {
  const version = BIBLE_VERSIONS.find(v => v.id === versionId);
  return version?.name || versionId;
}

export default function EditCommentaryModal({
  isOpen,
  onClose,
  onSave,
  initialCommentary,
  reference,
  text
}: EditCommentaryModalProps) {
  const [commentaryText, setCommentaryText] = useState(initialCommentary?.text || '');
  const [references, setReferences] = useState<string[]>(initialCommentary?.references || []);
  const [tags, setTags] = useState<string[]>(initialCommentary?.tags || []);
  const [newReference, setNewReference] = useState('');
  const [newTag, setNewTag] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setCommentaryText(initialCommentary?.text || '');
      setReferences(initialCommentary?.references || []);
      setTags(initialCommentary?.tags || []);
    }
  }, [isOpen, initialCommentary]);

  const handleAddReference = () => {
    if (newReference.trim()) {
      setReferences([...references, newReference.trim()]);
      setNewReference('');
    }
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveReference = (index: number) => {
    setReferences(references.filter((_, i) => i !== index));
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) return;
    
    onSave({
      text: commentaryText,
      author: user.email || 'Anonymous',
      timestamp: Date.now(),
      references,
      tags
    });
    
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-10 bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{reference}</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">{text}</p>
          </div>

          {/* Commentary Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Commentary
            </label>
            <textarea
              value={commentaryText}
              onChange={(e) => setCommentaryText(e.target.value)}
              className="w-full h-40 px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write your commentary here..."
            />
          </div>

          {/* References */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              References
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newReference}
                onChange={(e) => setNewReference(e.target.value)}
                className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a reference..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddReference()}
              />
              <button
                onClick={handleAddReference}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {references.map((ref, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-2"
                >
                  {ref}
                  <button
                    onClick={() => handleRemoveReference(index)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 text-gray-700 dark:text-gray-300 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add a tag..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(index)}
                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              disabled={!commentaryText.trim()}
            >
              Save Commentary
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 