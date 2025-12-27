import React, { useState, useEffect, useCallback, memo } from 'react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProfileReady: (profile: UserProfile) => void;
  apiUrl: string;
}

const UserProfileModal = memo<Props>(({ isOpen, onClose, onProfileReady, apiUrl }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);

  // Check for saved profile in localStorage
  useEffect(() => {
    const savedId = localStorage.getItem('linguaflow_user_id');
    if (savedId && isOpen) {
      fetchUserById(savedId);
    }
  }, [isOpen]);

  const fetchUserById = useCallback(async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/users/${id}`);
      if (res.ok) {
        const data = await res.json();
        setExistingProfile(data.user);
      } else {
        localStorage.removeItem('linguaflow_user_id');
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      });

      if (!res.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await res.json();
      localStorage.setItem('linguaflow_user_id', data.user.id);
      onProfileReady(data.user);
    } catch (err) {
      setError('Không thể lưu thông tin. Vui lòng thử lại.');
      console.error('Error creating profile:', err);
    } finally {
      setLoading(false);
    }
  }, [name, apiUrl, onProfileReady]);

  const handleContinue = useCallback(() => {
    if (existingProfile) {
      onProfileReady(existingProfile);
    }
  }, [existingProfile, onProfileReady]);

  const handleNewUser = useCallback(() => {
    localStorage.removeItem('linguaflow_user_id');
    setExistingProfile(null);
  }, []);

  if (!isOpen) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {existingProfile ? '👋 Chào mừng trở lại!' : '🎓 Chào bạn!'}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {existingProfile 
              ? 'Chúng tôi nhớ bạn rồi!' 
              : 'Hãy cho tôi biết tên của bạn để bắt đầu học'}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-slate-400">Đang tải...</span>
            </div>
          ) : existingProfile ? (
            /* Returning user view */
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
                    {existingProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{existingProfile.name}</h3>
                    <p className="text-sm text-slate-400">
                      Lần học gần nhất: {formatDate(existingProfile.lastSessionDate)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-400">{existingProfile.lessonNumber}</div>
                    <div className="text-xs text-slate-400">Bài học hiện tại</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{existingProfile.wordsLearned.length}</div>
                    <div className="text-xs text-slate-400">Từ đã học</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-400">{existingProfile.totalSessions}</div>
                    <div className="text-xs text-slate-400">Buổi học</div>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-400">⭐</div>
                    <div className="text-xs text-slate-400">Tiếp tục nào!</div>
                  </div>
                </div>

                {existingProfile.wordsLearned.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400 mb-2">Từ đã học gần đây:</p>
                    <div className="flex flex-wrap gap-1">
                      {existingProfile.wordsLearned.slice(-8).map((word, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleNewUser}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors text-sm"
                >
                  Tôi là người khác
                </button>
                <button
                  onClick={handleContinue}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-semibold"
                >
                  Tiếp tục học →
                </button>
              </div>
            </div>
          ) : (
            /* New user form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tên của bạn là gì?
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh, Lan, Hùng..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <p className="text-xs text-slate-400">
                💡 Tên của bạn sẽ được lưu lại để giáo viên có thể nhớ bạn và theo dõi tiến độ học.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Đang lưu...' : 'Bắt đầu học →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
});

UserProfileModal.displayName = 'UserProfileModal';

export default UserProfileModal;
