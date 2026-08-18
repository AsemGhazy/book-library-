'use strict';

/**
 * Book Details Page JavaScript
 * Handles loading and displaying book details
 */

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async function() {
  console.log('📖 Book Details page loaded');
  
  // Check if API is available
  if (typeof API === 'undefined') {
    console.error('❌ API module not loaded!');
    showError('Failed to load API. Please refresh the page.');
    return;
  }

  // Get book ID from URL
  const params = new URLSearchParams(window.location.search);
  const bookId = params.get('id');

  console.log(`🔍 Book ID from URL: ${bookId}`);

  // If no book ID, show error
  if (!bookId) {
    showError('No book ID provided. Please go back and select a book.', false);
    return;
  }

  // Load book details
  await loadBookDetails(bookId);
});

/**
 * Load book details from API
 */
async function loadBookDetails(bookId) {
  const container = document.getElementById('details-content');
  
  if (!container) {
    console.error('❌ Details container not found');
    return;
  }

  // Show loading state
  container.innerHTML = `
    <div class="text-center my-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2 text-muted">Loading book details...</p>
    </div>
  `;

  try {
    // Try to get book details from Google Books API
    let book = null;
    
    try {
      book = await API.getBookDetails(bookId);
      console.log('✅ Book loaded from Google Books:', book.title);
    } catch (googleError) {
      console.warn('⚠️ Google Books failed, trying Open Library...', googleError);
      
      // Try Open Library as fallback
      try {
        book = await loadFromOpenLibrary(bookId);
        console.log('✅ Book loaded from Open Library:', book.title);
      } catch (olError) {
        console.error('❌ Both APIs failed:', olError);
        throw new Error('Could not load book details from any source.');
      }
    }

    if (!book) {
      throw new Error('Book not found');
    }

    // Render book details
    renderBookDetails(book);
    
  } catch (error) {
    console.error('❌ Error loading book details:', error);
    container.innerHTML = `
      <div class="text-center my-5">
        <div class="alert alert-danger">
          <h5>⚠️ Failed to load book details</h5>
          <p>${error.message || 'Please try again later.'}</p>
          <div class="mt-3">
            <a href="./books.html" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> Back to Books
            </a>
            <button onclick="location.reload()" class="btn btn-outline-secondary btn-sm">
              <i class="fa-solid fa-rotate me-1"></i> Retry
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Load book from Open Library as fallback
 */
async function loadFromOpenLibrary(bookId) {
  try {
    // Try to fetch from Open Library
    const url = `https://openlibrary.org/works/${bookId}.json`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Open Library request failed: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Get cover image
    const coverId = data.covers?.[0];
    const cover = coverId 
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : API.FALLBACK_IMAGE;
    
    // Get authors
    let authors = ['Unknown Author'];
    if (data.authors && data.authors.length > 0) {
      try {
        const authorPromises = data.authors.map(async (author) => {
          const authorRes = await fetch(`https://openlibrary.org${author.author.key}.json`);
          const authorData = await authorRes.json();
          return authorData.name || 'Unknown Author';
        });
        authors = await Promise.all(authorPromises);
      } catch (e) {
        console.warn('Could not fetch author names:', e);
      }
    }
    
    return {
      id: bookId,
      title: data.title || 'Untitled',
      authors: authors,
      description: data.description || 'No description available.',
      cover: cover,
      publishedDate: data.first_publish_date || 'Unknown',
      publisher: data.publishers?.[0] || 'Unknown Publisher',
      pageCount: data.number_of_pages || 0,
      categories: data.subjects?.slice(0, 3) || ['General'],
      averageRating: 0,
      ratingsCount: 0,
      previewLink: `https://openlibrary.org/works/${bookId}`,
      infoLink: `https://openlibrary.org/works/${bookId}`,
    };
  } catch (error) {
    console.error('Error loading from Open Library:', error);
    throw error;
  }
}

/**
 * Render book details
 */
