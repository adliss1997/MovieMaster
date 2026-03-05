// Wait for page to load
// Wait for page to load - MERGED VERSION
document.addEventListener('DOMContentLoaded', () => {
    fetchPopularMovies();
    
    const searchInput = document.getElementById('searchInput');
    
    // Search functionality
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (e.target.value.trim()) {
                    searchMovies(e.target.value);
                } else {
                    fetchPopularMovies();
                    document.querySelector('.movies-section h2').textContent = 'Popular Movies';
                }
            }, 500);
        });
    }
    
    // Home button
    const homeBtn = document.getElementById('homeBtn');
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            fetchPopularMovies();
            document.querySelector('.movies-section h2').textContent = 'Popular Movies';
            if (searchInput) searchInput.value = '';
            
            const detailsContainer = document.querySelector('.movie-details-container');
            if (detailsContainer && detailsContainer.style.display === 'block') {
                detailsContainer.style.display = 'none';
                document.querySelector('.movies-section').style.display = 'block';
                document.querySelector('.search-section').style.display = 'block';
            }
        });
    }
    
    // Liked button ← MOVED FROM BOTTOM BLOCK
    const likedBtn = document.getElementById('likedBtn');
    if (likedBtn) {
        likedBtn.addEventListener('click', () => {
            showLikedMovies();
            if (searchInput) searchInput.value = '';
        });
    }
    
    // Initialize sidebar & filters
    initSidebar();
    initSidebarFilters(); // ✅ Already here
});

async function fetchPopularMovies() {
    const moviesGrid = document.querySelector('.movies-grid');
    
    // Show loading state
    moviesGrid.innerHTML = '<div class="loading">Loading movies...</div>';
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/popular?api_key=${TMDB_CONFIG.API_KEY}`
        );
        const data = await response.json();
        
        // Display the movies
        displayMovies(data.results);
        
    } catch (error) {
        console.error('Error fetching movies:', error);
        moviesGrid.innerHTML = '<div class="loading">Failed to load movies</div>';
    }
}

function displayMovies(movies) {
    const moviesGrid = document.querySelector('.movies-grid');
    
    // Clear loading
    moviesGrid.innerHTML = '';
    
    // Create HTML for each movie
    movies.forEach(movie => {
        const posterPath = movie.poster_path 
            ? `${TMDB_CONFIG.IMAGE_BASE_URL}${movie.poster_path}`
            : 'https://via.placeholder.com/300x450?text=No+Poster';
        
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '?';
        
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.movieId = movie.id;  // Store movie ID
        
        movieCard.innerHTML = `
            <div class="image-container">
                <img src="${posterPath}" 
                     alt="${movie.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                <button class="heart-btn">
                    <span class="material-icons">favorite_border</span>
                </button>
            </div>
            <div class="movie-info">
                <div class="movie-title">
                    <span class="title-text">${movie.title}</span>
                    <span class="rating-badge">${rating}</span>
                </div>
                <div class="movie-year">${year}</div>
            </div>
        `;
        
        // Add click event to the card (but not when clicking heart)
        movieCard.addEventListener('click', (e) => {
            // Don't open details if heart button was clicked
            if (!e.target.closest('.heart-btn')) {
                openMovieDetails(movie.id);
            }
        });
        
        moviesGrid.appendChild(movieCard);
    });
    
    // Setup heart button functionality after all cards are added
    setupHeartButtons();
}

// Handle heart button clicks
function setupHeartButtons() {
    document.querySelectorAll('.heart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();  // Prevent triggering movie card click
            
            // Toggle liked class
            btn.classList.toggle('liked');
            
            // Change icon color and style
            const icon = btn.querySelector('.material-icons');
            if (btn.classList.contains('liked')) {
                icon.textContent = 'favorite';  // Filled heart
                icon.style.color = '#ff4b4b';   // Red color
            } else {
                icon.textContent = 'favorite_border';  // Empty heart
                icon.style.color = 'white';            // White color
            }
            
            // Optional: Get movie info for debugging
            const movieCard = btn.closest('.movie-card');
            const movieTitle = movieCard.querySelector('.title-text').textContent;
            console.log(`${btn.classList.contains('liked') ? '❤️ Liked' : '🤍 Unliked'}: ${movieTitle}`);
        });
    });
}

// Search functionality
async function searchMovies(query) {
    if (!query.trim()) {
        fetchPopularMovies();
        // Reset title when search is cleared
        document.querySelector('.movies-section h2').textContent = 'Popular Movies';
        return;
    }
    
    const moviesGrid = document.querySelector('.movies-grid');
    moviesGrid.innerHTML = '<div class="loading">Searching movies...</div>';
    
    // Change title to "Results"
    document.querySelector('.movies-section h2').textContent = `Results for "${query}"`;
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/search/movie?api_key=${TMDB_CONFIG.API_KEY}&query=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        displayMovies(data.results);
    } catch (error) {
        console.error('Error searching movies:', error);
        moviesGrid.innerHTML = '<div class="loading">Search failed</div>';
    }
}

// Update home button functionality

// ========== MOVIE DETAILS FUNCTIONS ==========

// Open movie details page
// Open movie details page
function openMovieDetails(movieId) {
    // Hide main content sections, but NOT the action buttons
    document.querySelector('.movies-section').style.display = 'none';
    document.querySelector('.search-section').style.display = 'none';
    
    // The action-buttons-right should remain visible
    // No need to hide them
    
    // Create or show details container
    let detailsContainer = document.querySelector('.movie-details-container');
    if (!detailsContainer) {
        detailsContainer = document.createElement('div');
        detailsContainer.className = 'movie-details-container';
        document.querySelector('main').appendChild(detailsContainer);
    }
    
    detailsContainer.style.display = 'block';
    detailsContainer.innerHTML = '<div class="loading">Loading movie details...</div>';
    
    // Fetch movie details
    fetchMovieDetails(movieId);
}

// Fetch movie details from API
async function fetchMovieDetails(movieId) {
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?api_key=${TMDB_CONFIG.API_KEY}&append_to_response=credits,videos`
        );
        const movie = await response.json();
        
        displayMovieDetails(movie);
        
    } catch (error) {
        console.error('Error fetching movie details:', error);
        document.querySelector('.movie-details-container').innerHTML = 
            '<div class="loading">Failed to load movie details</div>';
    }
}

