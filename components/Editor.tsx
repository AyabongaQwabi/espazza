'use client';

import { useState, useCallback, useRef } from 'react';
import ReactMde from 'react-mde';
import * as Showdown from 'showdown';
import 'react-mde/lib/styles/css/react-mde-all.css';

const converter = new Showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export function Editor({ value, onChange, onImageUpload }: EditorProps) {
  const [selectedTab, setSelectedTab] = useState<'write' | 'preview'>('write');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = useCallback(
    async function* (data: ArrayBuffer) {
      if (
        inputRef.current &&
        inputRef.current.files &&
        inputRef.current.files.length > 0
      ) {
        const file = inputRef.current.files[0];
        const url = await onImageUpload(file);
        yield url;
        return url;
      }
      return '';
    },
    [onImageUpload]
  );

  return (
    <div className='prose prose-invert max-w-none text-zinc-800'>
      <ReactMde
        value={value}
        onChange={onChange}
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        generateMarkdownPreview={(markdown) =>
          Promise.resolve(converter.makeHtml(markdown))
        }
        childProps={{
          writeButton: {
            tabIndex: -1,
          },
        }}
        paste={{
          saveImage: handleImageUpload,
        }}
      />
      <input
        type='file'
        ref={inputRef}
        style={{ display: 'none' }}
        className='text-zinc-800'
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImageUpload(new ArrayBuffer(0));
          }
        }}
      />
    </div>
  );
}
