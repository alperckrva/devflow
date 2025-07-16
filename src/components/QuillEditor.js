import React, { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '../contexts/ThemeContext';

const QuillEditor = ({ value, onChange }) => {
  const { darkMode } = useTheme();

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['link', 'image'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'align',
    'link', 'image',
    'color', 'background'
  ];

  return (
    <div 
      className={`h-full ${darkMode ? 'quill-dark' : 'quill-light'}`}
      style={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={onChange}
        modules={modules}
        formats={formats}
        style={{ 
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        placeholder="Notunuzu buraya yazın..."
      />
    </div>
  );
};

export default QuillEditor; 