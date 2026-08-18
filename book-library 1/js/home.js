'use strict';

/**
 * Home Page JavaScript
 * Handles hero animations, new arrivals, best sellers, and promo sections
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize hero cover fade animation
  initHeroCoverFade('coverFront', 'coverBack');

  // Load featured content
  await loadFeaturedContent();
});

/**
 * Initialize hero cover fade animation
 */
function initHeroCoverFade(frontId, backId) {
  const front = document.getElementById(frontId);
  const back = document.getElementById(backId);
  
  if (!front || !back) return;

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
 * Load featured content from API
 */
async function loadFeaturedContent() {
  try {
    // Fetch default books
    const books = await API.searchBooks('bestseller', 8);
    
    // Render best sellers
    renderBestSellers(books);

    // Render new arrivals (first 4 books)
    renderNewArrivals(books.slice(0, 4));

    // Render promo (next 3 books)
    renderPromo(books.slice(4, 7));
  } catch (error) {
    console.error('Error loading featured content:', error);
  }
}

/**
 * Render best sellers
 */
function renderBestSellers(books) {
  const row = document.getElementById('bestSellersRow');
  if (!row) return;

  row.innerHTML = books.map(book => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="book-card">
        <img src="${book.cover}" alt="${book.title} cover" loading="lazy" onerror="this.src='${API.FALLBACK_IMAGE}'" />
        <div class="book-card-body">
          <p class="book-card-title">${book.title}</p>
          <p class="book-card-author">${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'}</p>
          <p class="book-card-rating">
            ${renderStars(book.averageRating || 4.5)} <span>(${book.ratingsCount || 100})</span>
          </p>
          <button class="btn-save ${API.isFavorite(book.id) ? 'saved' : ''}" data-id="${book.id}" type="button">
            ${API.isFavorite(book.id) ? '♥ Saved' : '♥ Save'}
          </button>
        </div>
      </div>
    </div>
  `).join('');

  // Add save functionality
  row.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', function() {
      const book = books.find(b => b.id === this.dataset.id);
      if (book) {
        const saved = API.addToFavorites(book);
        this.classList.toggle('saved', saved);
        this.textContent = saved ? '♥ Saved' : '♥ Save';
      }
    });
  });
}

/**
 * Render new arrivals
 */
function renderNewArrivals(books) {
  const row = document.getElementById('newArrivalsRow');
  if (!row) return;

  row.innerHTML = books.map(book => `
    <div class="col-6 col-md-3">
      <div class="new-arrival-card">
        <span class="new-badge">NEW</span>
        <img src="${book.cover}" alt="${book.title} cover" loading="lazy" onerror="this.src='${API.FALLBACK_IMAGE}'" />
        <div class="new-arrival-body">
          <p class="book-card-title">${book.title}</p>
          <p class="book-card-author mb-0">${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'}</p>
        </div>
      </div>
    </div>
  `).join('');
}

/**
 * Render promo books
 */
function renderPromo(books) {
  const row = document.getElementById('promoRow');
  if (!row) return;

  row.innerHTML = books.map(book => `
    <div class="col-12 col-md-4">
      <div class="promo-card">
        <img src="${book.cover}" alt="${book.title} cover" loading="lazy" onerror="this.src='${API.FALLBACK_IMAGE}'" />
        <h5>${book.title}</h5>
        <p>by ${Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author'}</p>
      </div>
    </div>
  `).join('');
}

/**
 * Render star ratings
 */
function renderStars(rating) {
  const fullStars = Math.round(rating || 0);
  return '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
}