'use client';

import type React from 'react';

import { useState, useCallback, useRef, useEffect } from 'react';
import ReactMde from 'react-mde';
import * as Showdown from 'showdown';
import 'react-mde/lib/styles/css/react-mde-all.css';
import { ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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
  const [isUploading, setIsUploading] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const editorRef = useRef<ReactMde>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Track the textarea element to get cursor position
  useEffect(() => {
    if (editorRef.current) {
      const textareaElement = editorRef.current.finalRefs.textarea;
      if (textareaElement) {
        textAreaRef.current = textareaElement;
      }
    }
  }, [editorRef.current]);

  // Save cursor position when textarea is focused or cursor moves
  const saveCursorPosition = () => {
    if (textAreaRef.current) {
      setCursorPosition(textAreaRef.current.selectionStart);
    }
  };

  // Handle image upload from ReactMde's built-in functionality
  const handleImageUpload = useCallback(
    async function* (data: ArrayBuffer) {
      if (
        inputRef.current &&
        inputRef.current.files &&
        inputRef.current.files.length > 0
      ) {
        const file = inputRef.current.files[0];
        setIsUploading(true);
        try {
          const url = await onImageUpload(file);
          yield url;
          setIsUploading(false);
          return url;
        } catch (error) {
          setIsUploading(false);
          toast({
            title: 'Upload failed',
            description: 'Failed to upload image. Please try again.',
            variant: 'destructive',
          });
          return '';
        }
      }
      return '';
    },
    [onImageUpload]
  );

  // Handle standalone image upload button
  const handleStandaloneImageUpload = async () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // Process the selected file
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPEG, PNG, GIF, etc.)',
          variant: 'destructive',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }

      setIsUploading(true);

      try {
        // Show toast for upload start
        toast({
          title: 'Uploading image',
          description: 'Please wait while we upload your image...',
        });

        // Upload the image
        const url = await onImageUpload(file);

        // Create the markdown text
        const imageName = file.name.replace(/\.[^/.]+$/, ''); // Remove file extension
        const markdownText = `![${imageName}](${url})`;

        // Copy to clipboard
        await navigator.clipboard.writeText(markdownText);

        // Success toast with instructions
        toast({
          title: 'Image uploaded and markdown copied!',
          description:
            'Markdown has been copied to clipboard. Paste it where you want the image to appear.',
          variant: 'default',
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: 'Upload failed',
          description: 'Failed to upload image. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
        // Clear the file input
        if (inputRef.current) {
          inputRef.current.value = '';
        }
      }
    }
  };

  return (
    <div className='prose prose-invert max-w-none text-zinc-800'>
      <div className='flex flex-col mb-3'>
        <div className='bg-gray-800/80 p-3 rounded-t-lg border border-purple-500/30 border-b-0'>
          <div className='flex items-center mb-3'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleStandaloneImageUpload}
              disabled={isUploading}
              className='flex items-center gap-1 bg-indigo-700/70 hover:bg-indigo-600 text-white border-indigo-600'
            >
              {isUploading ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin' />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon className='h-4 w-4' />
                  <span>Upload Image</span>
                </>
              )}
            </Button>
            {isUploading && (
              <span className='text-xs text-indigo-300 ml-3'>
                Uploading your image to Cloudinary...
              </span>
            )}
          </div>

          <div className='text-xs text-gray-300 bg-gray-900/50 p-3 rounded-md'>
            <p className='font-medium text-indigo-300 mb-2'>
              How to Add Images:
            </p>
            <ol className='list-decimal pl-5 space-y-1'>
              <li>
                Click the{' '}
                <span className='text-white font-medium'>Upload Image</span>{' '}
                button above
              </li>
              <li>Select your image file (JPG, PNG, etc.)</li>
              <li>Wait for the upload to complete</li>
              <li>
                The markdown code will be{' '}
                <span className='text-white font-medium'>
                  automatically copied
                </span>{' '}
                to your clipboard
              </li>
              <li>Place your cursor where you want the image to appear</li>
              <li>
                Paste the markdown code (
                <kbd className='px-1 py-0.5 bg-gray-700 rounded text-white'>
                  Ctrl+V
                </kbd>{' '}
                or{' '}
                <kbd className='px-1 py-0.5 bg-gray-700 rounded text-white'>
                  ⌘+V
                </kbd>
                )
              </li>
            </ol>
            <p className='mt-2 text-indigo-200 text-[11px]'>
              The markdown format{' '}
              <code className='bg-gray-700/70 px-1 rounded'>
                ![image description](image-url)
              </code>{' '}
              will be used.
            </p>
          </div>
        </div>

        <div className='custom-mde-wrapper'>
          <ReactMde
            ref={editorRef}
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
              textArea: {
                onFocus: saveCursorPosition,
                onClick: saveCursorPosition,
                onKeyUp: saveCursorPosition,
                className:
                  'custom-mde-textarea w-full text-base text-gray-700 bg-white',
                style: {
                  minHeight: '400px',
                  fontSize: '16px',
                  lineHeight: '1.6',
                  padding: '16px',
                },
              },
              preview: {
                className: 'custom-mde-preview',
                style: {
                  padding: '16px',
                  minHeight: '400px',
                  backgroundColor: '#1e293b',
                  color: '#f1f5f9',
                },
              },
            }}
            paste={{
              saveImage: handleImageUpload,
            }}
            className='custom-mde rounded-b-lg border border-purple-500/30'
          />
        </div>
      </div>

      <style jsx global>{`
        .custom-mde {
          border-radius: 0 0 0.5rem 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
            0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }

        .custom-mde .mde-header {
          background-color: #2d3748;
          border-bottom: 1px solid rgba(124, 58, 237, 0.3);
          padding: 8px;
        }

        .custom-mde .mde-tabs button {
          color: #e2e8f0;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }

        .custom-mde .mde-tabs button:hover {
          background-color: rgba(124, 58, 237, 0.2);
        }

        .custom-mde .mde-tabs button.selected {
          background-color: rgba(124, 58, 237, 0.3);
          color: #f3f4f6;
        }

        .custom-mde .mde-text {
          min-height: 400px;
          font-size: 16px;
          line-height: 1.6;
          padding: 16px;
          color: #f1f5f9;
          background-color: #1e293b;
        }

        .custom-mde .mde-preview {
          min-height: 400px;
          padding: 16px;
          background-color: #1e293b;
          color: #f1f5f9;
        }

        .custom-mde .mde-preview .mde-preview-content {
          padding: 16px;
        }

        .custom-mde .mde-preview .mde-preview-content h1,
        .custom-mde .mde-preview .mde-preview-content h2,
        .custom-mde .mde-preview .mde-preview-content h3,
        .custom-mde .mde-preview .mde-preview-content h4,
        .custom-mde .mde-preview .mde-preview-content h5,
        .custom-mde .mde-preview .mde-preview-content h6 {
          color: #f3f4f6;
          margin-top: 1.5em;
          margin-bottom: 0.75em;
        }

        .custom-mde .mde-preview .mde-preview-content p {
          margin-bottom: 1em;
        }

        .custom-mde .mde-preview .mde-preview-content ul,
        .custom-mde .mde-preview .mde-preview-content ol {
          padding-left: 2em;
          margin-bottom: 1em;
        }

        .custom-mde .mde-preview .mde-preview-content blockquote {
          border-left: 4px solid rgba(124, 58, 237, 0.5);
          padding-left: 1em;
          margin-left: 0;
          color: #cbd5e1;
        }

        .custom-mde .mde-preview .mde-preview-content img {
          max-width: 100%;
          border-radius: 0.375rem;
          margin: 1em 0;
        }

        .custom-mde .mde-preview .mde-preview-content code {
          background-color: rgba(15, 23, 42, 0.5);
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-family: monospace;
        }

        .custom-mde .mde-preview .mde-preview-content pre {
          background-color: rgba(15, 23, 42, 0.8);
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          margin: 1em 0;
        }
      `}</style>

      <input
        type='file'
        ref={inputRef}
        style={{ display: 'none' }}
        className='text-zinc-800'
        accept='image/*'
        onChange={handleFileSelected}
      />
    </div>
  );
}
