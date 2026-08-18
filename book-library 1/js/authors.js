'use strict';

/**
 * Authors Page JavaScript
 * Handles author search and display
 */

const authorsContainer = document.getElementById('authors-container');
const searchInput = document.getElementById('author-search-input');
const searchBtn = document.getElementById('author-search-btn');
const loader = document.getElementById('loader');

document.addEventListener('DOMContentLoaded', function() {
  // Initialize hero cover animation
  initHeroCoverFade('authorsCoverFront', 'authorsCoverBack');

  // Load default authors
  fetchAuthors('Robert C. Martin');

  // Set up search
  searchBtn.addEventListener('click', function() {
    const searchTerm = searchInput.value.trim();
    if (searchTerm) fetchAuthors(searchTerm);
  });

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const searchTerm = this.value.trim();
      if (searchTerm) fetchAuthors(searchTerm);
    }
  });
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
 * Fetch authors from API
 */
async function fetchAuthors(query) {
  loader.classList.remove('d-none');
  authorsContainer.innerHTML = '';

  try {
    const authors = await API.searchAuthors(query, 12);
    
    loader.classList.add('d-none');

    if (authors && authors.length > 0) {
      displayAuthors(authors);
    } else {
      authorsContainer.innerHTML = `
        <div class="col-12 text-center my-5">
          <h5 class="text-muted">No authors found for "${query}"</h5>
        </div>
      `;
    }
  } catch (error) {
    loader.classList.add('d-none');
    authorsContainer.innerHTML = `
      <div class="col-12 text-center my-5 text-danger">
        <p>An error occurred while fetching data. Please try again.</p>
      </div>
    `;
  }
}

/**
 * Display authors in grid
 */
function displayAuthors(authors) {
  authorsContainer.innerHTML = authors.map(author => {
    const photoUrl = author.photoUrl || API.FALLBACK_IMAGE;
    const workCount = author.workCount || 0;
    const topWork = author.topWork || 'Not specified';

    return `
      <div class="col">
        <div class="card h-100 shadow-sm border-0 text-center p-3 author-card">
          <div class="d-flex justify-content-center my-3">
            <img src="${photoUrl}" class="rounded-circle img-thumbnail author-img" style="width: 120px; height: 120px; object-fit: cover;" alt="${author.name}" onerror="this.src='${API.FALLBACK_IMAGE}'">
          </div>
          <div class="card-body p-2 d-flex flex-column justify-content-between">
            <div>
              <h5 class="card-title fw-bold text-dark mb-2">${author.name}</h5>
              <p class="text-muted small mb-2"><i class="fa-solid fa-book me-1 text-primary"></i> <strong>Top Work:</strong> ${topWork}</p>
              <p class="text-secondary small mb-3"><i class="fa-solid fa-layer-group me-1 text-warning"></i> <strong>Total Works:</strong> ${workCount}</p>
            </div>
            <a href="https://openlibrary.org/authors/${author.id}" target="_blank" class="btn btn-outline-warning btn-sm w-100 fw-bold rounded-pill text-dark">
              View Profile <i class="fa-solid fa-arrow-right ms-1"></i>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}