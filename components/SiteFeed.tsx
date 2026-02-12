
import React, { useState } from 'react';
import { User, SitePost } from '../types';
import { Image as ImageIcon, Send, MoreHorizontal } from 'lucide-react';

interface SiteFeedProps {
  user: User;
  posts: SitePost[];
  setPosts: React.Dispatch<React.SetStateAction<SitePost[]>>;
}

const SiteFeed: React.FC<SiteFeedProps> = ({ user, posts, setPosts }) => {
  const [content, setContent] = useState('');
  
  const handlePost = () => {
    if (!content.trim()) return;
    const newPost: SitePost = {
      id: Math.random().toString(36).substr(2, 9),
      authorId: user.id,
      authorName: user.name,
      content,
      timestamp: Date.now(),
      imageUrl: Math.random() > 0.7 ? `https://picsum.photos/seed/${Math.random()}/600/400` : undefined
    };
    setPosts([newPost, ...posts]);
    setContent('');
  };

  return (
    <div className="px-6 pt-10 pb-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Site Feed</h1>
      </header>

      {/* Create Post */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-sm space-y-4">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening at the site?"
          className="w-full bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-100 resize-none min-h-[100px]"
        />
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-gray-400 hover:text-blue-600 transition-colors">
            <ImageIcon size={20} />
            <span className="text-xs font-medium">Add Photo</span>
          </button>
          <button 
            onClick={handlePost}
            disabled={!content.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
          >
            Post
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-6">
        {posts.map(post => (
          <div key={post.id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                  <img src={`https://picsum.photos/seed/${post.authorId}/100`} alt="avatar" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">{post.authorName}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">
                    {new Date(post.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button className="text-gray-400">
                <MoreHorizontal size={20} />
              </button>
            </div>
            <div className="px-4 pb-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {post.content}
              </p>
            </div>
            {post.imageUrl && (
              <div className="w-full aspect-[3/2] bg-gray-100">
                <img src={post.imageUrl} alt="post content" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ))}
        {posts.length === 0 && (
          <div className="text-center py-20 text-gray-300">
            <p className="text-sm">No updates from site yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteFeed;
