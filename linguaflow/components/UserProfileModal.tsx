/**
 * UserProfileModal — shown before starting a Vietnamese-to-English session so
 * the AI tutor can greet the learner by name and personalise instruction based
 * on prior progress.
 *
 * Profile persistence strategy:
 *   1. On mount the modal checks localStorage for a saved `linguaflow_user_id`.
 *   2. If found, it fetches the full profile from `/api/users/:id` and shows a
 *      "Welcome back" summary so the user can continue or start fresh.
 *   3. If not found (or the backend returns 404), a new-user form is shown.
 *      Submitting creates a profile via POST `/api/users` and saves the
 *      returned `id` to localStorage for future sessions.
 *   4. In both cases `onProfileReady` is called with the resolved UserProfile,
 *      which the parent passes into useLiveSession to include in the system prompt.
 */
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { UserProfile } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called once a profile has been resolved (new or returning). */
  onProfileReady: (profile: UserProfile) => void;
  /** Base URL of the REST API server (e.g. https://api.example.com). */
  apiUrl: string;
}

const UserProfileModal = memo<Props>(({ isOpen, onClose, onProfileReady, apiUrl }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingProfile, setExistingProfile] = useState<UserProfile | null>(null);
  const triggerRef = useRef<Element | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Save and restore focus when the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement;
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [isOpen]);

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
      setError('Không thể kết nối. Vui lòng thử lại.');
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !contentRef.current) return;

    const focusable = contentRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, [onClose]);

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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div ref={contentRef} className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <h2 id="profile-modal-title" className="text-xl font-bold text-white">
            {existingProfile ? <><span aria-hidden="true">👋 </span>Chào mừng trở lại!</> : <><span aria-hidden="true">🎓 </span>Chào bạn!</>}
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            {existingProfile 
              ? 'Tiến độ của bạn đã được lưu lại. Hãy tiếp tục!'
              : 'Hãy cho tôi biết tên của bạn để bắt đầu học'}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <div role="status" className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" aria-hidden="true"></div>
              <span className="ml-3 text-slate-400">Đang tải...</span>
            </div>
          ) : existingProfile ? (
            /* Returning user view */
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div aria-hidden="true" className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-xl font-bold text-white">
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
                    <div className="text-2xl font-bold text-amber-400">
                      {existingProfile.totalSessions > 0
                        ? Math.round(existingProfile.wordsLearned.length / existingProfile.totalSessions)
                        : 0}
                    </div>
                    <div className="text-xs text-slate-400">Từ/buổi học</div>
                  </div>
                </div>

                {existingProfile.wordsLearned.length > 0 && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-400 mb-2">Từ đã học gần đây:</p>
                    <ul className="flex flex-wrap gap-1 list-none p-0 m-0" aria-label="Recently learned words">
                      {existingProfile.wordsLearned.slice(-8).map((word, i) => (
                        <li key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-300">
                          {word}
                        </li>
                      ))}
                      {existingProfile.wordsLearned.length > 8 && (
                        <li className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 italic">
                          +{existingProfile.wordsLearned.length - 8} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleNewUser}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Không phải tôi
                </button>
                <button
                  onClick={handleContinue}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  Tiếp tục học →
                </button>
              </div>
            </div>
          ) : (
            /* New user form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="user-name-input" className="block text-sm font-medium text-slate-300 mb-2">
                  Tên của bạn là gì?
                </label>
                <input
                  id="user-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Minh, Lan, Hùng..."
                  aria-describedby={error ? 'name-error' : undefined}
                  aria-invalid={!!error}
                  className={`w-full px-4 py-3 bg-slate-700 border rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-colors ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600 focus:ring-blue-500'}`}
                  autoFocus
                />
                {error && (
                  <p id="name-error" role="alert" className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>

              <p className="text-xs text-slate-400">
                <span aria-hidden="true">💡 </span>Tên của bạn sẽ được lưu để giáo viên cá nhân hóa bài học và theo dõi tiến độ.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
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
