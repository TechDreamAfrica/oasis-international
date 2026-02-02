// Firebase Configuration
import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { initSiteImages } from './site-images.js';

// Export for use in other modules
window.db = db;
window.auth = auth;
export { db, auth };

// Initialize site images on page load
initSiteImages();

// Helper function to convert Google Drive share links to direct image URLs
function convertGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmedUrl = url.trim();
    
    // Check if it's a Google Drive link
    if (trimmedUrl.includes('drive.google.com')) {
        // Extract file ID from various Google Drive URL formats
        let fileId = null;

        // Format: https://drive.google.com/file/d/FILE_ID/view or /view?usp=sharing
        const match1 = trimmedUrl.match(/\/file\/d\/([^\/\?&]+)/);
        if (match1) {
            fileId = match1[1];
        }

        // Format: https://drive.google.com/open?id=FILE_ID
        if (!fileId) {
            const match2 = trimmedUrl.match(/[?&]id=([^&]+)/);
            if (match2) {
                fileId = match2[1];
            }
        }

        // If we found a file ID, return the direct image URL (using /uc?export=view for better compatibility)
        if (fileId && fileId.trim()) {
            const convertedUrl = `https://drive.google.com/uc?export=view&id=${fileId.trim()}`;
            console.log('Converted Google Drive URL:', { original: url, converted: convertedUrl });
            return convertedUrl;
        }
    }

    // Return original URL if it's not a Google Drive link or direct image URL
    return trimmedUrl;
}

// Export helper function
window.convertGoogleDriveUrl = convertGoogleDriveUrl;

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
        const icon = mobileMenuBtn.querySelector('i');
        icon.classList.toggle('fa-bars');
        icon.classList.toggle('fa-times');
    });
}

// Carousel Functionality
let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.carousel-indicator');
const prevBtn = document.getElementById('prev-slide');
const nextBtn = document.getElementById('next-slide');

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.style.opacity = i === index ? '1' : '0';
        slide.style.zIndex = i === index ? '10' : '1';
    });

    indicators.forEach((indicator, i) => {
        if (i === index) {
            indicator.style.background = 'white';
        } else {
            indicator.style.background = 'rgba(255, 255, 255, 0.5)';
        }
    });
}

function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
}

function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    showSlide(currentSlide);
}

if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
}

if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
}

indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
    });
});

// Auto-advance carousel
if (slides.length > 0) {
    setInterval(nextSlide, 5000);
}

// Stats Counter Animation
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target.toLocaleString();
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start).toLocaleString();
        }
    }, 16);
}

// Intersection Observer for Stats
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const target = parseInt(entry.target.getAttribute('data-count'));
            animateCounter(entry.target, target);
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => {
    statsObserver.observe(el);
});

// Form Validation and Submission
async function handleFormSubmit(formId, collectionName) {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        data.timestamp = new Date().toISOString();
        data.status = 'pending';

        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> Submitting...';
            submitBtn.disabled = true;

            await addDoc(collection(db, collectionName), data);

            showToast('Form submitted successfully!', 'success');
            form.reset();

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast('Error submitting form. Please try again.', 'error');

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
        }
    });
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// Back to Top Button
const backToTop = document.createElement('button');
backToTop.className = 'back-to-top';
backToTop.innerHTML = '<i class="fas fa-arrow-up"></i>';
backToTop.setAttribute('aria-label', 'Back to top');
document.body.appendChild(backToTop);

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href !== '#!') {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        }
    });
});

// Lazy Loading Images
const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            observer.unobserve(img);
        }
    });
});

document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});

// Initialize Forms
handleFormSubmit('contact-form', 'contacts');
handleFormSubmit('credential-form', 'credentials');
handleFormSubmit('sponsor-form', 'sponsors');
handleFormSubmit('admission-form', 'admissions');

// Get URL Parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

// ============ DYNAMIC DATA RETRIEVAL FUNCTIONS ============

