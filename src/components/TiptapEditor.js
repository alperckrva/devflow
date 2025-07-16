import React, { useState } from 'react';
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

const TiptapEditor = ({ value, onChange }) => {
  const { darkMode } = useTheme();
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  const editor = useEditor({
    extensions: [
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
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) {
        onChange(html);
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${
          darkMode ? 'prose-invert' : ''
        }`,
      },
    },
    immediatelyRender: false,
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [value, editor]);

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

  const handleButtonClick = (action) => {
    // Önce focus'u garanti et
    editor.chain().focus();
    // Sonra action'ı çalıştır
    action();
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target.result;
          editor.chain().focus().setImage({ src: imageUrl }).run();
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleLinkSubmit = () => {
    if (linkUrl) {
      if (linkText) {
        // Eğer text varsa, önce text'i insert et sonra link yap
        editor.chain().focus().insertContent(linkText).run();
        editor.chain().focus().setTextSelection({
          from: editor.state.selection.from - linkText.length,
          to: editor.state.selection.from,
        }).setLink({ href: linkUrl }).run();
      } else {
        // Sadece URL varsa
        editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
      }
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  };

  const openLinkModal = () => {
    setShowLinkModal(true);
    // Seçili text varsa link text olarak kullan
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ''
    );
    if (selectedText) {
      setLinkText(selectedText);
    }
  };

  const setColor = (color) => {
    editor.chain().focus().setColor(color).run();
  };

  const MenuBar = () => {
    return (
      <div className={`border-b p-3 flex flex-wrap gap-2 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        {/* Başlıklar */}
        <div className="flex gap-1">
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

        {/* Text Formatting */}
        <div className="flex gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleBold().run())}
            className={`px-3 py-2 rounded text-sm font-bold transition-all duration-200 ${
              editor.isActive('bold')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 5a1 1 0 011-1h5.5a2.5 2.5 0 010 5H4v2h4.5a2.5 2.5 0 010 5H4a1 1 0 01-1-1V5z"/>
            </svg>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleItalic().run())}
            className={`px-3 py-2 rounded text-sm italic font-medium transition-all duration-200 ${
              editor.isActive('italic')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.5 5a1 1 0 00-1 1v1H6a1 1 0 000 2h1.5v2.793l-2.146-2.147a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10.5 11.793V9H12a1 1 0 100-2h-1.5V6a1 1 0 00-1-1z"/>
            </svg>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleUnderline().run())}
            className={`px-3 py-2 rounded text-sm underline font-medium transition-all duration-200 ${
              editor.isActive('underline')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            U
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleStrike().run())}
            className={`px-3 py-2 rounded text-sm line-through font-medium transition-all duration-200 ${
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

        {/* Renkler */}
        <div className="flex gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor('#ef4444')}
            className="w-8 h-8 rounded bg-red-500 hover:bg-red-600 border-2 border-white shadow-sm"
            title="Kırmızı"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor('#3b82f6')}
            className="w-8 h-8 rounded bg-blue-500 hover:bg-blue-600 border-2 border-white shadow-sm"
            title="Mavi"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor('#10b981')}
            className="w-8 h-8 rounded bg-green-500 hover:bg-green-600 border-2 border-white shadow-sm"
            title="Yeşil"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor('#f59e0b')}
            className="w-8 h-8 rounded bg-yellow-500 hover:bg-yellow-600 border-2 border-white shadow-sm"
            title="Sarı"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setColor('#000000')}
            className="w-8 h-8 rounded bg-black hover:bg-gray-800 border-2 border-white shadow-sm"
            title="Siyah"
          />
        </div>

        <div className="w-px h-8 bg-gray-300 mx-1"></div>

        {/* Lists */}
        <div className="flex gap-1">
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

        {/* Alignment */}
        <div className="flex gap-1">
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

        {/* Other Features */}
        <div className="flex gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().toggleBlockquote().run())}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              editor.isActive('blockquote')
                ? 'bg-orange-600 text-white shadow-md'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            💬 Alıntı
          </button>
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
            &lt;/&gt; Kod
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
        <div className="flex gap-1">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().undo().run())}
            disabled={!editor.can().undo()}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              !editor.can().undo()
                ? 'opacity-50 cursor-not-allowed'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ↶ Geri Al
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleButtonClick(() => editor.chain().redo().run())}
            disabled={!editor.can().redo()}
            className={`px-3 py-2 rounded text-sm font-medium transition-all duration-200 ${
              !editor.can().redo()
                ? 'opacity-50 cursor-not-allowed'
                : darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 hover:shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 hover:shadow-sm border border-gray-200'
            }`}
          >
            ↷ İleri Al
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`h-full border rounded-lg overflow-hidden flex flex-col ${
        darkMode ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <MenuBar />
        <div className="flex-1 overflow-y-auto bg-white">
          <EditorContent 
            editor={editor} 
            className="h-full focus-within:outline-none p-6"
          />
        </div>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`rounded-xl shadow-2xl max-w-md w-full ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>Link Ekle</h3>
              
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Link Metni</label>
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Görünecek metin (isteğe bağlı)"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>URL</label>
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkUrl('');
                    setLinkText('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    darkMode 
                      ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                      : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  İptal
                </button>
                <button
                  onClick={handleLinkSubmit}
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TiptapEditor; 