// Admin Panel JavaScript with Firebase CRUD operations and Cloudinary integration
import { db, auth } from './firebase-config.js';
import { 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    getDoc,
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Cloudinary Configuration
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET'; // Create an unsigned upload preset in Cloudinary

// Global state
let currentUser = null;
let currentEditingId = null;
let currentEditingType = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
    setupEventListeners();
});

// Authentication
function initializeAuth() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            showAdminPanel();
            updateUserDisplay();
            loadDashboard();
        } else {
            currentUser = null;
            showLoginModal();
        }
    });
}

function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
    document.getElementById('admin-content').classList.add('hidden');
}

function showAdminPanel() {
    document.getElementById('login-modal').classList.add('hidden');
    document.getElementById('admin-content').classList.remove('hidden');
}

function updateUserDisplay() {
    if (currentUser) {
        document.getElementById('admin-user').textContent = currentUser.email;
    }
}

// Event Listeners
function setupEventListeners() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    
    // Logout button
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });
    
    // Add buttons
    document.getElementById('add-blog-btn').addEventListener('click', () => showBlogModal());
    document.getElementById('add-leader-btn').addEventListener('click', () => showLeaderModal());
    document.getElementById('add-ministry-btn').addEventListener('click', () => showMinistryModal());
    document.getElementById('add-gallery-btn').addEventListener('click', () => showGalleryModal());
    
    // Modal close
    document.getElementById('close-modal').addEventListener('click', closeModal);
}

// Authentication handlers
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('login-submit');
    const errorDiv = document.getElementById('login-error');
    
    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        
        await signInWithEmailAndPassword(auth, email, password);
        errorDiv.classList.add('hidden');
        
    } catch (error) {
        errorDiv.textContent = getFirebaseErrorMessage(error.code);
        errorDiv.classList.remove('hidden');
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Sign In';
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Logout error:', error);
        alert('Error signing out. Please try again.');
    }
}

// Tab Management
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active', 'border-b-2', 'border-green-500', 'text-green-600');
        btn.classList.add('text-gray-500', 'hover:text-gray-700');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active', 'border-b-2', 'border-green-500', 'text-green-600');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-500', 'hover:text-gray-700');
    
    // Show/hide tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    // Load content based on tab
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'blogs':
            loadBlogs();
            break;
        case 'leadership':
            loadLeadership();
            break;
        case 'ministries':
            loadMinistries();
            break;
        case 'gallery':
            loadGallery();
            break;
        case 'contacts':
            loadContacts();
            break;
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [blogsCount, leadersCount, ministriesCount, galleryCount] = await Promise.all([
            getCollectionCount('blogs'),
            getCollectionCount('leadership'),
            getCollectionCount('ministries'),
            getCollectionCount('gallery')
        ]);
        
        document.getElementById('blogs-count').textContent = blogsCount;
        document.getElementById('leadership-count').textContent = leadersCount;
        document.getElementById('ministries-count').textContent = ministriesCount;
        document.getElementById('gallery-count').textContent = galleryCount;
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

async function getCollectionCount(collectionName) {
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.size;
}

// Blogs Management
async function loadBlogs() {
    try {
        const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('blogs-table-body');
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No blogs found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const blog = { id: doc.id, ...doc.data() };
            tbody.appendChild(createBlogRow(blog));
        });
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

