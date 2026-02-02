# Oasis International Ministries Website - Admin Panel

## Admin Panel Features

The admin panel provides complete CRUD (Create, Read, Update, Delete) operations for:

- **Blogs** - Manage blog posts with featured images
- **Leadership** - Manage leadership profiles with photos  
- **Ministries** - Manage ministry information with images
- **Gallery** - Manage photo gallery with categories
- **Contacts** - View and manage contact form submissions

## Setup Instructions

### 1. Firebase Configuration

Make sure your Firebase project is properly configured in `assets/js/firebase-config.js` with:
- Firestore Database enabled
- Authentication enabled (Email/Password provider)
- Admin user account created

### 2. Cloudinary Setup

1. **Create a Cloudinary account** at [cloudinary.com](https://cloudinary.com)
2. **Get your credentials** from the Cloudinary dashboard:
   - Cloud Name
   - Upload Preset (create an unsigned upload preset)
3. **Update admin.js** with your Cloudinary credentials:

```javascript
// In assets/js/admin.js, update these lines:
const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'YOUR_UPLOAD_PRESET';
```

#### Creating an Upload Preset in Cloudinary:

1. Go to Settings → Upload presets in your Cloudinary dashboard
2. Click "Add upload preset"
3. Set the following:
   - **Preset name**: `oasis-ministries` (or your preferred name)
   - **Signing mode**: `Unsigned`
   - **Folder**: `oasis-ministries` (optional, for organization)
   - **Transformation**: 
     - Max width: 1200px
     - Max height: 800px
     - Quality: auto
     - Format: auto
4. Save the preset

### 3. Admin Access

1. **Create admin user** in Firebase Authentication:
   - Go to Firebase Console → Authentication → Users
   - Add a new user with email/password
   - Use this email/password to access the admin panel

2. **Access admin panel**:
   - Navigate to `/admin.html`
   - Login with your admin credentials
   - Start managing content!

### 4. Security Rules (Recommended)

Update your Firestore security rules to restrict write access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read access
    match /{document=**} {
      allow read: if true;
    }
    
    // Authenticated write access only
    match /{document=**} {
      allow write: if request.auth != null;
    }
  }
}
```

## File Structure

```
admin.html              # Admin panel interface
assets/js/admin.js      # Admin panel functionality
assets/js/firebase-config.js  # Firebase configuration
assets/js/main.js       # Main site functionality
```

## Features

### Dashboard
- Overview statistics for all content types
- Quick access to all management sections

### Content Management
- **Rich forms** for all content types
- **Image upload** with Cloudinary integration
- **Preview functionality** for images
- **Status management** (published/draft, active/inactive)
- **Category organization** for better content structure

### User Experience
- **Responsive design** works on desktop and mobile
- **Real-time updates** with Firebase
- **Error handling** and success notifications
- **Confirmation dialogs** for destructive actions

## Usage

1. **Login** to the admin panel
2. **Navigate** using the top tabs
3. **Add new content** using the "Add New" buttons
4. **Edit existing content** by clicking the edit icon
5. **Delete content** by clicking the trash icon (with confirmation)
6. **Upload images** through the file inputs (automatically uploaded to Cloudinary)

## Troubleshooting

### Common Issues

1. **Cloudinary upload fails**
   - Check your cloud name and upload preset
   - Ensure upload preset is "unsigned"
   - Check browser console for error details

2. **Firebase permission denied**
   - Verify user is authenticated
   - Check Firestore security rules
   - Ensure user has proper permissions

3. **Images not displaying**
   - Check Cloudinary URLs
   - Verify image upload was successful
   - Check browser network tab for failed requests

### Debug Mode

Open browser developer tools and check the console for any error messages. All Firebase operations and Cloudinary uploads are logged for debugging.

## Support

For technical support or questions about the admin panel, please contact the development team.