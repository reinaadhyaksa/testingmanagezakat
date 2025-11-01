// src/components/OptimizedImage.jsx - Fixed Version
import { useState } from 'react';
import useImageOptimizer from '../utils/useImageOptimizer';
import { getBlurUrl, getOptimizedDefaultAvatar } from '../utils/cloudinaryOptimizer';

const OptimizedImage = ({
    src,
    alt = '',
    width,
    height,
    className = '',
    fallbackSrc = '',
    loading: htmlLoading = 'lazy',
    onError,
    onLoad,
    enableBlurPlaceholder = true,
    ...props
}) => {
    const [imageLoaded, setImageLoaded] = useState(false);

    // Handle empty src - gunakan fallback atau default avatar
    const actualSrc = src || fallbackSrc || getOptimizedDefaultAvatar();

    const { optimizedUrl, loading, error } = useImageOptimizer(actualSrc, {
        width: width || undefined,
        height: height || undefined,
        format: 'webp',
        quality: 'auto',
        dpr: 'auto'
    });

    const blurPlaceholderUrl = enableBlurPlaceholder && actualSrc ? getBlurUrl(actualSrc) : '';

    const handleError = (e) => {
        // Jika ada error dan fallbackSrc tersedia, gunakan fallback
        if (fallbackSrc && fallbackSrc !== e.target.src) {
            e.target.src = fallbackSrc;
        } else if (!fallbackSrc) {
            // Jika tidak ada fallback, gunakan default avatar
            e.target.src = getOptimizedDefaultAvatar();
        }
        onError?.(e);
    };

    const handleLoad = (e) => {
        setImageLoaded(true);
        onLoad?.(e);
    };

    // Jika tidak ada src sama sekali, jangan render gambar
    if (!actualSrc) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
                <div className="text-gray-400 text-sm">No image</div>
            </div>
        );
    }

    if (loading && enableBlurPlaceholder && blurPlaceholderUrl) {
        return (
            <div className={`relative overflow-hidden ${className}`}>
                <img
                    src={blurPlaceholderUrl}
                    alt={`${alt} (loading...)`}
                    width={width}
                    height={height}
                    className={`w-full h-full object-cover filter blur-md scale-110 ${className}`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {enableBlurPlaceholder && blurPlaceholderUrl && !imageLoaded && (
                <img
                    src={blurPlaceholderUrl}
                    alt={`${alt} (loading...)`}
                    width={width}
                    height={height}
                    className={`absolute inset-0 w-full h-full object-cover filter blur-md scale-110 ${className}`}
                />
            )}
            <img
                src={error ? (fallbackSrc || getOptimizedDefaultAvatar()) : optimizedUrl}
                alt={alt}
                width={width}
                height={height}
                className={`w-full h-full object-cover transition-opacity duration-300 ${enableBlurPlaceholder && !imageLoaded ? 'opacity-0' : 'opacity-100'
                    } ${className}`}
                loading={htmlLoading}
                onError={handleError}
                onLoad={handleLoad}
                {...props}
            />
        </div>
    );
};

export default OptimizedImage;