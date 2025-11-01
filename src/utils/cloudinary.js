import { CLOUDINARY_NAME, CLOUDINARY_PRESET } from "./data"

export const cloudinaryService = {
    async uploadImage(file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('upload_preset', CLOUDINARY_PRESET)
        formData.append('cloud_name', CLOUDINARY_NAME)

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Upload failed')
            }

            return {
                image_url: data.secure_url,
                cloudinary_public_id: data.public_id
            }
        } catch (error) {
            throw new Error(`Upload failed: ${error.message}`)
        }
    },

    async deleteImage(publicId) {
        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/destroy`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        public_id: publicId,
                        upload_preset: CLOUDINARY_PRESET
                    })
                }
            )

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error?.message || 'Delete failed')
            }

            return data
        } catch (error) {
            throw new Error(`Delete failed: ${error.message}`)
        }
    }
}