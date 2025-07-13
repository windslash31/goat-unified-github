import React from 'react';

// The base URL for your production image service, read from environment variables.
const IMAGE_CDN_URL = process.env.REACT_APP_IMAGE_CDN_URL;

/**
 * An optimized Avatar component that works in both local and production environments.
 * @param {string} imagePath - The unique identifier for the avatar (e.g., employee's email or a unique ID).
 * @param {string} alt - The alt text for the image.
 * @param {number} size - The desired width and height of the avatar in pixels.
 */
export const Avatar = ({ imagePath, alt, size = 40 }) => {
    // --- LOCAL DEVELOPMENT LOGIC ---
    // Checks if the app is NOT in production mode.
    if (process.env.REACT_APP_IMAGE_MODE !== 'production') {
        // For local development, we can keep using the simple pravatar.cc service.
        const localSrc = `https://i.pravatar.cc/${size}?u=${imagePath}`;
        return (
            <img
                src={localSrc}
                alt={alt}
                width={size}
                height={size}
                className="rounded-full object-cover border-2 border-gray-300"
                loading="lazy"
            />
        );
    }

    // --- PRODUCTION LOGIC ---
    // Fallback for production if there's no image path or the CDN is not configured.
    if (!imagePath || !IMAGE_CDN_URL) {
        return <div style={{ width: size, height: size }} className="bg-gray-300 rounded-full" />;
    }

    // Construct URLs for the production image service.
    const webpSrc = `${IMAGE_CDN_URL}${imagePath}?w=${size}&h=${size}&format=webp&quality=80`;
    const jpegSrc = `${IMAGE_CDN_URL}${imagePath}?w=${size}&h=${size}&format=jpeg&quality=85`;

    return (
        <picture>
            <source srcSet={webpSrc} type="image/webp" />
            <source srcSet={jpegSrc} type="image/jpeg" />
            <img
                src={jpegSrc}
                alt={alt}
                width={size}
                height={size}
                className="rounded-full object-cover border-2 border-gray-300"
                loading="lazy"
            />
        </picture>
    );
};