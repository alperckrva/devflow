import React, { useState, memo, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { useTheme } from '../contexts/ThemeContext';

// 🚀 Performance: Editor konfigürasyonu memoize edildi
const createEditorExtensions = () => [
      StarterKit,
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
];

const TiptapEditor = memo(({ value, onChange }) => {
  const { darkMode } = useTheme();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // 🚀 Performance: Editor extensions memoize edildi
  const extensions = useMemo(() => createEditorExtensions(), []);

  // 🚀 Performance: Editor props memoize edildi
  const editorProps = useMemo(() => ({
    attributes: {
      class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${
        darkMode ? 'prose-invert' : ''
      }`,
    },
  }), [darkMode]);

  const editor = useEditor({
    extensions,
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    editorProps,
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [value, editor]);

  // 🚀 Performance: Event handler'lar memoize edildi
  const handleButtonClick = useCallback((action) => {
    // Önce focus'u garanti et
    editor?.chain().focus();
    // Sonra action'ı çalıştır
    action();
  }, [editor]);

  const handleImageUpload = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target.result;
          editor?.chain().focus().setImage({ src: imageUrl }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (linkUrl) {
      if (linkText) {
        // Eğer text varsa, önce text'i insert et sonra link yap
        editor?.chain().focus().insertContent(linkText).run();
        editor?.chain().focus().setTextSelection({
          from: editor.state.selection.from - linkText.length,
          to: editor.state.selection.from,
        }).setLink({ href: linkUrl }).run();
      } else {
        // Sadece URL varsa
        editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, editor]);

  const openLinkModal = useCallback(() => {
    setShowLinkModal(true);
  }, []);

  const closeLinkModal = useCallback(() => {
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, []);

  // 🚀 Performance: Toolbar butonları memoize edildi
  const MenuBar = useMemo(() => (
    <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'} p-3`}>
      <div className="flex flex-wrap items-center gap-1">
        {/* Başlık butonları */}
        <div className="flex items-center space-x-1 mr-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleHeading({ level: 1 }).run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('heading', { level: 1 })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            H1
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleHeading({ level: 2 }).run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('heading', { level: 2 })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            H2
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleHeading({ level: 3 }).run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('heading', { level: 3 })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            H3
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Formatting butonları */}
        <div className="flex items-center space-x-1 mr-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleBold().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('bold')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            <strong>B</strong>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleItalic().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('italic')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            <em>I</em>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleUnderline().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('underline')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            <u>U</u>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleStrike().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('strike')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            S
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Liste ve hizalama butonları */}
        <div className="flex items-center space-x-1 mr-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleBulletList().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('bulletList')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            • Liste
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleOrderedList().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('orderedList')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            1. Liste
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Hizalama butonları */}
        <div className="flex items-center space-x-1 mr-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().setTextAlign('left').run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive({ textAlign: 'left' })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ⬅
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().setTextAlign('center').run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive({ textAlign: 'center' })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ↔
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().setTextAlign('right').run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive({ textAlign: 'right' })
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ➡
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Kod ve link butonları */}
        <div className="flex items-center space-x-1 mr-3">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleCode().run())}
            className={`px-3 py-2 rounded text-sm font-mono font-medium transition-all duration-200 ${
              editor.isActive('code')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            &lt;/&gt;
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleCodeBlock().run())}
            className={`px-3 py-2 rounded text-sm font-mono font-medium transition-all duration-200 ${
              editor.isActive('codeBlock')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            📝 Kod Blok
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={openLinkModal}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('link')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            🔗 Link
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleImageUpload}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              darkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            🖼️ Resim
          </button>
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().undo().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ↶ Geri
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().redo().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ↷ İleri
          </button>
        </div>
      </div>
    </div>
  ), [editor, darkMode, handleButtonClick, openLinkModal, handleImageUpload]);

  if (!editor) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-2"></div>
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Editor yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
      {MenuBar}
      
      <div className={`p-4 min-h-[300px] ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <EditorContent editor={editor} />
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${
            darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-lg font-medium mb-4">Link Ekle</h3>
              <div className="space-y-4">
                <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                  <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  placeholder="https://example.com"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">Link Metni (opsiyonel)</label>
                  <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  placeholder="Link açıklaması"
                  />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeLinkModal}
                  className={`px-4 py-2 rounded-md ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor; 