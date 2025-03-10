import { useEffect, useRef, useState } from 'react'
import { marked } from 'marked'
import { VerseCommentary } from '@/lib/types/commentary'
import { DebatePost } from '@/lib/types/debate'
import { addDebatePost, voteOnDebatePost } from '@/lib/firebase/commentaryManagement'
import { useAuth } from '@/lib/contexts/AuthContext'
import { format } from 'date-fns'
import { BIBLE_VERSIONS } from '@/lib/api/bibleApi'
import { fetchVerse } from '@/lib/api/bibleApi'

interface TranslationType {
  version: string;
  text: string;
  type: 'modern' | 'classical' | 'original';
  displayName?: string;
}

interface EditCommentaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  setContent: (content: string) => void;
  onSave: () => void;
  book: string;
  chapter: number;
  verse: number;
  verseText: string;
  translations: TranslationType[];
  debate: DebatePost[];
  verseId: string;
  onDebateUpdate: () => void;
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
      [],
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
              <img 
                src={post.author.photoURL} 
                alt={post.author.displayName || 'User'}
                className="w-6 h-6 rounded-full mr-2"
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
  content,
  setContent,
  onSave,
  book,
  chapter,
  verse,
  verseText,
  translations,
  debate,
  verseId,
  onDebateUpdate
}: EditCommentaryModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const { userProfile } = useAuth()
  const [youtubeLink, setYoutubeLink] = useState('')
  const [reference, setReference] = useState('')
  const [newDebatePost, setNewDebatePost] = useState('')
  const [showYoutubeInput, setShowYoutubeInput] = useState(false)
  const [showReferenceInput, setShowReferenceInput] = useState(false)
  const [allTranslations, setAllTranslations] = useState(translations)

  useEffect(() => {
    async function loadAllTranslations() {
      if (!book || !chapter || !verse) return;

      try {
        const translationPromises = BIBLE_VERSIONS
          .filter(v => v.isSupported)
          .map(async (v) => {
            try {
              const data = await fetchVerse(v.id, book, chapter, verse);
              const type = v.language === 'en' 
                ? (v.id === '9879dbb7cfe39e4d-01' ? 'modern' as const : 'classical' as const)
                : 'original' as const;
              
              return {
                version: v.id,
                displayName: v.name,
                text: data.text,
                type
              };
            } catch (err) {
              console.error(`Error loading verse for version ${v.id}:`, err);
              return null;
            }
          });

        const results = await Promise.all(translationPromises);
        const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);
        setAllTranslations(validResults);
      } catch (err) {
        console.error('Error loading translations:', err);
      }
    }

    if (isOpen) {
      loadAllTranslations();
    }
  }, [isOpen, book, chapter, verse]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleAddYoutube = () => {
    if (youtubeLink) {
      setContent(content + `\n\n<YoutubeEmbed url="${youtubeLink}" />`)
      setYoutubeLink('')
      setShowYoutubeInput(false)
    }
  }

  const handleAddReference = () => {
    if (reference) {
      setContent(content + `\n\n> Reference: ${reference}`)
      setReference('')
      setShowReferenceInput(false)
    }
  }

  const handlePostDebate = async () => {
    if (!userProfile || !newDebatePost.trim()) return
    
    const success = await addDebatePost(
      verseId,
      newDebatePost,
      [], // empty references array
      userProfile
    );

    if (success) {
      setNewDebatePost('')
      onDebateUpdate()
    }
  }

  // Add sorting and threading logic
  const sortedDebate = debate.map(post => ({
    ...post,
    verseId,
    votes: (post as any).votes || { up: [], down: [] },
    references: (post as any).references || [],
  })) as ExtendedDebatePost[];

  sortedDebate.sort((a, b) => {
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
        replies: sortedDebate
          .filter(p => p.parentPostId === post.id)
      });
    }
    return acc;
  }, [] as ExtendedDebatePost[]);

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      <div className="fixed inset-4 flex items-center justify-center">
        <div
          ref={modalRef}
          className="relative flex w-full max-w-[95vw] h-[90vh] bg-white rounded-lg shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Left Side - Commentary */}
          <div className="flex-1 flex flex-col h-full border-r border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {book} {chapter}:{verse}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Translations */}
              <div className="space-y-3 mb-6">
                {allTranslations.map((t, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-lg ${
                      t.type === 'original' 
                        ? 'bg-blue-50 border border-blue-100' 
                        : t.type === 'classical'
                        ? 'bg-gray-50 border border-gray-100'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900">
                        {t.displayName || getVersionDisplayName(t.version)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        t.type === 'original'
                          ? 'bg-blue-100 text-blue-800'
                          : t.type === 'classical'
                          ? 'bg-gray-200 text-gray-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {t.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{t.text}</p>
                  </div>
                ))}
              </div>

              {/* Commentary Editor */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Commentary
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    placeholder="Enter your commentary here..."
                    rows={8}
                  />
                </div>

                {/* Helper Buttons */}
                <div className="space-y-2">
                  <div>
                    <button
                      onClick={() => setShowYoutubeInput(!showYoutubeInput)}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      + Add Youtube Video
                    </button>
                    {showYoutubeInput && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={youtubeLink}
                          onChange={(e) => setYoutubeLink(e.target.value)}
                          placeholder="Enter Youtube URL"
                          className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        />
                        <button
                          onClick={handleAddYoutube}
                          className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <button
                      onClick={() => setShowReferenceInput(!showReferenceInput)}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      + Add Reference
                    </button>
                    {showReferenceInput && (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={reference}
                          onChange={(e) => setReference(e.target.value)}
                          placeholder="Enter reference URL or text"
                          className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        />
                        <button
                          onClick={handleAddReference}
                          className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Preview</h3>
                  <div 
                    className="mt-2 p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: marked(content) }}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={onClose}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSave}
                    className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Debate */}
          <div className="flex-1 flex flex-col h-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Scholarly Debate</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Debate Posts */}
              <div className="space-y-4">
                {threadedDebate.map((post, index) => (
                  <DebateThread 
                    key={index} 
                    post={post}
                    onUpdate={onDebateUpdate} 
                  />
                ))}
              </div>
            </div>

            {/* Add to Discussion */}
            <div className="p-6 border-t border-gray-200">
              <textarea
                value={newDebatePost}
                onChange={(e) => setNewDebatePost(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                rows={4}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handlePostDebate}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 