// Load Gallery Images (for carousel and gallery page)
async function loadGalleryImages(limit = 4) {
    try {
        const q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'), limit(limit));
        const snapshot = await getDocs(q);
        const images = [];
        snapshot.forEach(doc => {
            images.push({ id: doc.id, ...doc.data() });
        });
        return images;
    } catch (error) {
        console.error('Error loading gallery:', error);
        return [];
    }
}

// Load Ministries
async function loadMinistries(limit = null) {
    try {
        let q = collection(db, 'ministries');
        if (limit) {
            q = query(q, orderBy('order'), limit(limit));
        } else {
            q = query(q, orderBy('order'));
        }
        const snapshot = await getDocs(q);
        const ministries = [];
        snapshot.forEach(doc => {
            ministries.push({ id: doc.id, ...doc.data() });
        });
        return ministries;
    } catch (error) {
        console.error('Error loading ministries:', error);
        return [];
    }
}

// Load Leadership
async function loadLeadership(limit = null) {
    try {
        let q = collection(db, 'leadership');
        if (limit) {
            q = query(q, orderBy('order'), limit(limit));
        } else {
            q = query(q, orderBy('order'));
        }
        const snapshot = await getDocs(q);
        const leaders = [];
        snapshot.forEach(doc => {
            leaders.push({ id: doc.id, ...doc.data() });
        });
        return leaders;
    } catch (error) {
        console.error('Error loading leadership:', error);
        return [];
    }
}

// Load News
async function loadNews(limit = 3) {
    try {
        // Query all news, then filter and sort in JavaScript to avoid composite index requirement
        const q = query(collection(db, 'news'));
        const snapshot = await getDocs(q);
        const news = [];

        snapshot.forEach(doc => {
            const data = doc.data();
            // Only include published articles
            if (data.published !== false) {
                news.push({
                    id: doc.id,
                    ...data,
                    date: data.publishedAt?.toDate?.() || new Date()
                });
            }
        });

        // Sort by publishedAt descending and limit
        news.sort((a, b) => {
            const dateA = a.publishedAt?.toDate?.() || new Date(0);
            const dateB = b.publishedAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });

        return news.slice(0, limit);
    } catch (error) {
        console.error('Error loading news:', error);
        return [];
    }
}

// Load Events
async function loadEvents(limit = 3) {
    try {
        const q = query(collection(db, 'events'), orderBy('date', 'desc'), limit(limit));
        const snapshot = await getDocs(q);
        const events = [];
        snapshot.forEach(doc => {
            events.push({ id: doc.id, ...doc.data() });
        });
        return events;
    } catch (error) {
        console.error('Error loading events:', error);
        return [];
    }
}

// Load Statistics
async function loadStats() {
    try {
        const snapshot = await getDocs(collection(db, 'statistics'));
        if (!snapshot.empty) {
            return snapshot.docs[0].data();
        }
        return {
            livesImpacted: 1000,
            ministries: 5,
            studentsTrained: 200,
            yearsOfService: 15
        };
    } catch (error) {
        console.error('Error loading stats:', error);
        return {
            livesImpacted: 1000,
            ministries: 5,
            studentsTrained: 200,
            yearsOfService: 15
        };
    }
}