function createBlogRow(blog) {
    const row = document.createElement('tr');
    const date = blog.createdAt ? new Date(blog.createdAt.toDate()).toLocaleDateString() : 'N/A';
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${blog.title || 'Untitled'}</div>
            <div class="text-sm text-gray-500">${(blog.excerpt || '').substring(0, 50)}...</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${blog.author || 'Unknown'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${blog.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                ${blog.published ? 'Published' : 'Draft'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="editBlog('${blog.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteBlog('${blog.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function showBlogModal(blogData = null) {
    const isEdit = blogData !== null;
    currentEditingType = 'blog';
    currentEditingId = isEdit ? blogData.id : null;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Blog' : 'Add New Blog';
    
    document.getElementById('modal-content').innerHTML = `
        <form id="blog-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" id="blog-title" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${blogData?.title || ''}" placeholder="Blog title">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Author *</label>
                <input type="text" id="blog-author" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${blogData?.author || ''}" placeholder="Author name">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea id="blog-excerpt" rows="2"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Brief description">${blogData?.excerpt || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea id="blog-content" rows="6" required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Blog content">${blogData?.content || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Featured Image</label>
                <div class="space-y-2">
                    <input type="file" id="blog-image" accept="image/*"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <div id="blog-image-preview" class="hidden">
                        <img class="h-32 w-32 object-cover rounded-md">
                    </div>
                </div>
            </div>
            
            <div>
                <label class="flex items-center">
                    <input type="checkbox" id="blog-published" ${blogData?.published ? 'checked' : ''}>
                    <span class="ml-2 text-sm font-medium text-gray-700">Published</span>
                </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button type="submit" id="save-blog-btn"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    ${isEdit ? 'Update' : 'Save'} Blog
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('universal-modal').classList.remove('hidden');
    
    // Setup form submission
    document.getElementById('blog-form').addEventListener('submit', saveBlog);
    
    // Setup image preview
    if (blogData?.imageUrl) {
        const preview = document.getElementById('blog-image-preview');
        preview.querySelector('img').src = blogData.imageUrl;
        preview.classList.remove('hidden');
    }
    
    document.getElementById('blog-image').addEventListener('change', previewImage);
}

async function saveBlog(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-blog-btn');
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        let imageUrl = '';
        const imageFile = document.getElementById('blog-image').files[0];
        
        if (imageFile) {
            imageUrl = await uploadToCloudinary(imageFile);
        }
        
        const blogData = {
            title: document.getElementById('blog-title').value,
            author: document.getElementById('blog-author').value,
            excerpt: document.getElementById('blog-excerpt').value,
            content: document.getElementById('blog-content').value,
            published: document.getElementById('blog-published').checked,
            imageUrl: imageUrl || (currentEditingId ? await getCurrentImageUrl('blogs', currentEditingId) : ''),
            updatedAt: serverTimestamp()
        };
        
        if (currentEditingId) {
            await updateDoc(doc(db, 'blogs', currentEditingId), blogData);
        } else {
            blogData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'blogs'), blogData);
        }
        
        closeModal();
        loadBlogs();
        showNotification('Blog saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving blog:', error);
        showNotification('Error saving blog. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveBtn.innerHTML = currentEditingId ? 'Update Blog' : 'Save Blog';
    }
}

// Leadership Management
async function loadLeadership() {
    try {
        const q = query(collection(db, 'leadership'), orderBy('position', 'asc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('leadership-table-body');
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No leaders found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const leader = { id: doc.id, ...doc.data() };
            tbody.appendChild(createLeaderRow(leader));
        });
    } catch (error) {
        console.error('Error loading leadership:', error);
    }
}

function createLeaderRow(leader) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <img class="h-12 w-12 rounded-full object-cover" 
                 src="${leader.imageUrl || 'assets/images/placeholder.jpg'}" 
                 alt="${leader.name}">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${leader.name || 'Unnamed'}</div>
            <div class="text-sm text-gray-500">${leader.title || ''}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${leader.position || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${leader.order || 0}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="editLeader('${leader.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteLeader('${leader.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function showLeaderModal(leaderData = null) {
    const isEdit = leaderData !== null;
    currentEditingType = 'leader';
    currentEditingId = isEdit ? leaderData.id : null;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Leader' : 'Add New Leader';
    
    document.getElementById('modal-content').innerHTML = `
        <form id="leader-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" id="leader-name" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${leaderData?.name || ''}" placeholder="Full name">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Position/Title *</label>
                <input type="text" id="leader-position" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${leaderData?.position || ''}" placeholder="e.g., Senior Pastor, Board Chairman">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title/Description</label>
                <input type="text" id="leader-title"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${leaderData?.title || ''}" placeholder="Additional title or description">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea id="leader-bio" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Biography">${leaderData?.bio || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                <input type="number" id="leader-order"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${leaderData?.order || 0}" placeholder="0" min="0">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                <input type="file" id="leader-image" accept="image/*"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <div id="leader-image-preview" class="hidden mt-2">
                    <img class="h-32 w-32 object-cover rounded-md">
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button type="submit" id="save-leader-btn"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    ${isEdit ? 'Update' : 'Save'} Leader
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('universal-modal').classList.remove('hidden');
    
    // Setup form submission
    document.getElementById('leader-form').addEventListener('submit', saveLeader);
    
    // Setup image preview
    if (leaderData?.imageUrl) {
        const preview = document.getElementById('leader-image-preview');
        preview.querySelector('img').src = leaderData.imageUrl;
        preview.classList.remove('hidden');
    }
    
    document.getElementById('leader-image').addEventListener('change', previewImage);
}

async function saveLeader(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-leader-btn');
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        let imageUrl = '';
        const imageFile = document.getElementById('leader-image').files[0];
        
        if (imageFile) {
            imageUrl = await uploadToCloudinary(imageFile);
        }
        
        const leaderData = {
            name: document.getElementById('leader-name').value,
            position: document.getElementById('leader-position').value,
            title: document.getElementById('leader-title').value,
            bio: document.getElementById('leader-bio').value,
            order: parseInt(document.getElementById('leader-order').value) || 0,
            imageUrl: imageUrl || (currentEditingId ? await getCurrentImageUrl('leadership', currentEditingId) : ''),
            updatedAt: serverTimestamp()
        };
        
        if (currentEditingId) {
            await updateDoc(doc(db, 'leadership', currentEditingId), leaderData);
        } else {
            leaderData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'leadership'), leaderData);
        }
        
        closeModal();
        loadLeadership();
        showNotification('Leader saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving leader:', error);
        showNotification('Error saving leader. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveBtn.innerHTML = currentEditingId ? 'Update Leader' : 'Save Leader';
    }
}

// Utility functions
async function uploadToCloudinary(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        
        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error('Upload failed');
        }
        
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw new Error('Image upload failed');
    }
}

function previewImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const previewId = e.target.id.replace('-image', '-image-preview');
    const preview = document.getElementById(previewId);
    
    if (preview && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.querySelector('img').src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function closeModal() {
    document.getElementById('universal-modal').classList.add('hidden');
    currentEditingId = null;
    currentEditingType = null;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

function getFirebaseErrorMessage(code) {
    switch (code) {
        case 'auth/user-not-found':
            return 'No user found with this email address.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/invalid-email':
            return 'Invalid email address.';
        case 'auth/user-disabled':
            return 'This user account has been disabled.';
        default:
            return 'Authentication failed. Please try again.';
    }
}

async function getCurrentImageUrl(collection, docId) {
    try {
        const docRef = doc(db, collection, docId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data().imageUrl || '' : '';
    } catch (error) {
        console.error('Error getting current image URL:', error);
        return '';
    }
}

// Make functions globally available
window.editBlog = async (id) => {
    const docRef = doc(db, 'blogs', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        showBlogModal({ id, ...docSnap.data() });
    }
};

window.deleteBlog = async (id) => {
    if (confirm('Are you sure you want to delete this blog?')) {
        try {
            await deleteDoc(doc(db, 'blogs', id));
            loadBlogs();
            showNotification('Blog deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting blog:', error);
            showNotification('Error deleting blog. Please try again.', 'error');
        }
    }
};

window.editLeader = async (id) => {
    const docRef = doc(db, 'leadership', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        showLeaderModal({ id, ...docSnap.data() });
    }
};

window.deleteLeader = async (id) => {
    if (confirm('Are you sure you want to delete this leader?')) {
        try {
            await deleteDoc(doc(db, 'leadership', id));
            loadLeadership();
            showNotification('Leader deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting leader:', error);
            showNotification('Error deleting leader. Please try again.', 'error');
        }
    }
};

window.closeModal = closeModal;

// Ministries Management
async function loadMinistries() {
    try {
        const q = query(collection(db, 'ministries'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('ministries-table-body');
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No ministries found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const ministry = { id: doc.id, ...doc.data() };
            tbody.appendChild(createMinistryRow(ministry));
        });
    } catch (error) {
        console.error('Error loading ministries:', error);
    }
}

function createMinistryRow(ministry) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
            <img class="h-12 w-16 object-cover rounded" 
                 src="${ministry.imageUrl || 'assets/images/placeholder.jpg'}" 
                 alt="${ministry.name}">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${ministry.name || 'Unnamed'}</div>
            <div class="text-sm text-gray-500">${(ministry.description || '').substring(0, 50)}...</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${ministry.category || 'General'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ministry.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${ministry.active ? 'Active' : 'Inactive'}
            </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="editMinistry('${ministry.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteMinistry('${ministry.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function showMinistryModal(ministryData = null) {
    const isEdit = ministryData !== null;
    currentEditingType = 'ministry';
    currentEditingId = isEdit ? ministryData.id : null;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Ministry' : 'Add New Ministry';
    
    document.getElementById('modal-content').innerHTML = `
        <form id="ministry-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ministry Name *</label>
                <input type="text" id="ministry-name" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${ministryData?.name || ''}" placeholder="Ministry name">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select id="ministry-category"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Church Building" ${ministryData?.category === 'Church Building' ? 'selected' : ''}>Church Building</option>
                    <option value="Orphan Support" ${ministryData?.category === 'Orphan Support' ? 'selected' : ''}>Orphan Support</option>
                    <option value="Minister Training" ${ministryData?.category === 'Minister Training' ? 'selected' : ''}>Minister Training</option>
                    <option value="Community Outreach" ${ministryData?.category === 'Community Outreach' ? 'selected' : ''}>Community Outreach</option>
                    <option value="Education" ${ministryData?.category === 'Education' ? 'selected' : ''}>Education</option>
                    <option value="General" ${ministryData?.category === 'General' ? 'selected' : ''}>General</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea id="ministry-description" rows="4" required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Ministry description">${ministryData?.description || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" id="ministry-location"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${ministryData?.location || ''}" placeholder="Ministry location">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Leader/Contact Person</label>
                <input type="text" id="ministry-leader"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${ministryData?.leader || ''}" placeholder="Leader name">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Ministry Image</label>
                <input type="file" id="ministry-image" accept="image/*"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <div id="ministry-image-preview" class="hidden mt-2">
                    <img class="h-32 w-48 object-cover rounded-md">
                </div>
            </div>
            
            <div>
                <label class="flex items-center">
                    <input type="checkbox" id="ministry-active" ${ministryData?.active ? 'checked' : ''}>
                    <span class="ml-2 text-sm font-medium text-gray-700">Active Ministry</span>
                </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button type="submit" id="save-ministry-btn"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    ${isEdit ? 'Update' : 'Save'} Ministry
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('universal-modal').classList.remove('hidden');
    
    // Setup form submission
    document.getElementById('ministry-form').addEventListener('submit', saveMinistry);
    
    // Setup image preview
    if (ministryData?.imageUrl) {
        const preview = document.getElementById('ministry-image-preview');
        preview.querySelector('img').src = ministryData.imageUrl;
        preview.classList.remove('hidden');
    }
    
    document.getElementById('ministry-image').addEventListener('change', previewImage);
}

async function saveMinistry(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-ministry-btn');
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        let imageUrl = '';
        const imageFile = document.getElementById('ministry-image').files[0];
        
        if (imageFile) {
            imageUrl = await uploadToCloudinary(imageFile);
        }
        
        const ministryData = {
            name: document.getElementById('ministry-name').value,
            category: document.getElementById('ministry-category').value,
            description: document.getElementById('ministry-description').value,
            location: document.getElementById('ministry-location').value,
            leader: document.getElementById('ministry-leader').value,
            active: document.getElementById('ministry-active').checked,
            imageUrl: imageUrl || (currentEditingId ? await getCurrentImageUrl('ministries', currentEditingId) : ''),
            updatedAt: serverTimestamp()
        };
        
        if (currentEditingId) {
            await updateDoc(doc(db, 'ministries', currentEditingId), ministryData);
        } else {
            ministryData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'ministries'), ministryData);
        }
        
        closeModal();
        loadMinistries();
        showNotification('Ministry saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving ministry:', error);
        showNotification('Error saving ministry. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveBtn.innerHTML = currentEditingId ? 'Update Ministry' : 'Save Ministry';
    }
}

// Gallery Management
async function loadGallery() {
    try {
        const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const container = document.getElementById('gallery-grid');
        
        container.innerHTML = '';
        
        if (snapshot.empty) {
            container.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No gallery items found</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const item = { id: doc.id, ...doc.data() };
            container.appendChild(createGalleryItem(item));
        });
    } catch (error) {
        console.error('Error loading gallery:', error);
    }
}

function createGalleryItem(item) {
    const div = document.createElement('div');
    div.className = 'bg-white rounded-lg shadow-md overflow-hidden';
    
    div.innerHTML = `
        <div class="relative">
            <img src="${item.imageUrl || 'assets/images/placeholder.jpg'}" 
                 alt="${item.title}" 
                 class="w-full h-48 object-cover">
            <div class="absolute top-2 right-2 space-x-1">
                <button onclick="editGalleryItem('${item.id}')" 
                        class="bg-white text-indigo-600 p-1 rounded-full shadow hover:bg-indigo-50">
                    <i class="fas fa-edit text-sm"></i>
                </button>
                <button onclick="deleteGalleryItem('${item.id}')" 
                        class="bg-white text-red-600 p-1 rounded-full shadow hover:bg-red-50">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
        <div class="p-4">
            <h3 class="text-sm font-medium text-gray-900 truncate">${item.title || 'Untitled'}</h3>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2">${item.description || 'No description'}</p>
            <div class="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>${item.category || 'General'}</span>
                <span>${item.createdAt ? new Date(item.createdAt.toDate()).toLocaleDateString() : 'N/A'}</span>
            </div>
        </div>
    `;
    
    return div;
}

function showGalleryModal(galleryData = null) {
    const isEdit = galleryData !== null;
    currentEditingType = 'gallery';
    currentEditingId = isEdit ? galleryData.id : null;
    
    document.getElementById('modal-title').textContent = isEdit ? 'Edit Gallery Item' : 'Add New Gallery Item';
    
    document.getElementById('modal-content').innerHTML = `
        <form id="gallery-form" class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" id="gallery-title" required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                       value="${galleryData?.title || ''}" placeholder="Image title">
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="gallery-description" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Image description">${galleryData?.description || ''}</textarea>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select id="gallery-category"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="Events" ${galleryData?.category === 'Events' ? 'selected' : ''}>Events</option>
                    <option value="Ministry" ${galleryData?.category === 'Ministry' ? 'selected' : ''}>Ministry</option>
                    <option value="Church Building" ${galleryData?.category === 'Church Building' ? 'selected' : ''}>Church Building</option>
                    <option value="Community" ${galleryData?.category === 'Community' ? 'selected' : ''}>Community</option>
                    <option value="Leadership" ${galleryData?.category === 'Leadership' ? 'selected' : ''}>Leadership</option>
                    <option value="General" ${galleryData?.category === 'General' ? 'selected' : ''}>General</option>
                </select>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Image *</label>
                <input type="file" id="gallery-image" accept="image/*" ${isEdit ? '' : 'required'}
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                <div id="gallery-image-preview" class="hidden mt-2">
                    <img class="h-48 w-full object-cover rounded-md">
                </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Cancel
                </button>
                <button type="submit" id="save-gallery-btn"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                    ${isEdit ? 'Update' : 'Save'} Image
                </button>
            </div>
        </form>
    `;
    
    document.getElementById('universal-modal').classList.remove('hidden');
    
    // Setup form submission
    document.getElementById('gallery-form').addEventListener('submit', saveGalleryItem);
    
    // Setup image preview
    if (galleryData?.imageUrl) {
        const preview = document.getElementById('gallery-image-preview');
        preview.querySelector('img').src = galleryData.imageUrl;
        preview.classList.remove('hidden');
    }
    
    document.getElementById('gallery-image').addEventListener('change', previewImage);
}

async function saveGalleryItem(e) {
    e.preventDefault();
    const saveBtn = document.getElementById('save-gallery-btn');
    
    try {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
        
        let imageUrl = '';
        const imageFile = document.getElementById('gallery-image').files[0];
        
        if (imageFile) {
            imageUrl = await uploadToCloudinary(imageFile);
        } else if (!currentEditingId) {
            throw new Error('Image is required for new gallery items');
        }
        
        const galleryData = {
            title: document.getElementById('gallery-title').value,
            description: document.getElementById('gallery-description').value,
            category: document.getElementById('gallery-category').value,
            imageUrl: imageUrl || (currentEditingId ? await getCurrentImageUrl('gallery', currentEditingId) : ''),
            updatedAt: serverTimestamp()
        };
        
        if (currentEditingId) {
            await updateDoc(doc(db, 'gallery', currentEditingId), galleryData);
        } else {
            galleryData.createdAt = serverTimestamp();
            await addDoc(collection(db, 'gallery'), galleryData);
        }
        
        closeModal();
        loadGallery();
        showNotification('Gallery item saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving gallery item:', error);
        showNotification(error.message || 'Error saving gallery item. Please try again.', 'error');
        
        saveBtn.disabled = false;
        saveBtn.innerHTML = currentEditingId ? 'Update Image' : 'Save Image';
    }
}

// Contacts Management
async function loadContacts() {
    try {
        const q = query(collection(db, 'contacts'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const tbody = document.getElementById('contacts-table-body');
        
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No contact submissions found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const contact = { id: doc.id, ...doc.data() };
            tbody.appendChild(createContactRow(contact));
        });
    } catch (error) {
        console.error('Error loading contacts:', error);
    }
}

function createContactRow(contact) {
    const row = document.createElement('tr');
    const date = contact.createdAt ? new Date(contact.createdAt.toDate()).toLocaleDateString() : 'N/A';
    
    row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${contact.name || 'Anonymous'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${contact.email || 'N/A'}</td>
        <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">${contact.subject || 'No Subject'}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${date}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
            <button onclick="viewContact('${contact.id}')" class="text-indigo-600 hover:text-indigo-900">
                <i class="fas fa-eye"></i>
            </button>
            <button onclick="deleteContact('${contact.id}')" class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    
    return row;
}

function showContactModal(contactData) {
    document.getElementById('modal-title').textContent = 'Contact Submission Details';
    
    const date = contactData.createdAt ? new Date(contactData.createdAt.toDate()).toLocaleString() : 'N/A';
    
    document.getElementById('modal-content').innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Name</label>
                    <p class="mt-1 text-sm text-gray-900">${contactData.name || 'Anonymous'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <p class="mt-1 text-sm text-gray-900">${contactData.email || 'N/A'}</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Subject</label>
                <p class="mt-1 text-sm text-gray-900">${contactData.subject || 'No Subject'}</p>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Message</label>
                <div class="mt-1 p-3 bg-gray-50 rounded-md">
                    <p class="text-sm text-gray-900 whitespace-pre-wrap">${contactData.message || 'No message'}</p>
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700">Submitted</label>
                <p class="mt-1 text-sm text-gray-500">${date}</p>
            </div>
            
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" onclick="closeModal()" 
                        class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
                    Close
                </button>
                ${contactData.email ? `
                    <a href="mailto:${contactData.email}?subject=Re: ${contactData.subject || 'Your inquiry'}"
                       class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700">
                        <i class="fas fa-reply mr-2"></i>Reply via Email
                    </a>
                ` : ''}
            </div>
        </div>
    `;
    
    document.getElementById('universal-modal').classList.remove('hidden');
}

// Global functions for button handlers
window.editMinistry = async (id) => {
    const docRef = doc(db, 'ministries', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        showMinistryModal({ id, ...docSnap.data() });
    }
};

window.deleteMinistry = async (id) => {
    if (confirm('Are you sure you want to delete this ministry?')) {
        try {
            await deleteDoc(doc(db, 'ministries', id));
            loadMinistries();
            showNotification('Ministry deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting ministry:', error);
            showNotification('Error deleting ministry. Please try again.', 'error');
        }
    }
};

window.editGalleryItem = async (id) => {
    const docRef = doc(db, 'gallery', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        showGalleryModal({ id, ...docSnap.data() });
    }
};

window.deleteGalleryItem = async (id) => {
    if (confirm('Are you sure you want to delete this gallery item?')) {
        try {
            await deleteDoc(doc(db, 'gallery', id));
            loadGallery();
            showNotification('Gallery item deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting gallery item:', error);
            showNotification('Error deleting gallery item. Please try again.', 'error');
        }
    }
};

window.viewContact = async (id) => {
    const docRef = doc(db, 'contacts', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        showContactModal({ id, ...docSnap.data() });
    }
};

window.deleteContact = async (id) => {
    if (confirm('Are you sure you want to delete this contact submission?')) {
        try {
            await deleteDoc(doc(db, 'contacts', id));
            loadContacts();
            showNotification('Contact deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting contact:', error);
            showNotification('Error deleting contact. Please try again.', 'error');
        }
    }
};

console.log('Admin panel initialized successfully');