function renderBookDetails(book) {
  const container = document.getElementById('details-content');
  
  if (!container) return;

  const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author';
  const cover = book.cover || API.FALLBACK_IMAGE;
  const isFav = API.isFavorite(book.id);
  const rating = book.averageRating || 0;
  const stars = renderStars(rating);

  container.innerHTML = `
    <div class="row g-4">
      <div class="col-md-4 text-center">
        <img src="${cover}" class="img-fluid rounded shadow" 
             alt="${book.title} cover" 
             style="max-height: 500px; object-fit: contain; width: 100%; background-color: #f8f9fa; padding: 10px;"
             onerror="this.src='${API.FALLBACK_IMAGE}'">
      </div>
      <div class="col-md-8">
        <h2 class="fw-bold mb-3">${book.title}</h2>
        
        <div class="mb-3">
          <span class="badge bg-primary me-2"><i class="fa-regular fa-user me-1"></i> Author</span>
          <span class="fw-bold">${authors}</span>
        </div>
        
        <div class="row g-2 mb-3">
          <div class="col-6 col-md-4">
            <span class="badge bg-secondary me-1"><i class="fa-regular fa-calendar me-1"></i> Published</span>
            <span class="small">${book.publishedDate || 'N/A'}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="badge bg-secondary me-1"><i class="fa-regular fa-building me-1"></i> Publisher</span>
            <span class="small">${book.publisher || 'N/A'}</span>
          </div>
          <div class="col-6 col-md-4">
            <span class="badge bg-secondary me-1"><i class="fa-regular fa-file-lines me-1"></i> Pages</span>
            <span class="small">${book.pageCount || 'N/A'}</span>
          </div>
        </div>
        
        ${book.categories && book.categories.length > 0 ? `
          <div class="mb-3">
            <span class="badge bg-info me-2"><i class="fa-regular fa-tags me-1"></i> Categories</span>
            ${book.categories.map(cat => `<span class="badge bg-light text-dark me-1">${cat}</span>`).join('')}
          </div>
        ` : ''}
        
        ${rating > 0 ? `
          <div class="mb-3">
            <span class="badge bg-warning text-dark me-2"><i class="fa-solid fa-star me-1"></i> Rating</span>
            <span class="fw-bold">${stars}</span>
            <span class="text-muted small">(${book.ratingsCount || 0} reviews)</span>
          </div>
        ` : ''}
        
        <div class="mt-4">
          <h5 class="fw-bold">Description</h5>
          <p class="text-muted" style="line-height: 1.8;">${book.description || 'No description available for this book.'}</p>
        </div>
        
        <div class="mt-4 d-flex gap-3 flex-wrap">
          <button onclick="handleSaveBook('${book.id}')" class="btn ${isFav ? 'btn-danger' : 'btn-outline-danger'} rounded-pill px-4">
            <i class="${isFav ? 'fa-solid' : 'fa-regular'} fa-heart me-2"></i>
            ${isFav ? 'Saved to Favorites' : 'Add to Favorites'}
          </button>
          ${book.previewLink ? `
            <a href="${book.previewLink}" target="_blank" class="btn btn-primary rounded-pill px-4">
              <i class="fa-solid fa-eye me-2"></i> Preview Book
            </a>
          ` : ''}
          <a href="./books.html" class="btn btn-secondary rounded-pill px-4">
            <i class="fa-solid fa-arrow-left me-2"></i> Back to Books
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render star ratings
 */
function renderStars(rating) {
  const fullStars = Math.round(rating || 0);
  const emptyStars = 5 - Math.min(fullStars, 5);
  return '★'.repeat(Math.min(fullStars, 5)) + '☆'.repeat(Math.max(0, emptyStars));
}

/**
 * Handle save book to favorites
 */
function handleSaveBook(bookId) {
  // Find the book in the current view
  const title = document.querySelector('h2')?.textContent || 'Untitled';
  const authorElement = document.querySelector('.fw-bold');
  const authors = authorElement ? [authorElement.textContent] : ['Unknown Author'];
  const cover = document.querySelector('img')?.src || API.FALLBACK_IMAGE;

  const book = {
    id: bookId,
    title: title,
    authors: authors,
    cover: cover,
    description: document.querySelector('.text-muted')?.textContent || '',
    averageRating: 0,
    ratingsCount: 0,
  };

  const saved = API.addToFavorites(book);
  const btn = document.querySelector('.btn-danger, .btn-outline-danger');
  
  if (saved) {
    // Update button
    if (btn) {
      btn.className = 'btn btn-danger rounded-pill px-4';
      btn.innerHTML = '<i class="fa-solid fa-heart me-2"></i> Saved to Favorites';
      btn.style.transition = 'all 0.3s ease';
    }
    // Show toast if App is available
    if (typeof App !== 'undefined') {
      App.showToast(`"${title}" added to favorites!`, 'success');
    } else {
      alert(`"${title}" added to favorites!`);
    }
  } else {
    if (typeof App !== 'undefined') {
      App.showToast('This book is already in your favorites!', 'warning');
    } else {
      alert('This book is already in your favorites!');
    }
  }
}

/**
 * Show error message
 */
function showError(message, showBackButton = true) {
  const container = document.getElementById('details-content');
  if (!container) return;

  container.innerHTML = `
    <div class="text-center my-5">
      <div class="alert alert-danger">
        <h5>⚠️ Error</h5>
        <p>${message}</p>
        ${showBackButton ? `
          <div class="mt-3">
            <a href="./books.html" class="btn btn-primary btn-sm">
              <i class="fa-solid fa-arrow-left me-1"></i> Back to Books
            </a>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// Make functions available globally
window.handleSaveBook = handleSaveBook;
window.loadBookDetails = loadBookDetails;

console.log('✅ Book Details module loaded');