// Update Home Page Carousel with Gallery Images
async function updateCarousel() {
    const carousel = document.getElementById('carousel');
    if (!carousel) return;

    const images = await loadGalleryImages(3);
    if (images.length === 0) return;

    carousel.innerHTML = '';
    images.forEach((img, index) => {
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(img.imageUrl || img.url || img.image) : (img.imageUrl || img.url);
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const slide = document.createElement('div');
        slide.className = `carousel-slide absolute w-full h-full transition-opacity duration-1000 ${index === 0 ? '' : 'opacity-0'}`;
        slide.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-blue-600/60"></div>
            <img src="${imageUrl}" alt="${img.title}" class="w-full h-full object-cover" onerror="this.src='assets/images/logo.jpg'">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center text-white px-4">
                    <h1 class="text-5xl md:text-6xl font-bold mb-4">${img.title || 'Welcome to Oasis IMG'}</h1>
                    <p class="text-xl md:text-2xl mb-8">${img.description || 'Transforming Lives Through the Gospel'}</p>
                </div>
            </div>
        `;
        carousel.appendChild(slide);
    });

    // Reinitialize carousel
    initCarousel();
}

// Initialize/Reinitialize Carousel
function initCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.carousel-indicator');

    if (slides.length === 0) return;

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.opacity = i === index ? '1' : '0';
            slide.style.zIndex = i === index ? '10' : '1';
        });

        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.style.background = 'white';
            } else {
                indicator.style.background = 'rgba(255, 255, 255, 0.5)';
            }
        });
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    // Auto-advance
    setInterval(nextSlide, 5000);
}

// Update Ministries on Home Page
async function updateHomeMinistriesPreview() {
    const container = document.getElementById('ministries-preview');
    if (!container) return;

    const ministries = await loadMinistries(3);
    if (ministries.length === 0) return;

    container.innerHTML = '';
    ministries.forEach(ministry => {
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(ministry.image) : ministry.image;
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${ministry.name}" class="w-full h-48 object-cover" onerror="this.src='assets/images/logo.jpg'">
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-3">${ministry.name}</h3>
                <p class="text-gray-600 mb-4">${ministry.description}</p>
                <a href="ministry-detail.html?id=${ministry.id}" class="text-blue-600 font-semibold hover:text-blue-700">Learn More →</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update Full Leadership Page
async function updateLeadershipPage() {
    const seniorLeadership = document.getElementById('senior-leadership');
    const boardMembers = document.getElementById('board-members');
    const ministryLeaders = document.getElementById('ministry-leaders');

    if (!seniorLeadership && !boardMembers && !ministryLeaders) return;

    const leaders = await loadLeadership();
    if (leaders.length === 0) return;

    // Filter leaders by category
    const senior = leaders.filter(l => l.category === 'senior' || l.category === 'executive');
    const board = leaders.filter(l => l.category === 'board' || l.category === 'elder');
    const ministry = leaders.filter(l => l.category === 'ministry');

    // Render Senior Leadership
    if (seniorLeadership && senior.length > 0) {
        seniorLeadership.innerHTML = '';
        senior.forEach(leader => {
            const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(leader.image) : leader.image;
            const imageUrl = convertedUrl || 'assets/images/logo.jpg';
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-xl overflow-hidden';
            card.innerHTML = `
                <div class="md:flex">
                    <div class="md:flex-shrink-0">
                        <img src="${imageUrl}" alt="${leader.name}" class="h-full w-full md:w-48 object-cover" onerror="this.src='assets/images/logo.jpg'">
                    </div>
                    <div class="p-8">
                        <h4 class="text-2xl font-bold text-gray-900 mb-2">${leader.name}</h4>
                        <p class="text-blue-600 font-semibold mb-4">${leader.title}</p>
                        <p class="text-gray-600 mb-4">${leader.bio || ''}</p>
                        ${leader.social ? `
                        <div class="flex space-x-4">
                            ${leader.social.twitter ? `<a href="${leader.social.twitter}" class="text-blue-600 hover:text-blue-700"><i class="fab fa-twitter text-xl"></i></a>` : ''}
                            ${leader.social.facebook ? `<a href="${leader.social.facebook}" class="text-blue-600 hover:text-blue-700"><i class="fab fa-facebook text-xl"></i></a>` : ''}
                            ${leader.social.linkedin ? `<a href="${leader.social.linkedin}" class="text-blue-600 hover:text-blue-700"><i class="fab fa-linkedin text-xl"></i></a>` : ''}
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
            seniorLeadership.appendChild(card);
        });
    }

    // Render Board Members
    if (boardMembers && board.length > 0) {
        boardMembers.innerHTML = '';
        board.forEach(leader => {
            const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(leader.image) : leader.image;
            const imageUrl = convertedUrl || 'assets/images/logo.jpg';
            const card = document.createElement('div');
            card.className = 'text-center';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${leader.name}" class="w-40 h-40 rounded-full mx-auto mb-4 object-cover shadow-lg" onerror="this.src='assets/images/logo.jpg'">
                <h4 class="text-lg font-bold text-gray-900">${leader.name}</h4>
                <p class="text-gray-600">${leader.title}</p>
            `;
            boardMembers.appendChild(card);
        });
    }

    // Render Ministry Leaders
    if (ministryLeaders && ministry.length > 0) {
        ministryLeaders.innerHTML = '';
        ministry.forEach(leader => {
            const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(leader.image) : leader.image;
            const imageUrl = convertedUrl || 'assets/images/logo.jpg';
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-lg text-center';
            card.innerHTML = `
                <img src="${imageUrl}" alt="${leader.name}" class="w-24 h-24 rounded-full mx-auto mb-4 object-cover" onerror="this.src='assets/images/logo.jpg'">
                <h4 class="font-bold text-gray-900">${leader.name}</h4>
                <p class="text-sm text-gray-600">${leader.title}</p>
            `;
            ministryLeaders.appendChild(card);
        });
    }
}

