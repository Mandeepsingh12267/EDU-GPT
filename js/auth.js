// Auth Manager for Firebase Authentication - CLIENT SDK ONLY
class AuthManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.BACKEND_URL = 'http://localhost:5000';
        console.log('🔄 AuthManager started on:', this.currentPage);
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('index.html') || path === '/' || path.endsWith('/')) return 'login';
        if (path.includes('signup.html')) return 'signup';
        if (path.includes('dashboard.html')) return 'dashboard';
        return 'login';
    }

    async init() {
        console.log('🎯 Initializing auth for:', this.currentPage);
        
        // Wait for Firebase to be ready
        await this.waitForFirebase();
        
        // Set up auth state listener
        this.setupAuthStateListener();
        
        // Check current auth state
        await this.checkAuthState();
    }

    setupAuthStateListener() {
        firebaseAuth.onAuthStateChanged((user) => {
            if (user) {
                console.log('🔥 Auth state: User signed in', user.email);
                // Update UI based on auth state
                this.updateUIForAuthState(true);
            } else {
                console.log('🔥 Auth state: User signed out');
                this.updateUIForAuthState(false);
            }
        });
    }

    updateUIForAuthState(isLoggedIn) {
        // Update navigation based on auth state
        const loginNav = document.querySelector('a[href="index.html"]');
        const signupNav = document.querySelector('a[href="signup.html"]');
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (isLoggedIn) {
            if (loginNav) loginNav.style.display = 'none';
            if (signupNav) signupNav.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
        } else {
            if (loginNav) loginNav.style.display = 'block';
            if (signupNav) signupNav.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }

    async checkAuthState() {
        console.log('🔍 Checking authentication state...');
        
        const user = firebaseAuth.currentUser;
        const token = localStorage.getItem('edugpt_token');
        
        if (user && token) {
            console.log('✅ User already authenticated:', user.email);
            
            if (this.currentPage === 'login' || this.currentPage === 'signup') {
                console.log('➡️ Redirecting to dashboard...');
                this.redirectToDashboard();
                return;
            } else if (this.currentPage === 'dashboard') {
                console.log('✅ User on dashboard, loading data...');
                this.setupDashboardPage();
                return;
            }
        } else {
            console.log('❌ No authenticated user found');
            
            if (this.currentPage === 'dashboard') {
                console.log('⬅️ Redirecting to login...');
                this.redirectToLogin();
                return;
            }
        }
        
        this.setupCurrentPage();
    }

    // Wait for Firebase to be fully loaded
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && 
                    typeof firebaseAuth !== 'undefined' &&
                    typeof firebaseAuth.signInWithEmailAndPassword === 'function') {
                    console.log('✅ Firebase Auth is ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for Firebase Auth...');
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // LOGIN PAGE
    setupLoginPage() {
        console.log('🔐 Setting up login page...');
        this.setupLoginForm();
        this.updateUIForAuthState(false);
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        
        if (!loginForm) {
            console.error('❌ Login form not found!');
            return;
        }

        console.log('✅ Login form found, attaching event listener');
        
        loginForm.addEventListener('submit', async (e) => {
            console.log('🖱️ Login form submitted!');
            e.preventDefault();
            await this.handleLogin();
        });
    }

    async handleLogin() {
        console.log('🔍 Starting login process...');
        
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const role = document.getElementById('role')?.value;

        console.log('📝 Form values:', { 
            email: email, 
            password: password ? '***' + password.slice(-2) : 'empty',
            role: role 
        });

        if (!email || !password || !role) {
            console.error('❌ Missing form fields');
            this.showError('Please fill in all fields');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.showLoading(true);

        try {
            console.log('🔥 Attempting Firebase login with Client SDK...');
            
            // Use Firebase Client SDK for login - THIS IS WHAT MATTERS
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase Client SDK login successful:', user.email);
            console.log('✅ User UID:', user.uid);

            // Get the ID token
            const idToken = await user.getIdToken();
            console.log('✅ Got ID token:', idToken ? 'Yes' : 'No');

            // Create user data from Firebase Auth
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || `${email.split('@')[0]}`,
                role: role,
                emailVerified: user.emailVerified
            };

            // Store auth data
            this.storeAuthData(userData, idToken);

            // Sync with backend (optional - for additional user data)
            await this.syncUserWithBackend(user, idToken, role);

            console.log('🎉 Login successful! Redirecting...');
            this.showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1000);

        } catch (error) {
            console.error('❌ Login error:', error);
            this.handleLoginError(error);
        } finally {
            this.showLoading(false);
        }
    }

    async syncUserWithBackend(user, idToken, role) {
        try {
            console.log('🔄 Syncing user with backend...');
            
            const response = await fetch(`${this.BACKEND_URL}/api/auth/sync-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    email: user.email,
                    displayName: user.displayName,
                    role: role
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Backend sync successful:', data);
            } else {
                console.warn('⚠️ Backend sync failed, but login continues');
            }
        } catch (error) {
            console.warn('⚠️ Backend sync error, but login continues:', error);
        }
    }

    handleLoginError(error) {
        let errorMessage = 'Login failed';
        
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email. Please sign up first.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password. Please try again.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/user-disabled':
                errorMessage = 'This account has been disabled.';
                break;
            case 'auth/invalid-login-credentials':
                errorMessage = 'Invalid email or password. Please check your credentials.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            case 'auth/too-many-requests':
                errorMessage = 'Too many failed attempts. Please try again later.';
                break;
            default:
                errorMessage = 'Login failed. Please try again.';
        }
        
        this.showError(errorMessage);
    }

    // SIGNUP PAGE
    setupSignupPage() {
        console.log('📝 Setting up signup page...');
        this.setupSignupForm();
        this.updateUIForAuthState(false);
    }

    setupSignupForm() {
        const signupForm = document.getElementById('signupForm');
        
        if (!signupForm) {
            console.error('❌ Signup form not found!');
            return;
        }

        console.log('✅ Signup form found');
        
        signupForm.addEventListener('submit', async (e) => {
            console.log('🖱️ Signup form submitted!');
            e.preventDefault();
            await this.handleSignup();
        });
    }

    async handleSignup() {
        const firstName = document.getElementById('firstName')?.value.trim();
        const lastName = document.getElementById('lastName')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const confirmPassword = document.getElementById('confirmPassword')?.value;
        const role = document.getElementById('role')?.value;

        console.log('📝 Signup form values:', { 
            firstName, 
            lastName, 
            email, 
            password: password ? '***' + password.slice(-2) : 'empty',
            role 
        });

        if (!firstName || !lastName || !email || !password || !confirmPassword || !role) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        this.showLoading(true);

        try {
            console.log('🔥 Creating user with Firebase Client SDK...');
            
            // Use Firebase Client SDK for signup - THIS IS CRITICAL
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase Client SDK signup successful:', user.email);

            // Update user profile with display name
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });

            // Get the ID token
            const idToken = await user.getIdToken();
            
            // Create user data
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: `${firstName} ${lastName}`,
                firstName: firstName,
                lastName: lastName,
                role: role,
                emailVerified: user.emailVerified
            };

            // Store auth data
            this.storeAuthData(userData, idToken);

            // Send user data to backend for Firestore storage
            await this.createUserInBackend(userData, idToken);

            console.log('🎉 Signup successful! Redirecting...');
            this.showSuccess('Account created successfully! Redirecting...');
            
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1500);

        } catch (error) {
            console.error('❌ Signup error:', error);
            this.handleSignupError(error);
        } finally {
            this.showLoading(false);
        }
    }

    async createUserInBackend(userData, idToken) {
        try {
            console.log('📡 Sending user data to backend...');
            
            const response = await fetch(`${this.BACKEND_URL}/api/auth/create-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            console.log('📡 Backend user creation response:', data);

            if (!data.success) {
                console.warn('⚠️ Backend user creation failed, but account created:', data.error);
            } else {
                console.log('✅ Backend user creation successful');
            }
        } catch (error) {
            console.warn('⚠️ Backend communication failed, but account created:', error);
        }
    }

    handleSignupError(error) {
        let errorMessage = 'Signup failed';
        
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage = 'Email already registered. Please use a different email or login.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address format.';
                break;
            case 'auth/weak-password':
                errorMessage = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/network-request-failed':
                errorMessage = 'Network error. Please check your internet connection.';
                break;
            case 'auth/operation-not-allowed':
                errorMessage = 'Email/password accounts are not enabled. Please contact support.';
                break;
            default:
                errorMessage = 'Signup failed. Please try again.';
        }
        
        this.showError(errorMessage);
    }

    storeAuthData(user, token) {
        localStorage.setItem('edugpt_token', token);
        localStorage.setItem('edugpt_user', JSON.stringify(user));
        localStorage.setItem('edugpt_user_email', user.email);
        localStorage.setItem('edugpt_user_role', user.role);
        
        console.log('💾 Auth data saved for:', user.email);
    }

    redirectToDashboard() {
        console.log('➡️ Redirecting to dashboard...');
        window.location.href = 'dashboard.html';
    }

    redirectToLogin() {
        console.log('⬅️ Redirecting to login...');
        window.location.href = 'index.html';
    }

    setupCurrentPage() {
        console.log('🛠️ Setting up page:', this.currentPage);
        
        switch (this.currentPage) {
            case 'login':
                this.setupLoginPage();
                break;
            case 'signup':
                this.setupSignupPage();
                break;
            case 'dashboard':
                this.setupDashboardPage();
                break;
        }
    }

    // DASHBOARD PAGE
    setupDashboardPage() {
        console.log('🏠 Setting up dashboard page...');
        
        const user = JSON.parse(localStorage.getItem('edugpt_user') || '{}');
        const token = localStorage.getItem('edugpt_token');

        if (!user || !token) {
            console.log('❌ Not authenticated, redirecting to login');
            this.redirectToLogin();
            return;
        }
        
        console.log('✅ User authenticated:', user.email);
        this.displayUserInfo(user);
        this.updateUIForAuthState(true);
    }

    displayUserInfo(user) {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement && user.displayName) {
            userNameElement.textContent = user.displayName;
        }
        
        // Update welcome message
        const welcomeElement = document.querySelector('.welcome-message');
        if (welcomeElement) {
            welcomeElement.textContent = `Welcome back, ${user.displayName || user.email}!`;
        }
        
        console.log('👋 Welcome,', user.displayName || user.email);
    }

    // UTILITY METHODS
    showLoading(show) {
        console.log(show ? '⌛ Showing loading...' : '✅ Hiding loading...');
        
        let submitBtn;
        
        if (this.currentPage === 'login') {
            submitBtn = document.querySelector('#loginForm button[type="submit"]');
        } else if (this.currentPage === 'signup') {
            submitBtn = document.querySelector('#signupForm button[type="submit"]');
        }
        
        if (submitBtn) {
            submitBtn.disabled = show;
            if (this.currentPage === 'login') {
                submitBtn.textContent = show ? 'Signing In...' : 'Sign In';
            } else {
                submitBtn.textContent = show ? 'Creating Account...' : 'Create Account';
            }
        }
    }

    showError(message) {
        console.error('❌ Auth Error:', message);
        
        this.clearMessages();
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #fee2e2;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            text-align: center;
            border: 1px solid #fecaca;
            font-weight: 500;
        `;
        errorDiv.textContent = message;
        
        this.showMessage(errorDiv);
    }

    showSuccess(message) {
        console.log('✅ Success:', message);
        
        this.clearMessages();
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            background: #dcfce7;
            color: #166534;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            text-align: center;
            border: 1px solid #bbf7d0;
            font-weight: 500;
        `;
        successDiv.textContent = message;
        
        this.showMessage(successDiv);
    }

    showMessage(messageDiv) {
        const form = document.getElementById(this.currentPage === 'login' ? 'loginForm' : 'signupForm');
        if (form) {
            form.prepend(messageDiv);
            
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        } else {
            // Fallback for pages without forms
            const container = document.querySelector('.auth-container') || document.body;
            const firstChild = container.firstChild;
            if (firstChild) {
                container.insertBefore(messageDiv, firstChild);
            } else {
                container.appendChild(messageDiv);
            }
        }
    }

    clearMessages() {
        const existingErrors = document.querySelectorAll('.error-message');
        existingErrors.forEach(error => error.remove());
        
        const existingSuccess = document.querySelectorAll('.success-message');
        existingSuccess.forEach(success => success.remove());
    }
}

// Make logout function globally available
window.logout = function() {
    console.log('👋 Logging out...');
    
    // Sign out from Firebase
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().signOut().then(() => {
            console.log('✅ Firebase signout successful');
        }).catch(error => {
            console.error('❌ Firebase signout error:', error);
        });
    }
    
    // Clear all local storage
    localStorage.removeItem('edugpt_token');
    localStorage.removeItem('edugpt_user');
    localStorage.removeItem('edugpt_user_email');
    localStorage.removeItem('edugpt_user_role');
    
    console.log('✅ Local storage cleared, redirecting to login');
    window.location.href = 'index.html';
};

// Initialize AuthManager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, starting auth manager...');
    console.log('📍 Current page:', window.location.pathname);
    
    // Clear any existing auth data for fresh start
    console.log('🧹 Clearing existing auth data for fresh start...');
    localStorage.removeItem('edugpt_token');
    localStorage.removeItem('edugpt_user');
    localStorage.removeItem('edugpt_user_email');
    localStorage.removeItem('edugpt_user_role');
    
    new AuthManager();
});