// Display movie details
// Display movie details
function displayMovieDetails(movie) {
    const detailsContainer = document.querySelector('.movie-details-container');
    const isLiked = likedMovies[movie.id] || false;
    
    // Get backdrop image (or poster if no backdrop)
    const backdropPath = movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : movie.poster_path 
            ? `${TMDB_CONFIG.IMAGE_BASE_URL}${movie.poster_path}`
            : '';
    
    const posterPath = movie.poster_path 
        ? `${TMDB_CONFIG.IMAGE_BASE_URL}${movie.poster_path}`
        : 'https://via.placeholder.com/300x450?text=No+Poster';
    
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    
    // Get genres
    const genres = movie.genres ? movie.genres.map(g => g.name).join(' • ') : 'N/A';
    
    // Get runtime in hours and minutes
    const runtime = movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A';
    
    // Get director
    const director = movie.credits?.crew?.find(person => person.job === 'Director')?.name || 'N/A';
    
    // Get top cast (first 5)
    const cast = movie.credits?.cast?.slice(0, 5).map(actor => actor.name).join(', ') || 'N/A';
    
    // Get trailer
    const trailer = movie.videos?.results?.find(video => video.type === 'Trailer' && video.site === 'YouTube');
    
    detailsContainer.innerHTML = `
        <button class="back-btn">
            <span class="material-icons">arrow_back</span> Back to movies
        </button>
        
        <div class="movie-hero" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(26,26,26,1)), url('${backdropPath}')">
            <div class="hero-content">
                <h1>${movie.title} <span class="year">(${year})</span></h1>
                <div class="movie-meta">
                    <span class="rating">⭐ ${rating}</span>
                    <span>${genres}</span>
                    <span><span style="color: #ff9b00; margin-right: 6px;">⏱</span>${runtime}</span>
                </div>
                <div class="action-buttons">
                    ${trailer ? `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="trailer-btn">▶ Watch Trailer</a>` : ''}
                    <button class="details-heart-btn ${isLiked ? 'liked' : ''}" data-movie-id="${movie.id}">
                        <span class="material-icons">${isLiked ? 'favorite' : 'favorite_border'}</span>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="movie-details-content">
            <div class="movie-poster-detail">
                <img src="${posterPath}" alt="${movie.title}">
            </div>
            
            <div class="movie-info-detail">
                <h2>Overview</h2>
                <p class="overview">${movie.overview || 'No overview available.'}</p>
                
                <div class="details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Director</span>
                        <span class="detail-value">${director}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Cast</span>
                        <span class="detail-value">${cast}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Release Date</span>
                        <span class="detail-value">${formatDate(movie.release_date)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status</span>
                        <span class="detail-value">${movie.status || 'N/A'}</span>
                    </div>
                    ${movie.budget ? `<div class="detail-item">
                        <span class="detail-label">Budget</span>
                        <span class="detail-value">$${movie.budget.toLocaleString()}</span>
                    </div>` : ''}
                    ${movie.revenue ? `<div class="detail-item">
                        <span class="detail-label">Revenue</span>
                        <span class="detail-value">$${movie.revenue.toLocaleString()}</span>
                    </div>` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add back button functionality
    // Add back button functionality
    document.querySelector('.back-btn').addEventListener('click', () => {
        detailsContainer.style.display = 'none';
        document.querySelector('.movies-section').style.display = 'block';
        document.querySelector('.search-section').style.display = 'block';
        // action-buttons-right is already visible
        
        // Refresh the current view to update heart states
        const currentTitle = document.querySelector('.movies-section h2').textContent;
        if (currentTitle === 'Your Liked Movies') {
            showLikedMovies();
        } else if (currentTitle.includes('Results for')) {
            const query = currentTitle.replace('Results for "', '').replace('"', '');
            searchMovies(query);
        } else {
            fetchPopularMovies();
        }
    });
    
    // Setup heart button for details page
    setupHeartButtons();
}
// ========== RESPONSIVE SIDEBAR TOGGLE ==========
function initSidebar() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const closeSidebar = document.getElementById('closeSidebar'); // ← ADD THIS
    
    if (menuToggle && sidebar && overlay) {
        // Open sidebar
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
            const icon = menuToggle.querySelector('.material-icons');
            icon.textContent = sidebar.classList.contains('active') ? 'close' : 'menu';
        });
        
        // Close with X button ← ADD THIS
        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                menuToggle.querySelector('.material-icons').textContent = 'menu';
            });
        }
        
        // Close on overlay click
        overlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            menuToggle.querySelector('.material-icons').textContent = 'menu';
        });
        
        // Close on resize to desktop
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                sidebar.classList.remove('active');
                overlay.classList.remove('active');
                menuToggle.querySelector('.material-icons').textContent = 'menu';
            }
        });
    }
}

// Global variables
let likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || {};

let activeFilters = {
    genres: [],
    yearFrom: '',
    yearTo: '',
    minRating: 0,
    sortBy: 'popularity.desc'
};

function initSidebarFilters() {
    // Genre checkboxes
    document.querySelectorAll('#genreFilters input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const genreId = e.target.value;
            if (e.target.checked) {
                activeFilters.genres.push(genreId);
            } else {
                activeFilters.genres = activeFilters.genres.filter(id => id !== genreId);
            }
        });
    });

    // Year filters
    const yearFromInput = document.getElementById('yearFrom');
    const yearToInput = document.getElementById('yearTo');
    
    yearFromInput?.addEventListener('input', (e) => {
        activeFilters.yearFrom = e.target.value;
    });
    
    yearToInput?.addEventListener('input', (e) => {
        activeFilters.yearTo = e.target.value;
    });

    // Rating slider
    const ratingSlider = document.getElementById('ratingFilter');
    const ratingValue = document.getElementById('ratingValue');
    
    ratingSlider?.addEventListener('input', (e) => {
        activeFilters.minRating = parseFloat(e.target.value);
        ratingValue.textContent = `${e.target.value}+`;
    });

    // Sort by
    const sortBySelect = document.getElementById('sortBy');
    sortBySelect?.addEventListener('change', (e) => {
        activeFilters.sortBy = e.target.value;
    });

    // Apply filters button
    const applyBtn = document.getElementById('applyFilters');
    applyBtn?.addEventListener('click', () => {
        applyFilters();
        // Close sidebar on mobile
        if (window.innerWidth <= 768) {
            document.querySelector('.sidebar').classList.remove('active');
            document.getElementById('sidebarOverlay').classList.remove('active');
        }
    });

    // Reset filters button
    const resetBtn = document.getElementById('resetFilters');
    resetBtn?.addEventListener('click', resetFilters);
}

// Apply filters
async function applyFilters() {
    const moviesGrid = document.querySelector('.movies-grid');
    moviesGrid.innerHTML = '<div class="loading">Applying filters...</div>';
    
    // Build query parameters
    let queryParams = `api_key=${TMDB_CONFIG.API_KEY}&sort_by=${activeFilters.sortBy}`;
    
    // Add genre filter
    if (activeFilters.genres.length > 0) {
        queryParams += `&with_genres=${activeFilters.genres.join(',')}`;
    }
    
    // Add year filter
    if (activeFilters.yearFrom) {
        queryParams += `&primary_release_year.gte=${activeFilters.yearFrom}`;
    }
    if (activeFilters.yearTo) {
        queryParams += `&primary_release_year.lte=${activeFilters.yearTo}`;
    }
    
    try {
        const response = await fetch(
            `${TMDB_CONFIG.BASE_URL}/discover/movie?${queryParams}`
        );
        const data = await response.json();
        
        // Filter by rating client-side (TMDB API doesn't support min vote_average in discover)
        let filteredMovies = data.results;
        if (activeFilters.minRating > 0) {
            filteredMovies = filteredMovies.filter(movie => 
                movie.vote_average >= activeFilters.minRating
            );
        }
        
        displayMovies(filteredMovies);
        document.querySelector('.movies-section h2').textContent = 'Filtered Movies';
        
    } catch (error) {
        console.error('Error applying filters:', error);
        moviesGrid.innerHTML = '<div class="loading">Failed to apply filters</div>';
    }
}

// Reset all filters
function resetFilters() {
    // Reset state
    activeFilters = {
        genres: [],
        yearFrom: '',
        yearTo: '',
        minRating: 0,
        sortBy: 'popularity.desc'
    };
    
    // Reset UI
    document.querySelectorAll('#genreFilters input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
    
    document.getElementById('yearFrom').value = '';
    document.getElementById('yearTo').value = '';
    document.getElementById('ratingFilter').value = 0;
    document.getElementById('ratingValue').textContent = '0+';
    document.getElementById('sortBy').value = 'popularity.desc';
    
    // Fetch popular movies
    fetchPopularMovies();
    document.querySelector('.movies-section h2').textContent = 'Popular Movies';
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
}
// Update setupHeartButtons function
// Update setupHeartButtons function
function setupHeartButtons() {
    document.querySelectorAll('.heart-btn, .details-heart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const movieCard = btn.closest('.movie-card');
            const movieId = btn.dataset.movieId || (movieCard ? movieCard.dataset.movieId : null);
            
            if (!movieId) return;
            
            // Toggle liked class
            btn.classList.toggle('liked');
            
            // Change icon
            const icon = btn.querySelector('.material-icons');
            if (btn.classList.contains('liked')) {
                icon.textContent = 'favorite';
                icon.style.color = '#ff4b4b';
                likedMovies[movieId] = true;
            } else {
                icon.textContent = 'favorite_border';
                icon.style.color = 'white';
                delete likedMovies[movieId];
            }
            
            // Save to localStorage
            localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
            
            // Update ALL hearts for this movie across the app
            updateAllHeartsForMovie(movieId, btn.classList.contains('liked'));
            
            // Get movie info for debugging
            const movieTitle = movieCard ? movieCard.querySelector('.title-text').textContent : 'Movie';
            console.log(`${btn.classList.contains('liked') ? '❤️ Liked' : '🤍 Unliked'}: ${movieTitle}`);
        });
    });
}

// New function to update all hearts for a specific movie
function updateAllHeartsForMovie(movieId, isLiked) {
    // Update all heart buttons on movie cards
    document.querySelectorAll(`.heart-btn[data-movie-id="${movieId}"]`).forEach(btn => {
        const icon = btn.querySelector('.material-icons');
        if (isLiked) {
            btn.classList.add('liked');
            icon.textContent = 'favorite';
            icon.style.color = '#ff4b4b';
        } else {
            btn.classList.remove('liked');
            icon.textContent = 'favorite_border';
            icon.style.color = 'white';
        }
    });
    
    // Update details page heart if it exists
    document.querySelectorAll(`.details-heart-btn[data-movie-id="${movieId}"]`).forEach(btn => {
        const icon = btn.querySelector('.material-icons');
        if (isLiked) {
            btn.classList.add('liked');
            icon.textContent = 'favorite';
            icon.style.color = '#ff4b4b';
        } else {
            btn.classList.remove('liked');
            icon.textContent = 'favorite_border';
            icon.style.color = 'white';
        }
    });
}

// Update displayMovies to check liked status
function displayMovies(movies) {
    const moviesGrid = document.querySelector('.movies-grid');
    moviesGrid.innerHTML = '';
    
    movies.forEach(movie => {
        const posterPath = movie.poster_path 
            ? `${TMDB_CONFIG.IMAGE_BASE_URL}${movie.poster_path}`
            : 'https://via.placeholder.com/300x450?text=No+Poster';
        
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : '?';
        const isLiked = likedMovies[movie.id] || false;
        
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';
        movieCard.dataset.movieId = movie.id;
        
        movieCard.innerHTML = `
            <div class="image-container">
                <img src="${posterPath}" 
                     alt="${movie.title}"
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'">
                <button class="heart-btn ${isLiked ? 'liked' : ''}" data-movie-id="${movie.id}">
                    <span class="material-icons">${isLiked ? 'favorite' : 'favorite_border'}</span>
                </button>
            </div>
            <div class="movie-info">
                <div class="movie-title">
                    <span class="title-text">${movie.title}</span>
                    <span class="rating-badge">${rating}</span>
                </div>
                <div class="movie-year">${year}</div>
            </div>
        `;
        
        movieCard.addEventListener('click', (e) => {
            if (!e.target.closest('.heart-btn')) {
                openMovieDetails(movie.id);
            }
        });
        
        moviesGrid.appendChild(movieCard);
    });
    
    setupHeartButtons();
}

// Add function to show liked movies
function showLikedMovies() {
    // Hide main content
    document.querySelector('.movies-section').style.display = 'block';
    document.querySelector('.search-section').style.display = 'block';
    
    // Hide details if open
    const detailsContainer = document.querySelector('.movie-details-container');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
    
    // Get liked movie IDs
    const likedIds = Object.keys(likedMovies);
    
    if (likedIds.length === 0) {
        document.querySelector('.movies-grid').innerHTML = '<div class="loading">No liked movies yet ❤️</div>';
        document.querySelector('.movies-section h2').textContent = 'Your Liked Movies';
        return;
    }
    
    // Show loading
    document.querySelector('.movies-grid').innerHTML = '<div class="loading">Loading your liked movies...</div>';
    document.querySelector('.movies-section h2').textContent = 'Your Liked Movies';
    
    // Fetch each liked movie
    Promise.all(likedIds.map(id => 
        fetch(`${TMDB_CONFIG.BASE_URL}/movie/${id}?api_key=${TMDB_CONFIG.API_KEY}`)
            .then(res => res.json())
    )).then(movies => {
        displayMovies(movies);
    }).catch(error => {
        console.error('Error fetching liked movies:', error);
        document.querySelector('.movies-grid').innerHTML = '<div class="loading">Failed to load liked movies</div>';
    });
}