// Update Leadership Preview on Home Page
async function updateHomeLeadership() {
    const container = document.getElementById('leadership-preview');
    if (!container) return;

    const leaders = await loadLeadership(4);
    if (leaders.length === 0) return;

    container.innerHTML = '';
    leaders.forEach(leader => {
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(leader.image) : leader.image;
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const card = document.createElement('div');
        card.className = 'text-center';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${leader.name}" class="w-32 h-32 rounded-full mx-auto mb-4 object-cover" onerror="this.src='assets/images/logo.jpg'">
            <h3 class="text-lg font-bold text-gray-900">${leader.name}</h3>
            <p class="text-gray-600">${leader.title}</p>
        `;
        container.appendChild(card);
    });
}

// Update Ministries Page
async function updateMinistriesPage() {
    const container = document.getElementById('ministries-list');
    if (!container) return;

    const ministries = await loadMinistries();
    if (ministries.length === 0) return;

    container.innerHTML = '';
    ministries.forEach(ministry => {
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(ministry.image) : ministry.image;
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${ministry.name}" class="w-full h-48 object-cover" onerror="this.src='assets/images/logo.jpg'">
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-3">${ministry.name}</h3>
                <p class="text-gray-600 mb-4">${ministry.description}</p>
                <a href="ministry-detail.html?id=${ministry.id}" class="text-blue-600 font-semibold hover:text-blue-700">Learn More →</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update News on OBI News Page
async function updateOBINewsPage() {
    const container = document.getElementById('obi-news-list');
    if (!container) return;

    const news = await loadNews(12);
    if (news.length === 0) return;

    const categoryColors = {
        'Admissions': 'bg-teal-100 text-teal-800',
        'Events': 'bg-blue-100 text-blue-800',
        'Facilities': 'bg-purple-100 text-purple-800',
        'Academic': 'bg-green-100 text-green-800',
        'Scholarship': 'bg-yellow-100 text-yellow-800',
        'Achievement': 'bg-red-100 text-red-800',
        'default': 'bg-gray-100 text-gray-800'
    };

    container.innerHTML = '';
    news.forEach(item => {
        const categoryClass = categoryColors[item.category] || categoryColors.default;
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(item.image) : item.image;
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover" onerror="this.src='../assets/images/logo.jpg'">
            <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-teal-600">${new Date(item.date).toLocaleDateString()}</span>
                    <span class="${categoryClass} text-xs px-2 py-1 rounded">${item.category || 'News'}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">${item.title}</h3>
                <p class="text-gray-600 mb-4">${item.excerpt || item.content?.substring(0, 100) || ''}...</p>
                <a href="news-item.html?id=${item.id}" class="text-teal-600 font-semibold hover:text-teal-700 inline-flex items-center">
                    Read More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update News on OBI Page Preview
async function updateOBINews() {
    const container = document.getElementById('obi-news-preview');
    if (!container) return;

    const news = await loadNews(3);
    console.log('OBI News items loaded:', news);
    if (news.length === 0) return;

    container.innerHTML = '';
    news.forEach(item => {
        console.log('Processing news item:', item.title, 'Image URL:', item.image);
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(item.image) : item.image;
        console.log('Converted URL:', convertedUrl);
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover" onerror="this.src='../assets/images/logo.jpg'; console.log('Image failed to load:', '${imageUrl}');">
            <div class="p-6">
                <div class="text-sm text-teal-600 mb-2">${new Date(item.date).toLocaleDateString()}</div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">${item.title}</h3>
                <p class="text-gray-600 mb-4">${item.excerpt || item.content?.substring(0, 100) || ''}...</p>
                <a href="news-item.html?id=${item.id}" class="text-teal-600 font-semibold hover:text-teal-700">Read More →</a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update News Preview on Homepage
async function updateHomeNewsPreview() {
    const container = document.getElementById('news-preview');
    if (!container) return;

    const news = await loadNews(3);
    console.log('Home News items loaded:', news);

    if (news.length === 0) {
        container.innerHTML = `
            <div class="text-center col-span-3 py-8">
                <i class="fas fa-newspaper text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No news articles available at the moment.</p>
            </div>
        `;
        return;
    }

    const categoryColors = {
        'Admissions': 'bg-blue-100 text-blue-800',
        'Events': 'bg-green-100 text-green-800',
        'Academic': 'bg-purple-100 text-purple-800',
        'General': 'bg-gray-100 text-gray-800',
        'Announcement': 'bg-yellow-100 text-yellow-800'
    };

    container.innerHTML = '';
    news.forEach(item => {
        const categoryClass = categoryColors[item.category] || categoryColors['General'];
        console.log('Processing home news item:', item.title, 'Image URL:', item.image);
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(item.image) : item.image;
        console.log('Converted URL for home:', convertedUrl);
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const excerpt = item.excerpt || item.content?.substring(0, 120) + '...' || '';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${item.title}" class="w-full h-48 object-cover" onerror="this.src='assets/images/logo.jpg'; console.log('Image failed to load:', '${imageUrl}');">
            <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-blue-600">
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span class="${categoryClass} text-xs px-2 py-1 rounded">${item.category || 'General'}</span>
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-3">${item.title}</h3>
                <p class="text-gray-600 mb-4">${excerpt}</p>
                <a href="obi/news-item.html?id=${item.id}" class="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center">
                    Read More <i class="fas fa-arrow-right ml-2"></i>
                </a>
            </div>
        `;
        container.appendChild(card);
    });
}

