import { supabaseClient } from './api.js';
import { els, showToast } from './ui.js';

export let currentUser = null;

export async function initAuth(onAuthChangeCallback) {
    // Get initial session
    const { data: { session } } = await supabaseClient.auth.getSession();
    currentUser = session?.user || null;
    
    updateUIForAuth();
    if (onAuthChangeCallback) onAuthChangeCallback(currentUser);

    // Listen for changes
    supabaseClient.auth.onAuthStateChange((_event, session) => {
        currentUser = session?.user || null;
        updateUIForAuth();
        if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
    });

    // Event Listeners for Modals & Forms
    document.getElementById('btn-show-login').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('btn-show-signup').addEventListener('click', () => openAuthModal('signup'));
    document.getElementById('btn-close-modal').addEventListener('click', closeAuthModal);
    document.getElementById('modal-overlay').addEventListener('click', closeAuthModal);
    document.getElementById('btn-switch-auth').addEventListener('click', toggleAuthMode);
    document.getElementById('btn-logout').addEventListener('click', logout);
    
    els.authForm.addEventListener('submit', handleAuthSubmit);
}

function updateUIForAuth() {
    if (currentUser) {
        els.authUnlogged.classList.add('hidden');
        els.authLogged.classList.remove('hidden');
        els.userStatus.textContent = currentUser.email;
    } else {
        els.authUnlogged.classList.remove('hidden');
        els.authLogged.classList.add('hidden');
        els.userStatus.textContent = '';
    }
}

// Security Helper
export function requireLogin(callback) {
    if (!currentUser) {
        showToast('Login required for this action', 'error');
        openAuthModal('login');
        return false;
    }
    if (typeof callback === 'function') callback();
    return true;
}

// Modal Logic
let authMode = 'login'; // 'login' or 'signup'

export function openAuthModal(mode = 'login') {
    authMode = mode;
    updateModalUI();
    els.authModal.classList.remove('hidden');
    els.authError.classList.add('hidden');
    els.authForm.reset();
}

function closeAuthModal() {
    els.authModal.classList.add('hidden');
}

function toggleAuthMode(e) {
    e.preventDefault();
    authMode = authMode === 'login' ? 'signup' : 'login';
    updateModalUI();
}

function updateModalUI() {
    if (authMode === 'login') {
        els.authModalTitle.textContent = 'Log In';
        document.getElementById('btn-auth-submit').textContent = 'Log In';
        els.authSwitchPrompt.textContent = "Don't have an account?";
        els.btnSwitchAuth.textContent = 'Sign Up';
    } else {
        els.authModalTitle.textContent = 'Sign Up';
        document.getElementById('btn-auth-submit').textContent = 'Sign Up';
        els.authSwitchPrompt.textContent = "Already have an account?";
        els.btnSwitchAuth.textContent = 'Log In';
    }
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    els.authError.classList.add('hidden');
    
    try {
        if (authMode === 'login') {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            showToast('Logged in successfully!');
            closeAuthModal();
        } else {
            const { error } = await supabaseClient.auth.signUp({ email, password });
            if (error) throw error;
            showToast('Signup successful! You can now log in.', 'success');
            authMode = 'login';
            updateModalUI();
            els.authForm.reset();
        }
    } catch (err) {
        els.authError.textContent = err.message;
        els.authError.classList.remove('hidden');
    }
}

async function logout() {
    await supabaseClient.auth.signOut();
    showToast('Logged out successfully', 'info');
}
