// Site Images Utility
// Fetches and manages site images from Firebase

import { db } from './firebase-config.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Convert Google Drive link to direct image URL
export function convertGoogleDriveUrl(url) {
    if (!url) return '';
    
    // If already converted, return as is
    if (url.includes('drive.google.com/uc?')) {
        return url;
    }
    
    // Extract file ID from various Google Drive URL formats
    let fileId = null;
    
    // Format: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([^\/]+)/);
    if (match1) fileId = match1[1];
    
    // Format: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) fileId = match2[1];
    
    // Format: https://drive.google.com/uc?id=FILE_ID
    const match3 = url.match(/uc\?id=([^&]+)/);
    if (match3) fileId = match3[1];
    
    if (fileId) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
    
    return url; // Return original if no match
}

// Cache for site images
let siteImagesCache = null;
let isLoading = false;
let loadPromise = null;

// Get all site images
export async function getSiteImages() {
    // Return cached data if available
    if (siteImagesCache) {
        return siteImagesCache;
    }
    
    // If already loading, wait for that promise
    if (isLoading && loadPromise) {
        return loadPromise;
    }
    
    isLoading = true;
    loadPromise = (async () => {
        try {
            const docRef = doc(db, 'site-settings', 'images');
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                siteImagesCache = docSnap.data();
                return siteImagesCache;
            }
            
            // Return default fallback
            return {
                logo: 'assets/images/logo.jpg',
                cert: 'assets/images/cert.jpg',
                students: 'assets/images/students.jpg',
                building: 'assets/images/building.jpg',
                class: 'assets/images/class.jpg',
                leadership: 'assets/images/leadership.jpg',
                abt: 'assets/images/abt.jpg',
                story: 'assets/images/story.jpg',
                placeholder: 'assets/images/logo.jpg'
            };
        } catch (error) {
            console.error('Error fetching site images:', error);
            // Return local fallback on error
            return {
                logo: 'assets/images/logo.jpg',
                cert: 'assets/images/cert.jpg',
                students: 'assets/images/students.jpg',
                building: 'assets/images/building.jpg',
                class: 'assets/images/class.jpg',
                leadership: 'assets/images/leadership.jpg',
                abt: 'assets/images/abt.jpg',
                story: 'assets/images/story.jpg',
                placeholder: 'assets/images/logo.jpg'
            };
        } finally {
            isLoading = false;
            loadPromise = null;
        }
    })();
    
    return loadPromise;
}

// Get specific image URL
export async function getSiteImage(imageName, fallback = null) {
    try {
        const images = await getSiteImages();
        const url = images[imageName] || images[`${imageName}_converted`];
        
        if (url) {
            // Use converted URL if available, otherwise convert it
            return images[`${imageName}_converted`] || convertGoogleDriveUrl(url);
        }
        
        // Return fallback or default
        return fallback || `assets/images/${imageName}.jpg`;
    } catch (error) {
        console.error(`Error fetching image ${imageName}:`, error);
        return fallback || `assets/images/${imageName}.jpg`;
    }
}

// Load image into an img element
export async function loadSiteImage(imgElement, imageName, fallback = null) {
    try {
        const imageUrl = await getSiteImage(imageName, fallback);
        imgElement.src = imageUrl;
        
        // Add error handler to fall back to local image
        imgElement.onerror = function() {
            const localFallback = fallback || `assets/images/${imageName}.jpg`;
            if (this.src !== localFallback) {
                this.src = localFallback;
            }
        };
    } catch (error) {
        console.error(`Error loading image ${imageName}:`, error);
        imgElement.src = fallback || `assets/images/${imageName}.jpg`;
    }
}

// Load all site images on a page
export async function loadAllSiteImages() {
    try {
        // Find all images with data-site-image attribute
        const images = document.querySelectorAll('[data-site-image]');
        
        images.forEach(async (img) => {
            const imageName = img.getAttribute('data-site-image');
            const fallback = img.getAttribute('data-fallback') || img.src;
            await loadSiteImage(img, imageName, fallback);
        });
    } catch (error) {
        console.error('Error loading all site images:', error);
    }
}

// Listen for image updates in real-time
export function watchSiteImages(callback) {
    const docRef = doc(db, 'site-settings', 'images');
    
    return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
            siteImagesCache = docSnap.data();
            if (callback) callback(siteImagesCache);
        }
    }, (error) => {
        console.error('Error watching site images:', error);
    });
}

// Replace all images on page load
export async function replacePageImages() {
    try {
        const images = await getSiteImages();
        
        // Replace logo images
        document.querySelectorAll('img[src*="logo.jpg"]').forEach(img => {
            if (images.logo && images.logo.trim()) {
                const convertedUrl = convertGoogleDriveUrl(images.logo);
                if (convertedUrl && convertedUrl.trim()) {
                    img.src = convertedUrl;
                }
            }
        });
        
        // Replace cert images
        document.querySelectorAll('img[src*="cert.jpg"]').forEach(img => {
            if (images.cert) {
                img.src = convertGoogleDriveUrl(images.cert);
            }
        });
        
        // Replace students images
        document.querySelectorAll('img[src*="students.jpg"]').forEach(img => {
            if (images.students) {
                img.src = convertGoogleDriveUrl(images.students);
            }
        });
        
        // Replace building images
        document.querySelectorAll('img[src*="building.jpg"]').forEach(img => {
            if (images.building) {
                img.src = convertGoogleDriveUrl(images.building);
            }
        });
        
        // Replace class images
        document.querySelectorAll('img[src*="class.jpg"]').forEach(img => {
            if (images.class) {
                img.src = convertGoogleDriveUrl(images.class);
            }
        });
        
        // Replace leadership images
        document.querySelectorAll('img[src*="leadership.jpg"]').forEach(img => {
            if (images.leadership) {
                img.src = convertGoogleDriveUrl(images.leadership);
            }
        });
        
        // Replace about images
        document.querySelectorAll('img[src*="abt.jpg"]').forEach(img => {
            if (images.abt) {
                img.src = convertGoogleDriveUrl(images.abt);
            }
        });
        
        // Replace story images
        document.querySelectorAll('img[src*="story.jpg"]').forEach(img => {
            if (images.story) {
                img.src = convertGoogleDriveUrl(images.story);
            }
        });
        
        // Replace placeholder images
        document.querySelectorAll('img[src*="logo.jpg"]').forEach(img => {
            if (images.placeholder) {
                img.src = convertGoogleDriveUrl(images.placeholder);
            }
        });
        
        console.log('Site images replaced successfully');
    } catch (error) {
        console.error('Error replacing page images:', error);
    }
}

// Initialize site images on page load
export function initSiteImages() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            replacePageImages();
            loadAllSiteImages();
        });
    } else {
        replacePageImages();
        loadAllSiteImages();
    }
}

// Make functions globally available
window.getSiteImages = getSiteImages;
window.getSiteImage = getSiteImage;
window.loadSiteImage = loadSiteImage;
window.loadAllSiteImages = loadAllSiteImages;
window.convertGoogleDriveUrl = convertGoogleDriveUrl;
window.replacePageImages = replacePageImages;
window.initSiteImages = initSiteImages;