// Update Events Preview on Homepage
async function updateHomeEventsPreview() {
    const container = document.getElementById('events-preview');
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Load all events first
    const allEvents = await loadEvents(20);

    // Filter for upcoming events only
    const upcomingEvents = allEvents.filter(event => {
        const eventDate = new Date(event.date || '1970-01-01');
        return eventDate >= today;
    }).slice(0, 3); // Take only 3 upcoming events

    if (upcomingEvents.length === 0) {
        container.innerHTML = `
            <div class="text-center col-span-3 py-8">
                <i class="fas fa-calendar text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No upcoming events at the moment.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    upcomingEvents.forEach(event => {
        const eventDate = new Date(event.date || '1970-01-01');
        const imageUrl = convertGoogleDriveUrl(event.image) || 'assets/images/logo.jpg';
        const excerpt = event.description?.substring(0, 120) + '...' || '';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition transform hover:-translate-y-1';
        card.innerHTML = `
            <img src="${imageUrl}" alt="${event.title}" class="w-full h-48 object-cover" onerror="this.src='assets/images/logo.jpg'">
            <div class="p-6">
                <div class="flex items-center justify-between mb-3">
                    <span class="text-sm text-blue-600">
                        <i class="fas fa-calendar mr-1"></i>
                        ${eventDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    ${event.category ? `<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">${event.category}</span>` : ''}
                </div>
                <h3 class="text-xl font-bold text-gray-900 mb-2">${event.title}</h3>
                ${event.time ? `<p class="text-sm text-gray-500 mb-2"><i class="fas fa-clock mr-1"></i>${event.time}</p>` : ''}
                ${event.location ? `<p class="text-sm text-gray-500 mb-3"><i class="fas fa-map-marker-alt mr-1"></i>${event.location}</p>` : ''}
                <p class="text-gray-600 mb-4">${excerpt}</p>
                ${event.featured ? '<span class="inline-block bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mb-2"><i class="fas fa-star mr-1"></i>Featured</span>' : ''}
            </div>
        `;
        container.appendChild(card);
    });
}

// Update Gallery Page
async function updateGalleryPage() {
    const container = document.getElementById('gallery-grid');
    if (!container) return;

    const images = await loadGalleryImages(12);

    if (images.length === 0) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-12">
                <i class="fas fa-images text-5xl text-gray-300 mb-4"></i>
                <p class="text-gray-500">No images available in the gallery yet.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    images.forEach(img => {
        // Convert Google Drive URL if needed
        const convertedUrl = window.convertGoogleDriveUrl ? window.convertGoogleDriveUrl(img.imageUrl || img.url || img.image) : (img.imageUrl || img.url || img.image);
        const imageUrl = convertedUrl || 'assets/images/logo.jpg';
        const uploadDate = img.uploadDate ? new Date(img.uploadDate).toLocaleDateString() : '';

        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-lg overflow-hidden group hover:shadow-xl transition';
        card.innerHTML = `
            <div class="relative overflow-hidden">
                <img src="${imageUrl}" alt="${img.title}" class="w-full h-64 object-cover group-hover:scale-110 transition duration-300" onerror="this.src='assets/images/logo.jpg'">
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                    <div class="text-white">
                        <h3 class="text-xl font-bold mb-1">${img.title}</h3>
                        <div class="flex items-center space-x-3 text-sm">
                            ${img.category ? `<span class="bg-white/20 px-2 py-1 rounded">${img.category}</span>` : ''}
                            ${uploadDate ? `<span><i class="fas fa-calendar mr-1"></i>${uploadDate}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            ${img.description ? `
                <div class="p-4">
                    <p class="text-gray-600 text-sm">${img.description}</p>
                </div>
            ` : ''}
        `;
        container.appendChild(card);
    });
}

// Update OBI Events Page
async function updateOBIEventsPage() {
    const upcomingContainer = document.getElementById('upcoming-events');
    const pastContainer = document.getElementById('past-events');

    if (!upcomingContainer && !pastContainer) return;

    const events = await loadEvents(20);
    if (events.length === 0) return;

    const now = new Date();
    const upcoming = events.filter(e => new Date(e.date) >= now);
    const past = events.filter(e => new Date(e.date) < now);

    // Render Upcoming Events
    if (upcomingContainer && upcoming.length > 0) {
        upcomingContainer.innerHTML = '';
        upcoming.forEach(event => {
            const eventDate = new Date(event.date);
            const card = document.createElement('div');
            card.className = 'bg-white p-6 rounded-lg shadow-lg flex flex-col md:flex-row';
            card.innerHTML = `
                <div class="bg-teal-600 text-white p-6 rounded-lg text-center md:mr-6 mb-4 md:mb-0">
                    <div class="text-4xl font-bold">${eventDate.getDate()}</div>
                    <div class="text-lg">${eventDate.toLocaleString('default', { month: 'short' }).toUpperCase()}</div>
                    <div class="text-sm">${eventDate.getFullYear()}</div>
                </div>
                <div class="flex-1">
                    <h3 class="text-2xl font-bold text-gray-900 mb-2">${event.title}</h3>
                    <p class="text-gray-600 mb-4">${event.description}</p>
                    <div class="flex flex-wrap gap-4 text-sm text-gray-600">
                        ${event.time ? `<span><i class="fas fa-clock text-teal-600 mr-2"></i>${event.time}</span>` : ''}
                        ${event.location ? `<span><i class="fas fa-map-marker-alt text-teal-600 mr-2"></i>${event.location}</span>` : ''}
                    </div>
                </div>
            `;
            upcomingContainer.appendChild(card);
        });
    }

    // Render Past Events
    if (pastContainer && past.length > 0) {
        pastContainer.innerHTML = '';
        past.slice(0, 6).forEach(event => {
            const card = document.createElement('div');
            card.className = 'bg-white rounded-lg shadow-lg overflow-hidden';
            card.innerHTML = `
                <img src="${event.image || '../assets/images/logo.jpg'}" alt="${event.title}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <div class="text-sm text-teal-600 mb-2">${new Date(event.date).toLocaleDateString()}</div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">${event.title}</h3>
                    <p class="text-gray-600">${event.description?.substring(0, 80) || ''}...</p>
                </div>
            `;
            pastContainer.appendChild(card);
        });
    }
}

// Update Statistics
async function updateStatistics() {
    const stats = await loadStats();

    const elements = {
        livesImpacted: document.querySelector('[data-stat="lives"]'),
        ministries: document.querySelector('[data-stat="ministries"]'),
        studentsTrained: document.querySelector('[data-stat="students"]'),
        yearsOfService: document.querySelector('[data-stat="years"]')
    };

    if (elements.livesImpacted) elements.livesImpacted.setAttribute('data-count', stats.livesImpacted);
    if (elements.ministries) elements.ministries.setAttribute('data-count', stats.ministries);
    if (elements.studentsTrained) elements.studentsTrained.setAttribute('data-count', stats.studentsTrained);
    if (elements.yearsOfService) elements.yearsOfService.setAttribute('data-count', stats.yearsOfService);
}

// ============ AUTHENTICATION FUNCTIONS ============

// Check auth state
onAuthStateChanged(auth, (user) => {
    const signInBtn = document.getElementById('sign-in-btn');
    const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');
    const userMenu = document.getElementById('user-menu');
    const mobileUserMenu = document.getElementById('mobile-user-menu');

    if (user) {
        // User is signed in
        if (signInBtn) signInBtn.classList.add('hidden');
        if (mobileSignInBtn) mobileSignInBtn.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.remove('hidden');

        // Store user in window for access
        window.currentUser = user;
    } else {
        // User is signed out
        if (signInBtn) signInBtn.classList.remove('hidden');
        if (mobileSignInBtn) mobileSignInBtn.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
        if (mobileUserMenu) mobileUserMenu.classList.add('hidden');

        window.currentUser = null;
    }
});

// Sign In Modal
function showSignInModal() {
    const modal = document.createElement('div');
    modal.id = 'sign-in-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-bold text-gray-900">Sign In</h2>
                <button onclick="closeSignInModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times text-2xl"></i>
                </button>
            </div>

            <div id="sign-in-tabs" class="flex border-b mb-6">
                <button onclick="switchTab('email')" id="email-tab" class="flex-1 pb-2 border-b-2 border-blue-600 text-blue-600 font-semibold">Email</button>
                <button onclick="switchTab('register')" id="register-tab" class="flex-1 pb-2 text-gray-500">Register</button>
            </div>

            <div id="email-sign-in">
                <form id="email-sign-in-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="sign-in-email" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="sign-in-password" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold">
                        Sign In
                    </button>
                </form>
            </div>

            <div id="register-form" class="hidden">
                <form id="email-register-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" id="register-name" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="register-email" required class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="register-password" required minlength="6" class="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600">
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition font-semibold">
                        Create Account
                    </button>
                </form>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    // Email Sign In
    document.getElementById('email-sign-in-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('sign-in-email').value;
        const password = document.getElementById('sign-in-password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            closeSignInModal();
            showToast('Successfully signed in!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    // Email Registration
    document.getElementById('email-register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: name });

            // Save user profile to Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: name,
                email: email,
                createdAt: new Date().toISOString(),
                role: 'user'
            });

            closeSignInModal();
            showToast('Account created successfully!', 'success');
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

function closeSignInModal() {
    const modal = document.getElementById('sign-in-modal');
    if (modal) modal.remove();
}

function switchTab(tab) {
    const emailTab = document.getElementById('email-tab');
    const registerTab = document.getElementById('register-tab');
    const emailSignIn = document.getElementById('email-sign-in');
    const registerForm = document.getElementById('register-form');

    if (tab === 'email') {
        emailTab.className = 'flex-1 pb-2 border-b-2 border-blue-600 text-blue-600 font-semibold';
        registerTab.className = 'flex-1 pb-2 text-gray-500';
        emailSignIn.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.className = 'flex-1 pb-2 border-b-2 border-blue-600 text-blue-600 font-semibold';
        emailTab.className = 'flex-1 pb-2 text-gray-500';
        registerForm.classList.remove('hidden');
        emailSignIn.classList.add('hidden');
    }
}

// Sign Out
async function handleSignOut() {
    try {
        await signOut(auth);
        showToast('Signed out successfully', 'success');
        window.location.href = 'index.html';
    } catch (error) {
        showToast(error.message, 'error');
    }
}

// Attach sign-in handlers
document.addEventListener('DOMContentLoaded', () => {
    const signInBtn = document.getElementById('sign-in-btn');
    const mobileSignInBtn = document.getElementById('mobile-sign-in-btn');

    if (signInBtn) {
        signInBtn.addEventListener('click', () => {
            window.location.href = 'dashboard/login.html';
        });
    }
    if (mobileSignInBtn) {
        mobileSignInBtn.addEventListener('click', () => {
            window.location.href = 'dashboard/login.html';
        });
    }
});

// Export functions for global use
window.showToast = showToast;
window.getUrlParameter = getUrlParameter;
window.handleFormSubmit = handleFormSubmit;
window.loadGalleryImages = loadGalleryImages;
window.loadMinistries = loadMinistries;
window.loadLeadership = loadLeadership;
window.loadNews = loadNews;
window.loadEvents = loadEvents;
window.loadStats = loadStats;
window.showSignInModal = showSignInModal;
window.closeSignInModal = closeSignInModal;
window.switchTab = switchTab;
window.handleSignOut = handleSignOut;

// Auto-load dynamic content on page load
window.addEventListener('load', async () => {
    document.body.classList.add('loaded');

    // Load dynamic content based on page
    if (document.getElementById('carousel')) {
        await updateCarousel();
    }

    if (document.getElementById('ministries-preview')) {
        await updateHomeMinistriesPreview();
    }

    if (document.getElementById('leadership-preview')) {
        await updateHomeLeadership();
    }

    if (document.getElementById('news-preview')) {
        await updateHomeNewsPreview();
    }

    if (document.getElementById('events-preview')) {
        await updateHomeEventsPreview();
    }

    if (document.getElementById('senior-leadership') || document.getElementById('board-members') || document.getElementById('ministry-leaders')) {
        await updateLeadershipPage();
    }

    if (document.getElementById('ministries-list')) {
        await updateMinistriesPage();
    }

    if (document.getElementById('gallery-grid')) {
        await updateGalleryPage();
    }

    if (document.getElementById('obi-news-list')) {
        await updateOBINewsPage();
    }

    if (document.getElementById('obi-news-preview')) {
        await updateOBINews();
    }

    if (document.getElementById('upcoming-events') || document.getElementById('past-events')) {
        await updateOBIEventsPage();
    }

    await updateStatistics();
});

// Service Worker Registration (for PWA - optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to enable service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

console.log('Oasis IMG Website Loaded Successfully');