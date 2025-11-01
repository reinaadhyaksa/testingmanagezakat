// src/hooks/useImageOptimizer.js - Fixed Version
import { useState, useEffect } from 'react';
import {
    optimizeCloudinaryUrl,
    getThumbnailUrl,
    getMediumUrl,
    getLargeUrl,
    isCloudinaryUrl,
    getOptimizedDefaultAvatar
} from '../utils/cloudinaryOptimizer';

export const useImageOptimizer = (originalUrl, options = {}) => {
    const [optimizedUrl, setOptimizedUrl] = useState(getOptimizedDefaultAvatar());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const optimizeImage = async () => {
            try {
                setLoading(true);
                setError(null);

                // Handle empty or invalid URLs
                if (!originalUrl || typeof originalUrl !== 'string') {
                    setOptimizedUrl(getOptimizedDefaultAvatar());
                    setLoading(false);
                    return;
                }

                let url = originalUrl;

                // Hanya optimasi jika URL Cloudinary
                if (isCloudinaryUrl(originalUrl)) {
                    url = optimizeCloudinaryUrl(originalUrl, options);
                }

                // Preload image untuk memastikan URL valid
                await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = () => reject(new Error('Gagal memuat gambar'));
                    img.src = url;
                });

                setOptimizedUrl(url);

            } catch (err) {
                console.error('Error optimizing image:', err);
                setError(err.message);
                // Fallback ke default avatar jika optimasi gagal
                setOptimizedUrl(getOptimizedDefaultAvatar());
            } finally {
                setLoading(false);
            }
        };

        optimizeImage();
    }, [originalUrl, JSON.stringify(options)]);

    return {
        optimizedUrl,
        loading,
        error
    };
};

// Hook khusus untuk use case tertentu
export const useThumbnail = (originalUrl, size = 100) => {
    return useImageOptimizer(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width: size,
        height: size,
        crop: 'fill',
        dpr: 'auto'
    });
};

export const useCardImage = (originalUrl) => {
    return useImageOptimizer(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width: 400,
        dpr: 'auto'
    });
};

export const useModalImage = (originalUrl) => {
    return useImageOptimizer(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width: 800,
        dpr: 'auto'
    });
};

export default useImageOptimizer;