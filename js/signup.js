class SignupForm {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 3;
        this.userData = {};
        this.interestsData = {
            elementary: ['Math', 'Reading', 'Science', 'Art', 'Music', 'Sports'],
            middle: ['Algebra', 'Biology', 'History', 'Geography', 'Literature', 'Coding'],
            high: ['Calculus', 'Physics', 'Chemistry', 'Economics', 'Programming', 'Psychology'],
            undergraduate: ['Computer Science', 'Engineering', 'Business', 'Medicine', 'Law', 'Arts'],
            graduate: ['Data Science', 'AI/ML', 'Finance', 'Research', 'Leadership', 'Innovation'],
            postgraduate: ['Advanced Research', 'Academic Writing', 'Thesis Development', 'Publication'],
            phd: ['Doctoral Research', 'Academic Publishing', 'Teaching Methodology', 'Grant Writing'],
            other: ['Professional Skills', 'Personal Development', 'Creative Arts', 'Technology']
        };

        this.BACKEND_URL = 'http://localhost:5000';
        
        // Wait for Firebase to be ready before initializing
        this.waitForFirebase().then(() => {
            this.initializeEventListeners();
            this.updateProgressBar();
            this.showCurrentStep();
            this.initializeRadioButtons();
            this.hideAllEmptyErrorMessages(); // Add this line to hide empty errors on startup
            
            console.log('✅ SignupForm initialized with Firebase');
        }).catch(error => {
            console.error('❌ Firebase initialization failed:', error);
            this.showFormError('Authentication service unavailable. Please refresh the page.');
        });
    }

    // NEW METHOD: Hide all empty error messages on startup
    hideAllEmptyErrorMessages() {
        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => {
            if (!error.textContent.trim()) {
                error.style.display = 'none';
            }
        });
    }

    // Wait for Firebase to be fully loaded
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                if (typeof firebase !== 'undefined' && 
                    firebase.apps.length > 0 &&
                    typeof firebase.auth === 'function' &&
                    typeof firebase.auth().createUserWithEmailAndPassword === 'function') {
                    console.log('✅ Firebase Auth is ready');
                    resolve();
                } else {
                    console.log('⏳ Waiting for Firebase Auth...');
                    setTimeout(checkFirebase, 100);
                }
            };
            
            // Set timeout to prevent infinite waiting
            setTimeout(() => {
                reject(new Error('Firebase initialization timeout'));
            }, 10000);
            
            checkFirebase();
        });
    }

    initializeEventListeners() {
        // Step navigation
        const nextStep1 = document.getElementById('nextStep1');
        const nextStep2 = document.getElementById('nextStep2');
        
        if (nextStep1) nextStep1.addEventListener('click', () => this.validateStep1());
        if (nextStep2) nextStep2.addEventListener('click', () => this.validateStep2());
        
        // Previous buttons
        document.querySelectorAll('.btn-prev').forEach(btn => {
            btn.addEventListener('click', () => this.previousStep());
        });

        // Form submission
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Real-time validation
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const aboutInput = document.getElementById('about');
        
        if (passwordInput) passwordInput.addEventListener('input', () => this.validatePassword());
        if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', () => this.validateConfirmPassword());
        if (aboutInput) aboutInput.addEventListener('input', () => this.updateCharCount());

        // Password visibility toggle
        const togglePassword = document.getElementById('togglePassword');
        const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
        
        if (togglePassword) togglePassword.addEventListener('click', () => this.togglePasswordVisibility('password'));
        if (toggleConfirmPassword) toggleConfirmPassword.addEventListener('click', () => this.togglePasswordVisibility('confirmPassword'));

        // Education level change
        const educationLevel = document.getElementById('educationLevel');
        if (educationLevel) {
            educationLevel.addEventListener('change', () => this.updateInterests());
        }

        // Terms checkbox click handler
        const termsContainer = document.querySelector('.checkbox-container');
        if (termsContainer) {
            termsContainer.addEventListener('click', (e) => {
                const checkbox = document.getElementById('terms');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    this.validateStep3();
                }
            });
        }
    }

    showCurrentStep() {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.querySelector(`.form-step[data-step="${this.currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
        }
    }

    validateStep1() {
        const fields = ['role', 'firstName', 'lastName', 'email', 'password', 'confirmPassword'];
        let isValid = true;

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (!element) {
                console.error(`Element with id ${field} not found`);
                return;
            }

            if (!element.value.trim()) {
                this.showError(element, 'This field is required');
                isValid = false;
            } else {
                this.hideError(element);
            }
        });

        // Specific validations
        const email = document.getElementById('email');
        if (email && email.value && !this.isValidEmail(email.value)) {
            this.showError(email, 'Please enter a valid email address');
            isValid = false;
        }

        const password = document.getElementById('password');
        if (password && password.value && !this.isStrongPassword(password.value)) {
            this.showError(password, 'Password does not meet requirements');
            isValid = false;
        }

        if (!this.validateConfirmPassword()) {
            isValid = false;
        }

        if (isValid) {
            this.saveStep1Data();
            this.nextStep();
        }
    }

    validateStep2() {
        const educationLevel = document.getElementById('educationLevel');
        let isValid = true;

        if (!educationLevel || !educationLevel.value) {
            this.showError(educationLevel, 'Please select your education level');
            isValid = false;
        } else {
            this.hideError(educationLevel);
        }

        if (isValid) {
            this.saveStep2Data();
            this.updateInterests();
            this.nextStep();
        }
    }

    validateStep3() {
        const terms = document.getElementById('terms');
        const termsError = document.getElementById('termsError');
        let isValid = true;

        if (!terms || !terms.checked) {
            if (termsError) {
                termsError.textContent = 'You must agree to the Terms of Service and Privacy Policy to continue';
                termsError.style.display = 'block';
            }
            isValid = false;
        } else {
            if (termsError) {
                termsError.textContent = '';
                termsError.style.display = 'none';
            }
        }

        return isValid;
    }

    saveStep1Data() {
        this.userData = {
            role: document.getElementById('role').value,
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
    }

    saveStep2Data() {
        this.userData.educationLevel = document.getElementById('educationLevel').value;
        this.userData.institution = document.getElementById('institution').value;
        const statusRadio = document.querySelector('input[name="status"]:checked');
        this.userData.status = statusRadio ? statusRadio.value : 'studying';
    }

    saveStep3Data() {
        const selectedInterests = Array.from(document.querySelectorAll('.interest-option.selected'));
        this.userData.interests = selectedInterests.map(el => el.textContent);
        this.userData.learningGoals = document.getElementById('learningGoals')?.value || '';
        this.userData.about = document.getElementById('about')?.value || '';
    }

    nextStep() {
        if (this.currentStep < this.totalSteps) {
            this.currentStep++;
            this.showCurrentStep();
            this.updateProgressBar();
        }
    }

    previousStep() {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.showCurrentStep();
            this.updateProgressBar();
        }
    }

    updateProgressBar() {
        const progress = (this.currentStep - 1) / (this.totalSteps - 1) * 100;
        const progressFill = document.getElementById('progressFill');
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        // Update step indicators
        document.querySelectorAll('.step').forEach((step, index) => {
            if (index + 1 <= this.currentStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    validatePassword() {
        const password = document.getElementById('password');
        if (!password) return false;

        const passwordValue = password.value;
        const strengthFill = document.getElementById('strengthFill');
        const strengthText = document.getElementById('strengthText');
        
        if (!strengthFill || !strengthText) return false;

        const rules = {
            length: passwordValue.length >= 8,
            uppercase: /[A-Z]/.test(passwordValue),
            lowercase: /[a-z]/.test(passwordValue),
            number: /[0-9]/.test(passwordValue),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)
        };

        // Update rules display
        Object.keys(rules).forEach(rule => {
            const element = document.getElementById(`rule-${rule}`);
            if (element) {
                if (rules[rule]) {
                    element.classList.add('valid');
                } else {
                    element.classList.remove('valid');
                }
            }
        });

        // Calculate strength
        const strength = Object.values(rules).filter(Boolean).length;
        let strengthPercent = 0;
        let strengthLevel = 'Weak';
        let color = '#ef4444';

        if (strength >= 4) {
            strengthPercent = 100;
            strengthLevel = 'Strong';
            color = '#10b981';
        } else if (strength >= 3) {
            strengthPercent = 66;
            strengthLevel = 'Medium';
            color = '#f59e0b';
        } else if (strength >= 2) {
            strengthPercent = 33;
            strengthLevel = 'Weak';
            color = '#ef4444';
        }

        strengthFill.style.width = `${strengthPercent}%`;
        strengthFill.style.background = color;
        strengthText.textContent = strengthLevel;
        strengthText.style.color = color;

        return strength >= 4;
    }

    validateConfirmPassword() {
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirmPassword');
        const errorElement = document.getElementById('confirmPasswordError');

        if (!password || !confirmPassword || !errorElement) return false;

        const passwordValue = password.value;
        const confirmPasswordValue = confirmPassword.value;

        if (confirmPasswordValue && passwordValue !== confirmPasswordValue) {
            errorElement.textContent = 'Passwords do not match';
            errorElement.style.display = 'block';
            confirmPassword.classList.add('error');
            return false;
        } else {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
            confirmPassword.classList.remove('error');
            return true;
        }
    }

    updateInterests() {
        const educationLevel = document.getElementById('educationLevel');
        if (!educationLevel) return;

        const educationLevelValue = educationLevel.value;
        const interestsGrid = document.getElementById('interestsGrid');
        const selectedInterests = document.getElementById('selectedInterests');

        if (!interestsGrid || !selectedInterests) return;

        if (!educationLevelValue) {
            interestsGrid.innerHTML = '<div class="interest-option">Please select education level first</div>';
            return;
        }

        const interests = this.interestsData[educationLevelValue] || this.interestsData.other;
        
        interestsGrid.innerHTML = '';
        selectedInterests.innerHTML = '';

        interests.forEach(interest => {
            const interestElement = document.createElement('div');
            interestElement.className = 'interest-option';
            interestElement.textContent = interest;
            interestElement.addEventListener('click', () => this.toggleInterest(interestElement, interest));
            interestsGrid.appendChild(interestElement);
        });
    }

    toggleInterest(element, interest) {
        element.classList.toggle('selected');
        
        const selectedInterests = document.getElementById('selectedInterests');
        if (!selectedInterests) return;
        
        if (element.classList.contains('selected')) {
            const selectedElement = document.createElement('div');
            selectedElement.className = 'selected-interest';
            selectedElement.innerHTML = `
                ${interest}
                <button type="button" class="remove-interest">×</button>
            `;
            
            const removeBtn = selectedElement.querySelector('.remove-interest');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedElement.remove();
                element.classList.remove('selected');
            });
            
            selectedInterests.appendChild(selectedElement);
        } else {
            const existing = Array.from(selectedInterests.children).find(child => 
                child.textContent.includes(interest)
            );
            if (existing) existing.remove();
        }
    }

    updateCharCount() {
        const about = document.getElementById('about');
        const charCount = document.getElementById('charCount');
        
        if (about && charCount) {
            charCount.textContent = about.value.length;
        }
    }

    togglePasswordVisibility(fieldId) {
        const field = document.getElementById(fieldId);
        const toggleBtn = document.getElementById(`toggle${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
        
        if (!field || !toggleBtn) return;

        const icon = toggleBtn.querySelector('i');
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            field.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }

    getErrorElement(element) {
        return element.parentElement.querySelector('.error-message') || 
               element.nextElementSibling?.classList?.contains('error-message') ? 
               element.nextElementSibling : null;
    }

    showError(element, message) {
        if (!element) return;
        
        element.classList.add('error');
        const errorElement = this.getErrorElement(element);
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    hideError(element) {
        if (!element) return;
        
        element.classList.remove('error');
        const errorElement = this.getErrorElement(element);
        
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isStrongPassword(password) {
        const rules = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        return Object.values(rules).every(Boolean);
    }

    initializeRadioButtons() {
        const radioOptions = document.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selected class from all options
                radioOptions.forEach(opt => opt.classList.remove('selected'));
                // Add selected class to clicked option
                option.classList.add('selected');
                
                // Check the radio input
                const radioInput = option.querySelector('input[type="radio"]');
                if (radioInput) {
                    radioInput.checked = true;
                }
            });
            
            // Initialize selected state for checked option
            const radioInput = option.querySelector('input[type="radio"]');
            if (radioInput && radioInput.checked) {
                option.classList.add('selected');
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (!this.validateStep3()) {
            return;
        }

        this.saveStep3Data();

        const submitBtn = document.getElementById('submitBtn');
        const spinner = document.getElementById('submitSpinner');
        const btnText = submitBtn?.querySelector('.btn-text');

        if (!submitBtn || !spinner || !btnText) {
            console.error('Submit button elements not found');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        spinner.classList.remove('hidden');
        btnText.style.opacity = '0';

        try {
            // Use Firebase Auth to create user
            await this.createUserWithFirebase();
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showFormError('Signup failed: ' + (error.message || 'Please try again.'));
            
            // Reset loading state
            submitBtn.disabled = false;
            spinner.classList.add('hidden');
            btnText.style.opacity = '1';
        }
    }

    async createUserWithFirebase() {
        console.log('🔥 Creating user with Firebase Auth...');
        
        const { email, password, firstName, lastName, role } = this.userData;

        // Double-check Firebase is available
        if (!firebase.apps.length || !firebase.auth) {
            throw new Error('Firebase authentication is not available. Please refresh the page.');
        }

        try {
            // Create user with Firebase Client SDK
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            console.log('✅ Firebase user created:', user.email);
            console.log('✅ User UID:', user.uid);

            // Update user profile
            await user.updateProfile({
                displayName: `${firstName} ${lastName}`
            });

            // Get ID token
            const idToken = await user.getIdToken();
            
            // Store auth data
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: `${firstName} ${lastName}`,
                firstName: firstName,
                lastName: lastName,
                role: role,
                emailVerified: user.emailVerified
            };

            localStorage.setItem('edugpt_token', idToken);
            localStorage.setItem('edugpt_user', JSON.stringify(userData));
            localStorage.setItem('edugpt_user_email', user.email);
            localStorage.setItem('edugpt_user_role', role);

            console.log('✅ User data stored, redirecting to dashboard...');
            
            // Show success message
            this.showFormSuccess('Account created successfully! Redirecting...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

        } catch (error) {
            console.error('❌ Firebase signup error:', error);
            let errorMessage = 'Signup failed';
            
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Email already registered. Please use a different email.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please use a stronger password.';
                    break;
                case 'auth/network-request-failed':
                    errorMessage = 'Network error. Please check your connection.';
                    break;
                default:
                    errorMessage = error.message || 'Signup failed. Please try again.';
            }
            
            throw new Error(errorMessage);
        }
    }

    showFormError(message) {
        this.showMessage(message, 'error');
    }

    showFormSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const isError = type === 'error';
        
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = isError ? 'error-message' : 'success-message';
        messageDiv.style.cssText = `
            background: ${isError ? '#fee2e2' : '#dcfce7'};
            color: ${isError ? '#dc2626' : '#166534'};
            padding: 12px 16px;
            border-radius: 8px;
            margin: 16px 0;
            text-align: center;
            border: 1px solid ${isError ? '#fecaca' : '#bbf7d0'};
            font-weight: 500;
        `;
        messageDiv.textContent = message;
        
        const form = document.getElementById('signupForm');
        if (form) {
            // Remove any existing messages
            const existingMessages = form.querySelectorAll('.error-message, .success-message');
            existingMessages.forEach(msg => msg.remove());
            
            form.prepend(messageDiv);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }
    }
}

// Initialize the form when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing EduGPT Signup Form with Firebase...');
    new SignupForm();
});