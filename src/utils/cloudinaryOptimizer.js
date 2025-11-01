// src/utils/cloudinaryOptimizer.js - Enhanced Version

/**
 * Optimasi URL Cloudinary dengan berbagai transformasi
 * @param {string} originalUrl - URL asli Cloudinary
 * @param {Object} options - Opsi optimasi
 * @returns {string} URL yang sudah dioptimasi
 */
// src/utils/cloudinaryOptimizer.js - Enhanced error handling

/**
 * Optimasi URL Cloudinary dengan error handling
 */
export const optimizeCloudinaryUrl = (originalUrl, options = {}) => {
    // Handle empty or invalid URLs
    if (!originalUrl || typeof originalUrl !== 'string') {
        return getOptimizedDefaultAvatar();
    }

    // Jika bukan URL Cloudinary, return as-is dengan warning
    if (!originalUrl.includes('cloudinary.com')) {
        console.warn('Non-Cloudinary URL detected:', originalUrl);
        return originalUrl;
    }

    try {
        const url = new URL(originalUrl);
        const pathSegments = url.pathname.split('/');

        // Cari index di mana 'upload' berada
        const uploadIndex = pathSegments.indexOf('upload');

        if (uploadIndex === -1) {
            console.warn('Invalid Cloudinary URL format:', originalUrl);
            return originalUrl;
        }

        // Bangun transformasi
        const transformations = [];

        // Format
        transformations.push(`f_${options.format || 'webp'}`);

        // Quality
        transformations.push(`q_${options.quality || 'auto'}`);

        // Width dan Height
        if (options.width && options.height) {
            transformations.push(`w_${options.width},h_${options.height}`);
            if (options.crop) {
                transformations.push(`c_${options.crop}`);
            }
        } else if (options.width) {
            transformations.push(`w_${options.width}`);
        } else if (options.height) {
            transformations.push(`h_${options.height}`);
        }

        // DPR (Device Pixel Ratio)
        transformations.push(`dpr_${options.dpr || 'auto'}`);

        // Effects
        if (options.effect) {
            transformations.push(`e_${options.effect}`);
        }

        // Border radius
        if (options.radius) {
            transformations.push(`r_${options.radius}`);
        }

        // Background color
        if (options.background) {
            transformations.push(`b_${options.background}`);
        }

        // Hapus metadata EXIF
        transformations.push('fl_strip_profile');

        // Gabungkan semua transformasi
        const transformationString = transformations.join(',');

        // Sisipkan transformasi setelah 'upload'
        pathSegments.splice(uploadIndex + 1, 0, transformationString);

        // Rebuild URL
        url.pathname = pathSegments.join('/');

        return url.toString();

    } catch (error) {
        console.error('Error optimizing Cloudinary URL:', error);
        // Return default avatar sebagai fallback
        return getOptimizedDefaultAvatar();
    }
};

/**
 * Optimasi untuk thumbnail/small images dengan rounded corners
 */
export const getThumbnailUrl = (originalUrl, width = 100, height = 100) => {
    return optimizeCloudinaryUrl(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width,
        height,
        crop: 'fill',
        dpr: 'auto',
        radius: 8, // rounded corners
        background: 'white'
    });
};

/**
 * Optimasi untuk medium images (card display)
 */
export const getMediumUrl = (originalUrl, width = 400) => {
    return optimizeCloudinaryUrl(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width,
        dpr: 'auto'
    });
};

/**
 * Optimasi untuk large images (modal/preview)
 */
export const getLargeUrl = (originalUrl, width = 800) => {
    return optimizeCloudinaryUrl(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width,
        dpr: 'auto'
    });
};

/**
 * Optimasi untuk gambar responsif dengan breakpoints
 */
export const getResponsiveUrls = (originalUrl, breakpoints = [400, 800, 1200]) => {
    return breakpoints.map(width =>
        optimizeCloudinaryUrl(originalUrl, {
            format: 'webp',
            quality: 'auto',
            width,
            dpr: 'auto'
        })
    );
};

/**
 * Optimasi untuk gambar dengan placeholder/blur effect
 */
export const getBlurUrl = (originalUrl, width = 50, height = 50) => {
    return optimizeCloudinaryUrl(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width,
        height,
        crop: 'fill',
        effect: 'blur:100',
        dpr: 'auto'
    });
};

/**
 * Optimasi untuk gambar dengan grayscale effect
 */
export const getGrayscaleUrl = (originalUrl, width = 400) => {
    return optimizeCloudinaryUrl(originalUrl, {
        format: 'webp',
        quality: 'auto',
        width,
        effect: 'grayscale',
        dpr: 'auto'
    });
};

/**
 * Deteksi apakah URL adalah Cloudinary
 */
export const isCloudinaryUrl = (url) => {
    return url && url.includes('cloudinary.com');
};

/**
 * Validasi URL Cloudinary
 */
export const isValidCloudinaryUrl = (url) => {
    if (!url) return false;

    try {
        const cloudinaryRegex = /https?:\/\/res\.cloudinary\.com\/.+\/image\/upload\/.+/;
        return cloudinaryRegex.test(url);
    } catch {
        return false;
    }
};

export default {
    optimizeCloudinaryUrl,
    getThumbnailUrl,
    getMediumUrl,
    getLargeUrl,
    getResponsiveUrls,
    getBlurUrl,
    getGrayscaleUrl,
    isCloudinaryUrl,
    isValidCloudinaryUrl
};

// src/utils/cloudinaryOptimizer.js - Tambahkan fungsi ini

/**
 * Default avatar yang sudah dioptimasi
 */
export const getOptimizedDefaultAvatar = () => {
    return optimizeCloudinaryUrl(
        'https://res.cloudinary.com/du4wegspv/image/upload/v1761952457/WhatsApp_Image_2025-10-20_at_7.17.16_PM_mjvj2q.jpg',
        {
            format: 'webp',
            quality: 'auto',
            width: 300,
            height: 300,
            crop: 'fill',
            dpr: 'auto'
        }
    );
};

/**
 * Safe URL optimization - handle empty/undefined URLs
 */
export const safeOptimizeUrl = (url, options = {}) => {
    if (!url || typeof url !== 'string') {
        return getOptimizedDefaultAvatar();
    }

    try {
        return optimizeCloudinaryUrl(url, options);
    } catch (error) {
        console.error('Error optimizing URL:', error);
        return getOptimizedDefaultAvatar();
    }
};