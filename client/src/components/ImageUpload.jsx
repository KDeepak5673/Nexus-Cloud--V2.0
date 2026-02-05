import React, { useState, useRef } from 'react'
import { uploadImageToCloudinary, previewImage } from '../lib/cloudinary'

function ImageUpload({ onUploadComplete, currentImageUrl = null, label = 'Profile Picture' }) {
    const [preview, setPreview] = useState(currentImageUrl)
    const [uploading, setUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)

    const handleFileSelect = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        setError('')

        try {
            // Show preview immediately
            const previewUrl = await previewImage(file)
            setPreview(previewUrl)

            // Upload to Cloudinary
            setUploading(true)
            setUploadProgress(0)

            const uploadedUrl = await uploadImageToCloudinary(file, (progress) => {
                setUploadProgress(progress)
            })

            setPreview(uploadedUrl)
            onUploadComplete(uploadedUrl)
        } catch (err) {
            setError(err.message)
            setPreview(currentImageUrl) // Restore original preview
        } finally {
            setUploading(false)
            setUploadProgress(0)
        }
    }

    const handleRemove = () => {
        setPreview(null)
        onUploadComplete(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    return (
        <div className="image-upload-container">
            <label className="image-upload-label">{label}</label>

            <div className="image-upload-wrapper">
                {preview ? (
                    <div className="image-preview-container">
                        <img
                            src={preview}
                            alt="Preview"
                            className="image-preview"
                            onError={() => setPreview(null)}
                        />
                        {!uploading && (
                            <button
                                type="button"
                                className="image-remove-btn"
                                onClick={handleRemove}
                                title="Remove image"
                            >
                                ×
                            </button>
                        )}
                        {uploading && (
                            <div className="upload-progress-overlay">
                                <div className="upload-progress-bar">
                                    <div
                                        className="upload-progress-fill"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <span className="upload-progress-text">{uploadProgress}%</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="image-upload-placeholder">
                        <svg
                            className="upload-icon"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                        </svg>
                        <p>Click to upload image</p>
                        <span className="upload-hint">PNG, JPG, GIF or WebP (max 5MB)</span>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="image-upload-input"
                />
            </div>

            {error && (
                <div className="image-upload-error">
                    <span className="error-icon">⚠️</span>
                    {error}
                </div>
            )}

            <style jsx>{`
        .image-upload-container {
          margin-bottom: 1.5rem;
        }

        .image-upload-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #374151;
        }

        .image-upload-wrapper {
          position: relative;
          width: 100%;
          cursor: pointer;
        }

        .image-upload-input {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }

        .image-upload-input:disabled {
          cursor: not-allowed;
        }

        .image-upload-placeholder {
          border: 2px dashed #d1d5db;
          border-radius: 12px;
          padding: 3rem 2rem;
          text-align: center;
          background: #f9fafb;
          transition: all 0.3s ease;
        }

        .image-upload-placeholder:hover {
          border-color: #9ca3af;
          background: #f3f4f6;
        }

        .upload-icon {
          width: 48px;
          height: 48px;
          margin: 0 auto 1rem;
          color: #9ca3af;
        }

        .image-upload-placeholder p {
          margin: 0 0 0.5rem 0;
          font-weight: 500;
          color: #374151;
        }

        .upload-hint {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .image-preview-container {
          position: relative;
          width: 150px;
          height: 150px;
          margin: 0 auto;
        }

        .image-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
        }

        .image-remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: 2px solid white;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          transition: all 0.2s ease;
        }

        .image-remove-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }

        .upload-progress-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .upload-progress-bar {
          width: 80%;
          height: 8px;
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
          overflow: hidden;
        }

        .upload-progress-fill {
          height: 100%;
          background: #10b981;
          transition: width 0.3s ease;
        }

        .upload-progress-text {
          color: white;
          font-weight: 600;
          font-size: 1.125rem;
        }

        .image-upload-error {
          margin-top: 0.5rem;
          padding: 0.75rem;
          background: #fee2e2;
          color: #dc2626;
          border-radius: 8px;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .error-icon {
          font-size: 1rem;
        }
      `}</style>
        </div>
    )
}

export default ImageUpload
