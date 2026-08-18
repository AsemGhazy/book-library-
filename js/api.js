'use strict';

/**
 * Centralized API Module for Online Book Library
 * Handles all external API calls with error handling and fallbacks
 */

const API = {
  // Configuration
  GOOGLE_BOOKS_URL: 'https://www.googleapis.com/books/v1/volumes',
  OPEN_LIBRARY_URL: 'https://openlibrary.org',
  OPEN_LIBRARY_SEARCH_URL: 'https://openlibrary.org/search.json',
  MAX_RESULTS: 12,
  FALLBACK_IMAGE: 'https://placehold.co/300x420/f5f5f5/777?text=No+Cover',

  /**
   * Normalize Google Books API response to consistent format
   */
  normalizeGoogleBook(item) {
    const volumeInfo = item.volumeInfo || {};
    const imageLinks = volumeInfo.imageLinks || {};
    
    return {
      id: item.id || `book-${Date.now()}`,
      title: volumeInfo.title || 'Untitled',
      authors: volumeInfo.authors || ['Unknown Author'],
      description: volumeInfo.description || 'No description available.',
      cover: imageLinks.thumbnail || imageLinks.smallThumbnail || this.FALLBACK_IMAGE,
      publishedDate: volumeInfo.publishedDate || 'Unknown',
      publisher: volumeInfo.publisher || 'Unknown Publisher',
      pageCount: volumeInfo.pageCount || 0,
      categories: volumeInfo.categories || ['General'],
      averageRating: volumeInfo.averageRating || 0,
      ratingsCount: volumeInfo.ratingsCount || 0,
      previewLink: volumeInfo.previewLink || null,
      infoLink: volumeInfo.infoLink || null,
    };
  },

  /**
   * Search books using Google Books API
   */
  async searchBooks(query, maxResults = 12) {
    if (!query || query.trim().length === 0) {
      return this.getDefaultBooks();
    }

    try {
      const url = `${this.GOOGLE_BOOKS_URL}?q=${encodeURIComponent(query)}&maxResults=${maxResults}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        console.warn('No results found, using fallback data');
        return this.getDefaultBooks();
      }

      return data.items.map(item => this.normalizeGoogleBook(item));
    } catch (error) {
      console.error('Error fetching books from Google Books API:', error);
      // Google Books can be rate-limited without warning; use a live backup source.
      return this.searchOpenLibrary(query, maxResults);
    }
  },

  /**
   * Search books using Open Library when Google Books is unavailable
   */
  async searchOpenLibrary(query, limit = 12) {
    try {
      const url = `${this.OPEN_LIBRARY_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Open Library request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return this.getFallbackBooks(query);
      }

      return data.docs.slice(0, limit).map(book => ({
        id: book.key ? book.key.replace('/works/', '') : `ol-${Date.now()}`,
        title: book.title || 'Untitled',
        authors: book.author_name || ['Unknown Author'],
        description: 'No description available.',
        cover: book.cover_i
          ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
          : this.FALLBACK_IMAGE,
        publishedDate: book.first_publish_year ? `${book.first_publish_year}` : 'Unknown',
        publisher: book.publisher?.[0] || 'Unknown Publisher',
        pageCount: book.number_of_pages_median || 0,
        categories: book.subject?.slice(0, 3) || ['General'],
        averageRating: 0,
        ratingsCount: book.ratings_count || 0,
        previewLink: book.key ? `${this.OPEN_LIBRARY_URL}${book.key}` : null,
        infoLink: book.key ? `${this.OPEN_LIBRARY_URL}${book.key}` : null,
      }));
    } catch (error) {
      console.error('Error fetching books from Open Library:', error);
      return this.getFallbackBooks(query);
    }
  },

  /**
   * Get book details by ID from Google Books API
   */
  async getBookDetails(bookId) {
    if (!bookId) {
      throw new Error('Book ID is required');
    }

    try {
      const url = `${this.GOOGLE_BOOKS_URL}/${encodeURIComponent(bookId)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return this.normalizeGoogleBook(data);
    } catch (error) {
      console.error('Error fetching book details:', error);
      throw error;
    }
  },

  /**
   * Search authors using Open Library API
   */
  async searchAuthors(query, limit = 12) {
    if (!query || query.trim().length === 0) {
      return this.getDefaultAuthors();
    }

    try {
      const url = `https://openlibrary.org/search/authors.json?q=${encodeURIComponent(query)}&limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return this.getDefaultAuthors();
      }

      return data.docs.slice(0, limit).map(author => ({
        id: author.key ? author.key.replace('/authors/', '') : `author-${Date.now()}`,
        name: author.name || 'Unknown Author',
        topWork: author.top_work || 'Not specified',
        workCount: author.work_count || 0,
        birthDate: author.birth_date || null,
        deathDate: author.death_date || null,
        photoUrl: author.key 
          ? `https://covers.openlibrary.org/a/olid/${author.key.replace('/authors/', '')}-M.jpg` 
          : this.FALLBACK_IMAGE,
      }));
    } catch (error) {
      console.error('Error fetching authors:', error);
      return this.getDefaultAuthors();
    }
  },

  /**
   * Get books by category/subject using Open Library API
   */
  async getBooksByCategory(category, limit = 8) {
    if (!category) {
      return this.getDefaultBooks();
    }

    try {
      const url = `https://openlibrary.org/subjects/${encodeURIComponent(category)}.json?limit=${limit}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();

      if (!data.works || data.works.length === 0) {
        return this.getDefaultBooks();
      }

      return data.works.map(work => ({
        id: work.key ? work.key.replace('/works/', '') : `work-${Date.now()}`,
        title: work.title || 'Untitled',
        authors: work.authors ? work.authors.map(a => a.name) : ['Unknown Author'],
        cover: work.cover_id 
          ? `https://covers.openlibrary.org/b/id/${work.cover_id}-M.jpg`
          : this.FALLBACK_IMAGE,
        description: work.description || 'No description available.',
        publishedDate: work.first_publish_year ? `${work.first_publish_year}` : 'Unknown',
        averageRating: 0,
        ratingsCount: 0,
      }));
    } catch (error) {
      console.error('Error fetching books by category:', error);
      return this.getDefaultBooks();
    }
  },

  /**
   * Get default books for initial load
   */
  getDefaultBooks() {
    const defaultTitles = ['javascript', 'python', 'fiction', 'science'];
    const randomQuery = defaultTitles[Math.floor(Math.random() * defaultTitles.length)];
    return this.getFallbackBooks(randomQuery);
  },

  /**
   * Fallback books when API fails
   */
  getFallbackBooks(query) {
    const fallbackBooks = [
      {
        id: 'fb1',
        title: `Books about "${query}"`,
        authors: ['Various Authors'],
        description: 'Sample book description. Please try searching again.',
        cover: this.FALLBACK_IMAGE,
        publishedDate: '2024',
        publisher: 'Sample Publisher',
        pageCount: 200,
        categories: ['General'],
        averageRating: 0,
        ratingsCount: 0,
      },
      {
        id: 'fb2',
        title: 'The Art of Programming',
        authors: ['John Developer'],
        description: 'A comprehensive guide to modern programming practices.',
        cover: this.FALLBACK_IMAGE,
        publishedDate: '2023',
        publisher: 'Tech Press',
        pageCount: 350,
        categories: ['Programming'],
        averageRating: 4.5,
        ratingsCount: 120,
      },
      {
        id: 'fb3',
        title: 'Data Science Essentials',
        authors: ['Jane Analyst'],
        description: 'Learn data science from the ground up.',
        cover: this.FALLBACK_IMAGE,
        publishedDate: '2023',
        publisher: 'Data Books',
        pageCount: 280,
        categories: ['Data Science'],
        averageRating: 4.2,
        ratingsCount: 89,
      },
    ];
    return fallbackBooks;
  },

  /**
   * Get default authors for initial load
   */
  getDefaultAuthors() {
    return [
      { id: '1', name: 'Martin Fowler', topWork: 'Refactoring', workCount: 12, photoUrl: this.FALLBACK_IMAGE },
      { id: '2', name: 'Robert C. Martin', topWork: 'Clean Code', workCount: 15, photoUrl: this.FALLBACK_IMAGE },
      { id: '3', name: 'Donald Knuth', topWork: 'The Art of Computer Programming', workCount: 20, photoUrl: this.FALLBACK_IMAGE },
      { id: '4', name: 'J.K. Rowling', topWork: 'Harry Potter', workCount: 18, photoUrl: this.FALLBACK_IMAGE },
    ];
  },

  /**
   * Favorites helpers
   */
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('bookLibraryFavorites')) || [];
    } catch {
      return [];
    }
  },

  addToFavorites(book) {
    const favorites = this.getFavorites();
    if (!favorites.some(f => f.id === book.id)) {
      favorites.push(book);
      localStorage.setItem('bookLibraryFavorites', JSON.stringify(favorites));
      return true;
    }
    return false;
  },

  removeFromFavorites(bookId) {
    const favorites = this.getFavorites().filter(f => f.id !== bookId);
    localStorage.setItem('bookLibraryFavorites', JSON.stringify(favorites));
    return true;
  },

  isFavorite(bookId) {
    return this.getFavorites().some(f => f.id === bookId);
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = API;
}


// -----------------------------------------
// -----------------------------------------
// -----------------------------------------
// -----------------------------------------
// -----------------------------------------
// -----------------------------------------
// -----------------------------------------
// Make API available globally
if (typeof window !== 'undefined') {
  window.API = API;
}

console.log('✅ API module loaded successfully');