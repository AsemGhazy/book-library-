'use strict';

/**
 * Favorites Page JavaScript
 * Handles displaying and managing favorite books
 */

const favoritesList = document.getElementById('favorites-list');
const emptyState = document.getElementById('empty-state');

document.addEventListener('DOMContentLoaded', function() {
  renderFavorites();
});

/**
 * Render favorites
 */
function renderFavorites() {
  const favorites = API.getFavorites();

  if (favorites.length === 0) {
    emptyState.classList.remove('d-none');
    favoritesList.innerHTML = '';
    return;
  }

  emptyState.classList.add('d-none');

  favoritesList.innerHTML = favorites.map(book => {
    const cover = book.cover || book.thumbnail || API.FALLBACK_IMAGE;
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author';
    const title = book.title || 'Untitled';

    return `
      <div class="col">
        <div class="card h-100 border-0 shadow-sm overflow-hidden">
          <div class="bg-light text-center p-3">
            <img src="${cover}" class="img-fluid rounded" style="height: 260px; width: 100%; object-fit: contain;" alt="${title} cover" loading="lazy" onerror="this.src='${API.FALLBACK_IMAGE}'">
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold mb-2" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${title}</h5>
            <p class="card-text text-muted small mb-3"><i class="fa-regular fa-user me-1"></i>${authors}</p>
            <div class="mt-auto d-grid gap-2">
              <a href="book-details.html?id=${encodeURIComponent(book.id)}" class="btn btn-outline-danger btn-sm rounded-pill">
                <i class="fa-solid fa-circle-info me-1"></i> View Details
              </a>
              <button type="button" class="btn btn-danger btn-sm rounded-pill" onclick="handleRemoveFavorite('${encodeURIComponent(book.id)}')">
                <i class="fa-solid fa-heart-crack me-1"></i> Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Handle removing a favorite
 */
function handleRemoveFavorite(bookId) {
  if (confirm('Are you sure you want to remove this book from your favorites?')) {
    API.removeFromFavorites(bookId);
    renderFavorites();
  }
}

// Make function available globally
window.handleRemoveFavorite = handleRemoveFavorite;