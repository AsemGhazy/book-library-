'use strict';

/**
 * MAIN.JS - Central Application Controller
 * 
 * This file serves as the main entry point for shared functionality
 * across the entire Online Book Library application.
 * 
 * Responsibilities:
 * - Initialize shared UI components
 * - Handle global event listeners
 * - Manage application state
 * - Provide utility functions
 */

// ============================================
// APPLICATION STATE
// ============================================

const App = {
  // Shared state
  state: {
    currentPage: window.location.pathname.split('/').pop() || 'index.html',
    isLoading: false,
    error: null,
  },

  // DOM references
  elements: {
    navbar: null,
    footer: null,
    mainContent: null,
  },

  // Initialize the application
  init() {
    console.log('📚 Online Book Library initialized');

    // Apply saved theme (dark/light) as early as possible
    this.initTheme();

    // Cache DOM elements
    this.cacheElements();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Handle page-specific initialization
    this.handlePageInit();
    
    // Log current page
    console.log(`📍 Current page: ${this.state.currentPage}`);
  },

  // Cache important DOM elements
  cacheElements() {
    this.elements.navbar = document.querySelector('nav.navbar');
    this.elements.footer = document.querySelector('footer.site-footer');
    this.elements.mainContent = document.querySelector('main');
  },

  // Set up global event listeners
  setupEventListeners() {
    // Handle page visibility change (for refresh scenarios)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.handlePageVisibilityChange();
      }
    });

    // Handle network status changes
    window.addEventListener('online', () => {
      this.handleNetworkChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.handleNetworkChange(false);
    });

    // Handle scroll events (for lazy loading)
    window.addEventListener('scroll', () => {
      this.handleScroll();
    });

    // Global error handling
    window.addEventListener('error', (event) => {
      this.handleGlobalError(event);
    });

    // Unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      this.handleGlobalError(event);
    });
  },

  // Handle page-specific initialization
  handlePageInit() {
    const page = this.state.currentPage;
    
    // Common initialization for all pages
    this.updateActiveNavLink();
    this.updateFooterYear();

    // Page-specific initialization
    switch(page) {
      case 'index.html':
      case '':
        this.initHomePage();
        break;
      case 'books.html':
        this.initBooksPage();
        break;
      case 'categories.html':
        this.initCategoriesPage();
        break;
      case 'authors.html':
        this.initAuthorsPage();
        break;
      case 'book-details.html':
        this.initBookDetailsPage();
        break;
      case 'favorites.html':
        this.initFavoritesPage();
        break;
    }
  },

  // Update active navigation link
  updateActiveNavLink() {
    const currentPage = this.state.currentPage;
    const navLinks = document.querySelectorAll('.navbar .nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      // Remove active class from all
      link.classList.remove('active');
      
      // Set active class on matching link
      if (href === currentPage || 
          (currentPage === '' && href === 'index.html') ||
          (href === currentPage)) {
        link.classList.add('active');
      }
    });
  },

  // Update footer year
  updateFooterYear() {
    const yearElements = document.querySelectorAll('.footer-copy');
    const currentYear = new Date().getFullYear();
    
    yearElements.forEach(el => {
      el.textContent = el.textContent.replace('2026', currentYear);
    });
  },

  // Handle page visibility change
  handlePageVisibilityChange() {
    // Refresh favorites count or other dynamic data
    if (document.querySelector('#favorites-list')) {
      // If on favorites page, refresh
      window.location.reload();
    }
  },

  // Handle network status change
  handleNetworkChange(isOnline) {
    if (isOnline) {
      console.log('🌐 Back online');
      this.showToast('Back online!', 'success');
    } else {
      console.log('📡 Offline');
      this.showToast('You are offline. Some features may be limited.', 'warning');
    }
  },

  // Handle scroll events
  handleScroll() {
    // Implement lazy loading for images
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    // Browser handles lazy loading natively with loading="lazy"
  },

  // Handle global errors
  handleGlobalError(event) {
    console.error('Global Error:', event);
    this.showToast('An unexpected error occurred. Please try again.', 'danger');
  },

  // Show toast notification
  showToast(message, type = 'info') {
    // Create toast if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    const toastId = `toast-${Date.now()}`;
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white bg-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning text-dark' : 'primary'}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    // Initialize and show toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 5000 });
    toast.show();

    // Clean up after toast is hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  },

  // ============================================
  // THEME (DARK MODE)
  // ============================================

  /**
   * Initialize theme from localStorage and wire up the toggle button
   */
  initTheme() {
    const saved = localStorage.getItem('bookLibraryTheme');
    const theme = saved === 'dark' ? 'dark' : 'light';
    this.applyTheme(theme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.addEventListener('click', () => this.toggleTheme());
    }
  },

  /**
   * Apply a theme ('light' | 'dark') to the page and persist it
   */
  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bookLibraryTheme', theme);

    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  },

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    this.applyTheme(current === 'dark' ? 'light' : 'dark');
  },

  // ============================================
  // PAGE-SPECIFIC INITIALIZATION
  // ============================================

  initHomePage() {
    console.log('🏠 Home page loaded');
    // Additional home page initialization if needed
  },

  initBooksPage() {
    console.log('📚 Books page loaded');
    // Additional books page initialization if needed
  },

  initCategoriesPage() {
    console.log('📂 Categories page loaded');
    // Additional categories page initialization if needed
  },

  initAuthorsPage() {
    console.log('✍️ Authors page loaded');
    // Additional authors page initialization if needed
  },

  initBookDetailsPage() {
    console.log('📖 Book details page loaded');
    // Additional book details page initialization if needed
  },

  initFavoritesPage() {
    console.log('♥ Favorites page loaded');
    // Additional favorites page initialization if needed
  },

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Debounce function to limit function calls
   */
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function to limit function calls
   */
  throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Escape HTML to prevent XSS attacks
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Truncate text to a certain length
   */
  truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  },

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  },

  /**
   * Get query parameter from URL
   */
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Scroll to top of page smoothly
   */
  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },

  /**
   * Lazy load images
   */
  lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => observer.observe(img));
  },

  /**
   * Get reading progress on page
   */
  getReadingProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  },

  /**
   * Display reading progress (for long content)
   */
  showReadingProgress() {
    const progressBar = document.getElementById('reading-progress-bar');
    if (!progressBar) return;

    window.addEventListener('scroll', this.throttle(() => {
      const progress = this.getReadingProgress();
      progressBar.style.width = `${progress}%`;
      progressBar.setAttribute('aria-valuenow', progress);
    }, 100));
  }
};

// ============================================
// INITIALIZE APPLICATION
// ============================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// ============================================
// EXPOSE APP GLOBALLY
// ============================================

// Make App accessible globally for debugging
window.App = App;

// Make utility functions available globally if needed
window.escapeHtml = App.escapeHtml.bind(App);
window.truncateText = App.truncateText.bind(App);
window.formatDate = App.formatDate.bind(App);
window.getQueryParam = App.getQueryParam.bind(App);
window.scrollToTop = App.scrollToTop.bind(App);