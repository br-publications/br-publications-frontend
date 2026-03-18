# Google OAuth Setup Instructions

## 1. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your Project ID

### Step 2: Enable Google+ API
1. In the left sidebar, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click "Enable"

### Step 3: Create OAuth Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen first if prompted:
   - Choose "External" for user type
   - Fill in required fields (App name, user support email, developer email)
   - Add scopes: `email`, `profile`, `openid`
   - Add test users if in testing mode
4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: "Your App Name"
   - Authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - `https://yourdomain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/google/callback` (for development)
     - `https://yourdomain.com/auth/google/callback` (for production)
5. Click "Create"
6. Copy your **Client ID** and **Client Secret**

## 2. Environment Variables Setup

### Frontend (.env)
```env
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

### Backend (.env)
```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_here
```

## 3. Install Required Packages

### Frontend
```bash
npm install react-router-dom
```

### Backend (Node.js/Express)
```bash
npm install express google-auth-library jsonwebtoken dotenv
npm install --save-dev @types/jsonwebtoken @types/express
```

## 4. Router Configuration

Add the Google OAuth callback route to your React Router:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import GoogleAuthCallback from './components/GoogleAuthCallback';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/user/register" element={<Register />} />
        <Route path="/user/login" element={<Login />} />
        <Route path="/auth/google/callback" element={<GoogleAuthCallback />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

## 5. Security Best Practices

1. **Never expose Client Secret in frontend code**
   - Only use Client ID in frontend
   - Keep Client Secret in backend environment variables

2. **Use HTTPS in production**
   - Google OAuth requires HTTPS for production apps
   - Update redirect URIs to use HTTPS

3. **Implement CSRF protection**
   - The `state` parameter is used for CSRF protection
   - Always verify the state matches on callback

4. **Validate tokens server-side**
   - Always verify Google ID tokens on your backend
   - Don't trust frontend validation alone

5. **Handle token expiration**
   - Implement token refresh logic
   - Use `access_type: 'offline'` to get refresh tokens

## 6. Testing the Flow

1. Start your backend server
2. Start your React development server
3. Navigate to the registration page
4. Click "Sign up with Google"
5. Complete Google authentication
6. Verify successful redirect to your dashboard

## 7. Common Issues & Solutions

### Issue: "redirect_uri_mismatch" error
**Solution**: Ensure the redirect URI in your code exactly matches the one configured in Google Cloud Console (including protocol, domain, port, and path)

### Issue: "Access blocked: This app's request is invalid"
**Solution**: Complete the OAuth consent screen configuration and add your email as a test user

### Issue: "Token verification failed"
**Solution**: Check that your GOOGLE_CLIENT_ID matches between frontend and backend

### Issue: CORS errors
**Solution**: Configure CORS on your backend to allow requests from your frontend domain

## 8. Database Schema Example

```typescript
// User model example (MongoDB/Mongoose)
interface IUser {
  email: string;
  username: string;
  fullName: string;
  password?: string; // Optional for OAuth users
  googleId?: string;
  emailVerified: boolean;
  profilePicture?: string;
  authProvider: 'local' | 'google';
  createdAt: Date;
  updatedAt: Date;
}
```

## 9. Alternative: Using Popup Instead of Redirect

If you prefer a popup flow instead of full redirect:

```typescript
const handleGoogleSignUp = () => {
  const width = 500;
  const height = 600;
  const left = window.screen.width / 2 - width / 2;
  const top = window.screen.height / 2 - height / 2;
  
  const popup = window.open(
    googleAuthUrl,
    'Google Sign In',
    `width=${width},height=${height},left=${left},top=${top}`
  );
  
  // Listen for messages from popup
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return;
    
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      // Handle success
      localStorage.setItem('authToken', event.data.token);
      navigate('/dashboard');
    }
  });
};
```

## Support

For more information, refer to:
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Web](https://developers.google.com/identity/sign-in/web)