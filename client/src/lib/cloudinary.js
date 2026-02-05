// Cloudinary upload utility

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Upload an image to Cloudinary
 * @param {File} file - The image file to upload
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<string>} - The URL of the uploaded image
 */
export async function uploadImageToCloudinary(file, onProgress = null) {
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file')
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
        throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
        throw new Error('Image size must be less than 5MB')
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', 'nexus-cloud/profiles') // Organize uploads in a folder

    try {
        const xhr = new XMLHttpRequest()
        const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`

        return new Promise((resolve, reject) => {
            // Track upload progress
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = Math.round((e.loaded / e.total) * 100)
                        onProgress(percentComplete)
                    }
                })
            }

            xhr.addEventListener('load', () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText)
                    resolve(response.secure_url)
                } else {
                    reject(new Error('Upload failed. Please try again.'))
                }
            })

            xhr.addEventListener('error', () => {
                reject(new Error('Network error. Please check your connection.'))
            })

            xhr.open('POST', uploadUrl)
            xhr.send(formData)
        })
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        throw new Error('Failed to upload image. Please try again.')
    }
}

/**
 * Preview an image file before upload
 * @param {File} file - The image file to preview
 * @returns {Promise<string>} - Data URL for preview
 */
export function previewImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}
