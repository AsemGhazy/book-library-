'use strict';

/**
 * Books Page JavaScript
 * Handles book search, filtering, and display
 */

// Wait for DOM and dependencies to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📚 Books page loaded');
  
  // Check if API is available
  if (typeof API === 'undefined') {
    console.error('❌ API module not loaded!');
    showError('Failed to load API. Please refresh the page.');
    return;
  }

  // Initialize hero cover animation
  initHeroCovers();

  // Set up search and filter
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const categoryFilter = document.getElementById('category-filter');

  if (!searchInput || !searchBtn || !categoryFilter) {
    console.error('❌ Required elements not found!');
    return;
  }

  // Load initial books
  loadBooks('programming');

  // Search on button click
  searchBtn.addEventListener('click', function() {
    const query = searchInput.value.trim();
    if (query) {
      loadBooks(query);
    }
  });

  // Search on Enter key
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const query = this.value.trim();
      if (query) {
        loadBooks(query);
      }
    }
  });

  // Filter on category change
  categoryFilter.addEventListener('change', function() {
    const query = this.value;
    loadBooks(query);
  });
});

/**
 * Initialize hero cover animation
 */
function initHeroCovers() {
  const front = document.getElementById('booksCoverFront');
  const back = document.getElementById('booksCoverBack');
  
  if (!front || !back) {
    console.warn('⚠️ Hero cover elements not found');
    return;
  }

  const coversFront = [
    'https://covers.openlibrary.org/b/id/8231856-M.jpg',
    'https://covers.openlibrary.org/b/id/8236646-M.jpg',
    'https://covers.openlibrary.org/b/id/8239534-M.jpg',
  ];
  
  const coversBack = [
    'https://covers.openlibrary.org/b/id/8235116-M.jpg',
    'https://covers.openlibrary.org/b/id/8237965-M.jpg',
    'https://covers.openlibrary.org/b/id/8240123-M.jpg',
  ];

  let index = 0;
  front.src = coversFront[0];
  back.src = coversBack[0];

  setInterval(() => {
    index = (index + 1) % coversFront.length;

    [front, back].forEach((img, i) => {
      const nextSrc = i === 0 ? coversFront[index] : coversBack[index];
      img.style.opacity = '0';
      setTimeout(() => {
        img.src = nextSrc;
        img.style.opacity = '1';
      }, 400);
    });
  }, 3000);
}

/**
 * Load books from API
 */
async function loadBooks(query) {
  const container = document.getElementById('books-container');
  const loader = document.getElementById('loader');
  
  if (!container || !loader) {
    console.error('❌ Container or loader not found');
    return;
  }

  // Show loader
  loader.classList.remove('d-none');
  container.innerHTML = '';

  try {
    // Check if API is available
    if (typeof API === 'undefined') {
      throw new Error('API module not loaded');
    }

    // Search for books
    const books = await API.searchBooks(query, 12);
    
    // Hide loader
    loader.classList.add('d-none');

    if (books && books.length > 0) {
      renderBooks(books);
    } else {
      container.innerHTML = `
        <div class="col-12 text-center my-5">
          <h5 class="text-muted">No books found for "${query}"</h5>
          <p class="text-muted small">Try searching for something else.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('❌ Error loading books:', error);
    loader.classList.add('d-none');
    container.innerHTML = `
      <div class="col-12 text-center my-5">
        <div class="alert alert-danger">
          <h5>⚠️ Oops! Something went wrong</h5>
          <p>We couldn't load the books. Please try again.</p>
          <button onclick="location.reload()" class="btn btn-primary btn-sm mt-2">
            <i class="fa-solid fa-rotate me-1"></i> Refresh Page
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Render books in grid
 */
function renderBooks(books) {
  const container = document.getElementById('books-container');
  
  if (!container) return;

  container.innerHTML = books.map(book => {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author';
    const cover = book.cover || 'https://placehold.co/300x420/f5f5f5/777?text=No+Cover';
    const rating = book.averageRating || 0;

    const isFav = typeof API !== 'undefined' ? API.isFavorite(book.id) : false;

    return `
      <div class="col">
        <div class="card h-100 shadow-sm book-card">
          <img src="${cover}" class="card-img-top book-cover" alt="${book.title}" 
               onerror="this.src='https://placehold.co/300x420/f5f5f5/777?text=No+Cover'" 
               style="height: 250px; object-fit: contain; background-color: #f1f5f9; padding: 12px;">
          <div class="card-body d-flex flex-column justify-content-between">
            <div>
              <h6 class="card-title fw-bold text-dark mb-1 line-clamp-2" title="${book.title}">${book.title}</h6>
              <p class="card-text text-muted small mb-2"><i class="fa-regular fa-user me-1"></i>${authors}</p>
              <p class="card-text small mb-3">
                ${renderStars(rating)} <span class="text-muted">(${book.ratingsCount || 0})</span>
              </p>
            </div>
            <div class="d-grid gap-2">
              <button class="btn-save ${isFav ? 'saved' : ''}" data-id="${book.id}" type="button">
                ${isFav ? '♥ Saved' : '♥ Save'}
              </button>
              <a href="book-details.html?id=${encodeURIComponent(book.id)}" class="btn btn-outline-primary btn-sm w-100 fw-bold rounded-pill">
                View Details <i class="fa-solid fa-arrow-right ms-1"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Add save functionality
  container.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', function() {
      const book = books.find(b => b.id === this.dataset.id);
      if (book && typeof API !== 'undefined') {
        const saved = API.addToFavorites(book);
        this.classList.toggle('saved', saved);
        this.textContent = saved ? '♥ Saved' : '♥ Save';
        
        // Show toast notification
        if (saved && typeof App !== 'undefined') {
          App.showToast(`"${book.title}" added to favorites!`, 'success');
        }
      }
    });
  });
}

/**
 * Render star ratings
 */
function renderStars(rating) {
  const fullStars = Math.round(rating || 0);
  return '★'.repeat(Math.min(fullStars, 5)) + '☆'.repeat(Math.max(0, 5 - Math.min(fullStars, 5)));
}

/**
 * Show error message
 */
function showError(message) {
  const container = document.getElementById('books-container');
  if (container) {
    container.innerHTML = `
      <div class="col-12 text-center my-5">
        <div class="alert alert-danger">
          <h5>⚠️ Error</h5>
          <p>${message}</p>
        </div>
      </div>
    `;
  }
}

// Export for debugging
window.booksPage = {
  loadBooks,
  renderBooks,
  renderStars
};