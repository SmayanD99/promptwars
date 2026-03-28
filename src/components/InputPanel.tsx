'use client';

import React, { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useGeolocation } from '@/hooks/useGeolocation';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES, INPUT_EXAMPLES } from '@/lib/constants';
import type { BridgeInput } from '@/types';

interface InputPanelProps {
  onSubmit: (input: BridgeInput) => void;
  isLoading: boolean;
}

export function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<{ name: string; base64: string; mimeType: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [useLocation, setUseLocation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, transcript, isSupported: voiceSupported, startListening, stopListening } = useVoiceInput();
  const { latitude, longitude, requestLocation, isLoading: locationLoading } = useGeolocation();

  // Merge voice transcript into text
  const displayText = isListening ? text + transcript : text;

  const handleFileSelected = useCallback((selectedFile: File) => {
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      alert(`Unsupported file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      alert(`File too large. Maximum: ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data after the comma
      const base64 = result.split(',')[1];
      setFile({ name: selectedFile.name, base64, mimeType: selectedFile.type });
    };
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelected(droppedFile);
  }, [handleFileSelected]);

  const handleFileInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) handleFileSelected(selectedFile);
  }, [handleFileSelected]);

  const handleVoiceToggle = useCallback(() => {
    if (isListening) {
      stopListening();
      // Merge transcript into text
      setText((prev) => prev + transcript);
    } else {
      startListening();
    }
  }, [isListening, transcript, startListening, stopListening]);

  const handleSubmit = useCallback(() => {
    const input: BridgeInput = {};

    const finalText = displayText.trim();
    if (finalText) input.text = finalText;
    if (file) {
      input.fileBase64 = file.base64;
      input.fileMimeType = file.mimeType;
      input.fileName = file.name;
    }

    if (useLocation && latitude && longitude) {
      input.latitude = latitude;
      input.longitude = longitude;
    }

    if (!input.text && !input.fileBase64) {
      alert('Please provide some input — type text, upload a file, or use voice input.');
      return;
    }

    onSubmit(input);
  }, [displayText, file, useLocation, latitude, longitude, onSubmit]);

  const handleExampleClick = useCallback((example: string) => {
    setText(example);
  }, []);

  const handleLocationToggle = useCallback(() => {
    setUseLocation((prev) => {
      if (!prev) requestLocation();
      return !prev;
    });
  }, [requestLocation]);

  const canSubmit = (displayText.trim() || file) && !isLoading;

  return (
    <section className="input-panel glass-card" aria-label="Input section">
      <h2 className="input-panel-title">
        <span aria-hidden="true">📥</span> What do you need help with?
      </h2>

      {/* Text area */}
      <label htmlFor="bridge-input" className="sr-only">
        Describe your situation, paste text, or provide context for your uploaded file
      </label>
      <textarea
        id="bridge-input"
        className="input-textarea"
        placeholder="Type anything... describe symptoms, paste a legal notice, enter a weather alert, or add context for your uploaded file."
        value={displayText}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
        aria-describedby="input-hint"
      />
      <span id="input-hint" className="sr-only">
        You can also use voice input or upload a file using the buttons below
      </span>

      {/* Action buttons */}
      <div className="input-actions" role="toolbar" aria-label="Input tools">
        {voiceSupported && (
          <button
            type="button"
            className={`input-action-btn ${isListening ? 'active' : ''}`}
            onClick={handleVoiceToggle}
            disabled={isLoading}
            aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            aria-pressed={isListening}
            id="voice-input-btn"
          >
            {isListening ? '⏹ Stop' : '🎤 Voice'}
          </button>
        )}
        <button
          type="button"
          className="input-action-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          aria-label="Upload a file"
          id="file-upload-btn"
        >
          📎 Upload File
        </button>
        <button
          type="button"
          className="input-action-btn"
          onClick={() => {
            // Try to access camera directly
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = 'environment';
            input.onchange = (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) handleFileSelected(f);
            };
            input.click();
          }}
          disabled={isLoading}
          aria-label="Take a photo"
          id="camera-btn"
        >
          📷 Camera
        </button>
      </div>

      {/* File drop zone */}
      <div
        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        role="region"
        aria-label="File upload drop zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-drop-input"
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileInput}
          disabled={isLoading}
          aria-label="Choose file to upload"
          id="file-input"
          tabIndex={-1}
        />
        {file ? (
          <>
            <div className="file-drop-icon" aria-hidden="true">✅</div>
            <div className="file-name">
              <span>{file.name}</span>
              <button
                type="button"
                className="file-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                aria-label={`Remove file ${file.name}`}
              >
                ✕
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="file-drop-icon" aria-hidden="true">📄</div>
            <p className="file-drop-text">
              Drop a file here or <strong>click to browse</strong>
            </p>
            <p className="file-drop-text" style={{ fontSize: '0.72rem', marginTop: '4px' }}>
              Images, PDFs, text files — up to 10MB
            </p>
          </>
        )}
      </div>

      {/* Location toggle */}
      <label className="location-toggle" htmlFor="location-toggle">
        <input
          type="checkbox"
          id="location-toggle"
          checked={useLocation}
          onChange={handleLocationToggle}
          disabled={isLoading}
        />
        <span>
          {locationLoading
            ? '📍 Getting location...'
            : useLocation && latitude
              ? `📍 Location: ${latitude.toFixed(2)}, ${longitude?.toFixed(2)}`
              : '📍 Include my location for nearby suggestions'}
        </span>
      </label>

      {/* Submit */}
      <button
        type="button"
        className="submit-btn"
        onClick={handleSubmit}
        disabled={!canSubmit}
        aria-label="Analyze input and get structured actions"
        id="submit-btn"
      >
        <span>
          {isLoading ? (
            <>⏳ Processing...</>
          ) : (
            <>🚀 Bridge to Action</>
          )}
        </span>
      </button>

      {/* Example prompts */}
      <div className="examples-row" role="list" aria-label="Example inputs">
        {INPUT_EXAMPLES.slice(0, 4).map((example) => (
          <button
            key={example}
            type="button"
            className="example-chip"
            onClick={() => handleExampleClick(example)}
            disabled={isLoading}
            role="listitem"
          >
            {example.length > 45 ? example.slice(0, 45) + '...' : example}
          </button>
        ))}
      </div>
    </section>
  );
}
