import React from 'react';
import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { useTheme } from '../contexts/ThemeContext';

const MarkdownEditor = ({ value, onChange }) => {
  const { darkMode } = useTheme();

  return (
    <div className="h-full" data-color-mode={darkMode ? "dark" : "light"}>
      <MDEditor
        value={value || ''}
        onChange={onChange}
        preview="edit"
        hideToolbar={false}
        visibleDragBar={false}
        height={600}
        data-color-mode={darkMode ? "dark" : "light"}
        style={{
          backgroundColor: 'transparent',
        }}
      />
    </div>
  );
};

export default MarkdownEditor; 