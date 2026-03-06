import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Image from '@tiptap/extension-image';
import { common, createLowlight } from 'lowlight';
import { marked } from 'marked';
import Header from '../components/Header';

const lowlight = createLowlight(common);
const API_URL = '/api';

// Auto-save debounce delay
const AUTO_SAVE_DELAY = 2000;

export default function Write() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [category, setCategory] = useState('general');
    const [metaDescription, setMetaDescription] = useState('');
    const [tags, setTags] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [wordCount, setWordCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(null);
    const dropZoneRef = useRef(null);

    // Upload image to server
    const uploadImage = useCallback(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        setUploadProgress('Uploading...');

        try {
            const response = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setUploadProgress(null);
            return data.url;
        } catch (error) {
            console.error('Upload failed:', error);
            setUploadProgress('Upload failed');
            setTimeout(() => setUploadProgress(null), 2000);
            return null;
        }
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ codeBlock: false }),
            CodeBlockLowlight.configure({ lowlight }),
            Image.configure({
                inline: false,
                allowBase64: false,
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            const text = editor.getText();
            setWordCount(text.split(/\s+/).filter(Boolean).length);
            setCharCount(text.length);

            // Auto-save to localStorage
            debounceAutoSave();
        },
        editorProps: {
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer?.files?.length) {
                    const files = Array.from(event.dataTransfer.files);
                    const images = files.filter(f => f.type.startsWith('image/'));

                    if (images.length > 0) {
                        event.preventDefault();
                        images.forEach(async (file) => {
                            const url = await uploadImage(file);
                            if (url) {
                                const { schema } = view.state;
                                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.insert(coordinates?.pos || 0, node);
                                view.dispatch(transaction);
                            }
                        });
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                const items = Array.from(event.clipboardData?.items || []);
                const images = items.filter(item => item.type.startsWith('image/'));

                if (images.length > 0) {
                    event.preventDefault();
                    images.forEach(async (item) => {
                        const file = item.getAsFile();
                        if (file) {
                            const url = await uploadImage(file);
                            if (url) {
                                const { schema } = view.state;
                                const node = schema.nodes.image.create({ src: url });
                                const transaction = view.state.tr.replaceSelectionWith(node);
                                view.dispatch(transaction);
                            }
                        }
                    });
                    return true;
                }
                return false;
            },
        },
    });

    // Refs for auto-save to avoid stale closures
    const titleRef = useRef(title);
    const subtitleRef = useRef(subtitle);
    const categoryRef = useRef(category);
    const metaDescriptionRef = useRef(metaDescription);
    const tagsRef = useRef(tags);
    titleRef.current = title;
    subtitleRef.current = subtitle;
    categoryRef.current = category;
    metaDescriptionRef.current = metaDescription;
    tagsRef.current = tags;

    // Debounced auto-save (uses refs to always read latest values)
    const debounceAutoSave = useMemo(() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if (editor && titleRef.current) {
                    const draft = {
                        title: titleRef.current,
                        subtitle: subtitleRef.current,
                        category: categoryRef.current,
                        metaDescription: metaDescriptionRef.current,
                        tags: tagsRef.current,
                        content: editor.getHTML(),
                        savedAt: new Date().toISOString()
                    };
                    localStorage.setItem('quill-draft', JSON.stringify(draft));
                    setLastSaved(new Date());
                }
            }, AUTO_SAVE_DELAY);
        };
    }, [editor]);

    // Load draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('quill-draft');
        if (savedDraft) {
            const draft = JSON.parse(savedDraft);
            setTitle(draft.title || '');
            setSubtitle(draft.subtitle || '');
            setCategory(draft.category || 'general');
            setMetaDescription(draft.metaDescription || '');
            setTags(draft.tags || '');
            if (editor && draft.content) {
                editor.commands.setContent(draft.content);
            }
            setLastSaved(new Date(draft.savedAt));
        }
    }, [editor]);

    // Handle file drop (for .md, .txt, .html files)
    const handleFileDrop = useCallback(async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer?.files || []);

        for (const file of files) {
            // Handle text/markdown files
            if (file.name.endsWith('.md') || file.name.endsWith('.txt') || file.name.endsWith('.html')) {
                const text = await file.text();
                let html = text;

                if (file.name.endsWith('.md')) {
                    // Convert markdown to HTML
                    html = marked.parse(text);
                }

                // Extract title from first h1 or first line
                const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) || text.match(/^#\s+(.+)$/m);
                if (titleMatch && !title) {
                    setTitle(titleMatch[1].trim());
                }

                // Set content in editor
                if (editor) {
                    const currentContent = editor.getHTML();
                    if (currentContent === '<p></p>' || !currentContent) {
                        editor.commands.setContent(html);
                    } else {
                        editor.commands.insertContent(html);
                    }
                }
            }

            // Handle images dropped on the drop zone
            if (file.type.startsWith('image/')) {
                const url = await uploadImage(file);
                if (url && editor) {
                    editor.chain().focus().setImage({ src: url }).run();
                }
            }
        }
    }, [editor, title, uploadImage]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);


    const handleSave = useCallback(async (status) => {
        if (!title.trim() || !editor) return;

        setIsSaving(true);
        try {
            const response = await fetch(`${API_URL}/articles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    subtitle,
                    content: editor.getHTML(),
                    tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                    category,
                    metaDescription,
                    status,
                }),
            });

            if (response.ok) {
                const { slug } = await response.json();
                localStorage.removeItem('quill-draft'); // Clear draft
                if (status === 'published') {
                    navigate(`/${slug}`);
                } else {
                    setLastSaved(new Date());
                }
            }
        } catch (error) {
            console.error('Error saving article:', error);
        } finally {
            setIsSaving(false);
        }
    }, [title, subtitle, tags, category, metaDescription, editor, navigate]);

    // Keyboard shortcut: Ctrl+S to save
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave('draft');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleSave]);

    // Reading time estimate
    const readingTime = useMemo(() => {
        return Math.max(1, Math.ceil(wordCount / 200));
    }, [wordCount]);

    if (!editor) return null;

    return (
        <>
            <Header />
            <main className="article-container" style={{ paddingTop: '2rem' }}>
                {/* Writing Stats Bar */}
                <div className="writing-stats" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <span>{wordCount} words</span>
                        <span>{charCount} characters</span>
                        <span>~{readingTime} min read</span>
                    </div>
                    <div>
                        {lastSaved && (
                            <span style={{ opacity: 0.7 }}>
                                Auto-saved {lastSaved.toLocaleTimeString()}
                            </span>
                        )}
                        {isSaving && <span>Saving...</span>}
                        {uploadProgress && <span style={{ color: 'var(--accent)' }}>{uploadProgress}</span>}
                    </div>
                </div>

                {/* File Drop Zone */}
                <div
                    ref={dropZoneRef}
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                        border: isDragging ? '2px dashed var(--accent)' : '2px dashed var(--border)',
                        borderRadius: '12px',
                        padding: '1.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center',
                        background: isDragging ? 'var(--accent-alpha)' : 'transparent',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                    }}
                    onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.md,.txt,.html,image/*';
                        input.multiple = true;
                        input.onchange = (e) => {
                            const fakeEvent = {
                                preventDefault: () => { },
                                dataTransfer: { files: e.target.files }
                            };
                            handleFileDrop(fakeEvent);
                        };
                        input.click();
                    }}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {isDragging ? '📥' : '📄'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {isDragging
                            ? 'Drop files here!'
                            : 'Drop files here or click to upload (.md, .txt, images)'
                        }
                    </div>
                </div>

                {/* Title Input */}
                <input
                    type="text"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="form-input large"
                    style={{ marginBottom: '1rem' }}
                    aria-label="Article title"
                />

                {/* Subtitle Input */}
                <input
                    type="text"
                    placeholder="Subtitle (optional)"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: '1rem' }}
                    aria-label="Article subtitle"
                />

                {/* Category Select */}
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: '1rem' }}
                    aria-label="Article category"
                >
                    <option value="general">General</option>
                    <option value="ai">AI</option>
                    <option value="education">Education</option>
                    <option value="games">Games</option>
                    <option value="content">Content</option>
                    <option value="platform">Platform</option>
                    <option value="marketplace">Marketplace</option>
                </select>

                {/* Meta Description */}
                <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    <textarea
                        placeholder="Meta description (for SEO, max 160 characters)"
                        value={metaDescription}
                        onChange={(e) => {
                            if (e.target.value.length <= 160) {
                                setMetaDescription(e.target.value);
                            }
                        }}
                        className="form-input"
                        style={{ resize: 'vertical', minHeight: '60px' }}
                        aria-label="Meta description"
                        maxLength={160}
                    />
                    <span style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '12px',
                        fontSize: 'var(--text-xs)',
                        color: metaDescription.length > 140 ? 'var(--color-error)' : 'var(--color-text-muted)',
                    }}>
                        {metaDescription.length}/160
                    </span>
                </div>

                {/* Tags Input */}
                <input
                    type="text"
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: '1.5rem' }}
                    aria-label="Article tags"
                />

                {/* Editor */}
                <div className="editor">
                    {/* Toolbar */}
                    <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
                        <button
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            className={editor.isActive('bold') ? 'is-active' : ''}
                            title="Bold (Ctrl+B)"
                            aria-label="Bold"
                        >
                            B
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            className={editor.isActive('italic') ? 'is-active' : ''}
                            title="Italic (Ctrl+I)"
                            aria-label="Italic"
                        >
                            I
                        </button>
                        <div className="toolbar-divider" style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
                            title="Heading 1"
                        >
                            H1
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
                            title="Heading 2"
                        >
                            H2
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                            title="Heading 3"
                        >
                            H3
                        </button>
                        <div className="toolbar-divider" style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />
                        <button
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            className={editor.isActive('bulletList') ? 'is-active' : ''}
                            title="Bullet List"
                        >
                            • List
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            className={editor.isActive('orderedList') ? 'is-active' : ''}
                            title="Numbered List"
                        >
                            1. List
                        </button>
                        <div className="toolbar-divider" style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />
                        <button
                            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                            className={editor.isActive('codeBlock') ? 'is-active' : ''}
                            title="Code Block"
                        >
                            {'</>'}
                        </button>
                        <button
                            onClick={() => editor.chain().focus().toggleBlockquote().run()}
                            className={editor.isActive('blockquote') ? 'is-active' : ''}
                            title="Quote"
                        >
                            " "
                        </button>
                        <button
                            onClick={() => editor.chain().focus().setHorizontalRule().run()}
                            title="Horizontal Rule"
                        >
                            —
                        </button>
                        <div className="toolbar-divider" style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 0.25rem' }} />
                        <button
                            onClick={() => editor.chain().focus().undo().run()}
                            disabled={!editor.can().undo()}
                            title="Undo (Ctrl+Z)"
                        >
                            ↶
                        </button>
                        <button
                            onClick={() => editor.chain().focus().redo().run()}
                            disabled={!editor.can().redo()}
                            title="Redo (Ctrl+Shift+Z)"
                        >
                            ↷
                        </button>
                    </div>

                    <EditorContent editor={editor} />
                </div>

                {/* Action Buttons */}
                <div className="actions" style={{
                    display: 'flex',
                    gap: '1rem',
                    marginTop: '2rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={() => handleSave('draft')}
                        className="btn btn-secondary"
                        disabled={!title.trim() || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        className="btn btn-accent"
                        disabled={!title.trim() || isSaving}
                    >
                        Publish 🚀
                    </button>
                </div>

                {/* Keyboard Shortcuts Help */}
                <div style={{
                    marginTop: '2rem',
                    padding: '1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                }}>
                    <strong>Keyboard Shortcuts:</strong>
                    <span style={{ marginLeft: '1rem' }}>Ctrl+S Save</span>
                    <span style={{ marginLeft: '1rem' }}>Ctrl+B Bold</span>
                    <span style={{ marginLeft: '1rem' }}>Ctrl+I Italic</span>
                    <span style={{ marginLeft: '1rem' }}>Ctrl+Z Undo</span>
                </div>
            </main>
        </>
    );
}
