'use strict';

/**
 * Categories Page JavaScript
 * Handles category display, filtering, and book listing by category
 */

const CATEGORIES = [
  { id: 'fiction', name: 'Fiction', icon: '🎨', count: '18.2K' },
  { id: 'science', name: 'Science', icon: '🔬', count: '9.4K' },
  { id: 'history', name: 'History', icon: '📜', count: '11.7K' },
  { id: 'technology', name: 'Technology', icon: '💻', count: '7.9K' },
  { id: 'fantasy', name: 'Fantasy', icon: '🧙‍♂️', count: '14.1K' },
  { id: 'business', name: 'Business', icon: '📈', count: '6.3K' },
  { id: 'romance', name: 'Romance', icon: '💌', count: '10.5K' },
  { id: 'mystery', name: 'Mystery', icon: '🕵️', count: '8.8K' },
  { id: 'biography', name: 'Biography', icon: '🪶', count: '5.2K' },
  { id: 'poetry', name: 'Poetry', icon: '✒️', count: '3.6K' },
  { id: 'travel', name: 'Travel', icon: '🧭', count: '4.1K' },
  { id: 'selfhelp', name: 'Self-Help', icon: '🌱', count: '6.9K' },
];

let activeCategoryId = 'fiction';

document.addEventListener('DOMContentLoaded', function() {
  // Initialize hero floating badges
  initHeroBadgeCycle();

  // Render categories
  renderCategories(CATEGORIES);

  // Set up category search
  initCategorySearch();

  // Load default category books
  loadCategoryBooks('fiction', 'Fiction');
});

/**
 * Initialize hero floating badge cycle
 */
function initHeroBadgeCycle() {
  const iconA = document.getElementById('floatIconA');
  const labelA = document.getElementById('floatLabelA');
  const iconB = document.getElementById('floatIconB');
  const labelB = document.getElementById('floatLabelB');

  if (!iconA || !labelA || !iconB || !labelB) return;

  let index = 0;
  const cycleCategories = CATEGORIES.slice(0, 6);

  setInterval(() => {
    const nextA = cycleCategories[index % cycleCategories.length];
    const nextB = cycleCategories[(index + 1) % cycleCategories.length];
    index = (index + 1) % cycleCategories.length;

    // Update A
    const cardA = iconA.closest('.cat-float-card');
    cardA.style.opacity = '0';
    setTimeout(() => {
      iconA.textContent = nextA.icon;
      labelA.textContent = nextA.name;
      cardA.style.opacity = '1';
    }, 400);

    // Update B
    const cardB = iconB.closest('.cat-float-card');
    cardB.style.opacity = '0';
    setTimeout(() => {
      iconB.textContent = nextB.icon;
      labelB.textContent = nextB.name;
      cardB.style.opacity = '1';
    }, 600);
  }, 3000);
}

/**
 * Render category grid
 */
function renderCategories(categories) {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  grid.innerHTML = categories.map(cat => `
    <div class="col">
      <div class="genre-card ${cat.id === activeCategoryId ? 'active' : ''}" data-id="${cat.id}" data-name="${cat.name}" role="button" tabindex="0">
        <span class="genre-card-icon">${cat.icon}</span>
        <span class="genre-card-name">${cat.name}</span>
        <span class="genre-card-count">${cat.count} books</span>
      </div>
    </div>
  `).join('');

  // Add click handlers
  grid.querySelectorAll('.genre-card').forEach(card => {
    card.addEventListener('click', function() {
      const id = this.dataset.id;
      const name = this.dataset.name;
      selectCategory(id, name);
    });
  });
}

/**
 * Select a category and load its books
 */
async function selectCategory(categoryId, categoryName) {
  activeCategoryId = categoryId;

  // Update active state
  document.querySelectorAll('.genre-card').forEach(card => {
    card.classList.toggle('active', card.dataset.id === categoryId);
  });

  // Update title
  const titleEl = document.getElementById('categoryBooksTitle');
  if (titleEl) {
    titleEl.textContent = `Books in ${categoryName}`;
  }

  // Load books
  await loadCategoryBooks(categoryId, categoryName);

  // Scroll to books section
  const section = document.getElementById('categoryBooksSection');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Load books for a category
 */
async function loadCategoryBooks(categoryId, categoryName) {
  const row = document.getElementById('categoryBooksRow');
  if (!row) return;

  // Show loading skeleton
  row.innerHTML = Array.from({ length: 4 }, () => `
    <div class="col-6 col-md-4 col-lg-3">
      <div class="book-card-skeleton">
        <div class="skeleton-thumb"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `).join('');

  try {
    const books = await API.getBooksByCategory(categoryId, 8);
    renderCategoryBooks(books, categoryName);
  } catch (error) {
    console.error('Error loading category books:', error);
    row.innerHTML = `
      <div class="col-12 text-center text-danger py-4">
        <p>Failed to load books for this category. Please try again.</p>
      </div>
    `;
  }
}

/**
 * Render category books
 */
function renderCategoryBooks(books, categoryName) {
  const row = document.getElementById('categoryBooksRow');
  if (!row) return;

  if (!books || books.length === 0) {
    row.innerHTML = `
      <div class="col-12 text-center py-4">
        <p class="text-muted">No books found in this category.</p>
      </div>
    `;
    return;
  }

  row.innerHTML = books.map(book => {
    const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors || 'Unknown Author';
    const cover = book.cover || API.FALLBACK_IMAGE;

    return `
      <div class="col-6 col-md-4 col-lg-3">
        <div class="book-card">
          <img src="${cover}" alt="${book.title} cover" loading="lazy" onerror="this.src='${API.FALLBACK_IMAGE}'" />
          <div class="book-card-body">
            <span class="category-badge-tag">${categoryName}</span>
            <p class="book-card-title">${book.title}</p>
            <p class="book-card-author">${authors}</p>
            <button class="btn-save ${API.isFavorite(book.id) ? 'saved' : ''}" data-id="${book.id}" type="button">
              ${API.isFavorite(book.id) ? '♥ Saved' : '♥ Save'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

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
 * Initialize category search
 */
function initCategorySearch() {
  const form = document.getElementById('categorySearchForm');
  const input = document.getElementById('categorySearchInput');

  if (!form || !input) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
  });

  input.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    const filtered = CATEGORIES.filter(cat => 
      cat.name.toLowerCase().includes(query)
    );
    renderCategories(filtered);
  });
}