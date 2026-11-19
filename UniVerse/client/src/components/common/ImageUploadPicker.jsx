import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Sparkles,
  X,
  Check,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { uploadApi } from '../../api/uploadApi';
import Spinner from './Spinner';

export const DEFAULT_PRESET_BANNERS = [
  {
    name: 'Tech / Cyber Matrix',
    url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Coding / Software',
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'AI & Data Science',
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Campus / Academic',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Design & Photography',
    url: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    name: 'Innovation & Startup',
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
  },
];

const compressImage = (file, maxWidth = 1400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          width,
          height,
          originalSize: file.size,
          compressedLength: dataUrl.length,
        });
      };
      img.onerror = (err) => reject(new Error('Failed to decode image file.'));
    };
    reader.onerror = (err) => reject(new Error('Failed to read file from disk.'));
  });
};

const ImageUploadPicker = ({
  value = '',
  onChange,
  label = 'Cover Banner & Branding',
  subLabel = 'Upload a photo from your device, take an image with camera, or choose a curated theme.',
  title = '',
  namePrefix = 'group',
  presets = DEFAULT_PRESET_BANNERS,
  aspectRatio = 'banner', 
}) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadMeta, setUploadMeta] = useState(null);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (value && !value.startsWith('data:') && !value.startsWith('/uploads/')) {
      setUrlInput(value);
    }
  }, [value]);

  const processFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, GIF).');
      return;
    }

    setUploadError('');
    setUploading(true);

    try {
      const { dataUrl, width, height } = await compressImage(file, 1400, 0.86);

      const res = await uploadApi.uploadImage(dataUrl, `${namePrefix}-cover`);

      if (res && res.url) {
        onChange(res.url);
        setUploadMeta({
          filename: file.name,
          dimensions: `${width}×${height}px`,
          approxSize: `${Math.round(file.size / 1024)} KB`,
        });
      } else {
        onChange(dataUrl);
      }
    } catch (err) {
      console.error('Image processing/upload failed:', err);
      setUploadError(err.message || 'Failed to process selected image.');
    } finally {
      setUploading(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          break;
        }
      }
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUploadError('');
  };

  const handleSelectPreset = (url) => {
    onChange(url);
    setUrlInput('');
    setUploadError('');
    setUploadMeta(null);
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
    setUploadMeta(null);
    setUploadError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div
      ref={containerRef}
      onPaste={handlePaste}
      className="space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            {label}
          </h3>
          {subLabel && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subLabel}
            </p>
          )}
        </div>

        {value && (
          <button
            type="button"
            onClick={handleRemoveImage}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
            Remove Image
          </button>
        )}
      </div>

      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200/90 dark:border-slate-800 shadow-inner group">
        <div
          className={`w-full overflow-hidden ${
            aspectRatio === 'banner'
              ? 'h-44 sm:h-52'
              : aspectRatio === 'square'
              ? 'h-48 w-48 mx-auto'
              : 'h-56'
          }`}
        >
          {value ? (
            <img
              src={value}
              alt="Cover Preview"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              onError={(e) => {
                e.target.src = presets[0]?.url || '';
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-2 p-6 text-center bg-slate-900/60">
              <UploadCloud className="w-8 h-8 text-slate-600 dark:text-slate-400" />
              <p className="text-xs font-semibold">No image selected</p>
              <p className="text-[11px] text-slate-500">
                Upload a photo, snap one with your camera, or pick a campus preset below.
              </p>
            </div>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex items-end p-4 pointer-events-none">
          <div className="text-white w-full flex items-end justify-between gap-2">
            <div className="min-w-0">
              <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider text-brand-300 bg-brand-950/80 px-2 py-0.5 rounded-md border border-brand-800/60 mb-1">
                Live Banner Preview
              </span>
              <p className="text-base font-extrabold truncate text-white drop-shadow-sm">
                {title || 'Your Community Name'}
              </p>
            </div>
            {uploadMeta && (
              <span className="shrink-0 text-[10px] text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                {uploadMeta.dimensions} • {uploadMeta.approxSize}
              </span>
            )}
          </div>
        </div>

        {uploading && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2 z-20">
            <Spinner size="md" className="border-brand-500" />
            <p className="text-xs font-bold tracking-wide">Optimizing & Uploading Image...</p>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition ${
            activeTab === 'upload'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          Upload / Camera
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition ${
            activeTab === 'presets'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Theme Presets
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-1.5 px-3.5 py-2 border-b-2 transition ${
            activeTab === 'url'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400 font-extrabold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          Image URL
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/50 scale-[0.99]'
                : 'border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shadow-xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-white">
                  Click to browse from your computer or drag and drop
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Supports JPG, PNG, WebP, GIF • You can also press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-[10px] font-mono">Ctrl + V</kbd> to paste
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              Browse Files
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition"
            >
              <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              Take Photo / Camera
            </button>

            <span className="text-[11px] text-slate-400 ml-auto">
              Auto-optimized & compressed
            </span>
          </div>
        </div>
      )}

      {activeTab === 'presets' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {presets.map((preset) => {
              const isSelected = value === preset.url;
              return (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`group relative h-20 rounded-xl overflow-hidden border-2 text-left transition ${
                    isSelected
                      ? 'border-brand-600 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <img
                    src={preset.url}
                    alt={preset.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-slate-950/60 p-2 flex items-end justify-between">
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {preset.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-brand-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'url' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyUrl}
              disabled={!urlInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
            >
              Apply URL
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Paste any direct image URL from Unsplash, Google Drive, or your institution's website.
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageUploadPicker;

