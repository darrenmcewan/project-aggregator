/**
 * Main application logic for Project Hub
 * Handles rendering, search, theme toggle, and interactions
 */

const App = (function() {
    // DOM Elements
    let elements = {};
    
    // State
    let allProjects = [];

    /**
     * Initialize DOM element references
     */
    function initElements() {
        elements = {
            themeToggle: document.getElementById('theme-toggle'),
            profilePic: document.getElementById('profile-pic'),
            username: document.getElementById('username'),
            githubLink: document.getElementById('github-link'),
            searchInput: document.getElementById('search-input'),
            loading: document.getElementById('loading'),
            projectGrid: document.getElementById('project-grid'),
            noResults: document.getElementById('no-results'),
            backToTop: document.getElementById('back-to-top')
        };
    }

    /**
     * Initialize theme based on system preference
     */
    function initTheme() {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }

    /**
     * Toggle between light and dark theme
     */
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
    }

    /**
     * Show loading spinner
     */
    function showLoading() {
        elements.loading.classList.remove('hidden');
        elements.projectGrid.classList.add('hidden');
    }

    /**
     * Hide loading spinner
     */
    function hideLoading() {
        elements.loading.classList.add('hidden');
        elements.projectGrid.classList.remove('hidden');
    }

    /**
     * Update header with user profile information
     * @param {Object} profile - User profile data
     */
    function updateHeader(profile) {
        elements.profilePic.src = profile.avatarUrl;
        elements.profilePic.alt = `${profile.username}'s profile picture`;
        elements.username.textContent = profile.username;
        elements.githubLink.href = profile.profileUrl;
    }

    /**
     * Create the generic placeholder SVG icon
     * @returns {string} SVG markup
     */
    function getPlaceholderIcon() {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
        `;
    }

    /**
     * Create GitHub icon SVG
     * @returns {string} SVG markup
     */
    function getGitHubIcon() {
        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
        `;
    }

    /**
     * Create a project tile element
     * @param {Object} project - Project data
     * @returns {HTMLElement} Tile element
     */
    function createTile(project) {
        const tile = document.createElement('a');
        tile.className = 'project-tile';
        tile.href = project.url || '#';
        tile.target = '_blank';
        tile.rel = 'noopener noreferrer';
        tile.dataset.name = project.name.toLowerCase();
        tile.dataset.description = (project.description || '').toLowerCase();

        // Thumbnail or placeholder
        let thumbnailHtml;
        if (project.thumbnail) {
            thumbnailHtml = `<img class="tile-thumbnail" src="${project.thumbnail}" alt="${project.name} thumbnail" loading="lazy">`;
        } else {
            thumbnailHtml = `<div class="tile-placeholder">${getPlaceholderIcon()}</div>`;
        }

        // GitHub repo link (if available)
        let repoLinkHtml = '';
        if (project.repoUrl) {
            repoLinkHtml = `
                <a href="${project.repoUrl}" 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   class="tile-repo-link"
                   aria-label="View source on GitHub"
                   onclick="event.stopPropagation();">
                    ${getGitHubIcon()}
                </a>
            `;
        }

        tile.innerHTML = `
            ${thumbnailHtml}
            <div class="tile-content">
                <div class="tile-header">
                    <h3 class="tile-name">${escapeHtml(project.name)}</h3>
                    ${repoLinkHtml}
                </div>
                <p class="tile-description">${escapeHtml(project.description || 'No description available')}</p>
            </div>
        `;

        return tile;
    }

    /**
     * Escape HTML entities to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render all project tiles
     * @param {Object[]} projects - Array of project objects
     */
    function renderProjects(projects) {
        elements.projectGrid.innerHTML = '';
        
        projects.forEach(project => {
            const tile = createTile(project);
            elements.projectGrid.appendChild(tile);
        });

        updateNoResultsVisibility(projects.length);
    }

    /**
     * Filter projects based on search query
     * @param {string} query - Search query
     */
    function filterProjects(query) {
        const normalizedQuery = query.toLowerCase().trim();
        const tiles = elements.projectGrid.querySelectorAll('.project-tile');
        let visibleCount = 0;

        tiles.forEach(tile => {
            const name = tile.dataset.name;
            const description = tile.dataset.description;
            const matches = name.includes(normalizedQuery) || description.includes(normalizedQuery);
            
            tile.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });

        updateNoResultsVisibility(visibleCount);
    }

    /**
     * Show/hide no results message
     * @param {number} visibleCount - Number of visible projects
     */
    function updateNoResultsVisibility(visibleCount) {
        if (visibleCount === 0) {
            elements.noResults.classList.add('visible');
        } else {
            elements.noResults.classList.remove('visible');
        }
    }

    /**
     * Handle scroll events for back-to-top button
     */
    function handleScroll() {
        const scrollY = window.scrollY;
        const showThreshold = 300;

        if (scrollY > showThreshold) {
            elements.backToTop.classList.add('visible');
        } else {
            elements.backToTop.classList.remove('visible');
        }
    }

    /**
     * Scroll to top of page
     */
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    /**
     * Set up event listeners
     */
    function initEventListeners() {
        // Theme toggle
        elements.themeToggle.addEventListener('click', toggleTheme);

        // Search input - live filtering
        elements.searchInput.addEventListener('input', (e) => {
            filterProjects(e.target.value);
        });

        // Back to top button
        elements.backToTop.addEventListener('click', scrollToTop);

        // Scroll listener for back-to-top visibility
        window.addEventListener('scroll', handleScroll, { passive: true });
    }

    /**
     * Main initialization function
     */
    async function init() {
        initElements();
        initTheme();
        initEventListeners();
        showLoading();

        try {
            // Load configuration first
            await Config.load();

            // Fetch projects from GitHub API
            const { projects, profile } = await GitHubAPI.getProjects();
            
            allProjects = projects;
            updateHeader(profile);
            renderProjects(projects);
        } catch (error) {
            console.warn('Failed to fetch from GitHub API, falling back to manual projects:', error.message);
            
            try {
                // Fallback to manual projects only
                const { projects, profile } = await GitHubAPI.getManualProjectsOnly();
                
                allProjects = projects;
                updateHeader(profile);
                renderProjects(projects);
            } catch (fallbackError) {
                console.error('Failed to load any projects:', fallbackError);
                elements.projectGrid.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Unable to load projects</p>';
            }
        } finally {
            hideLoading();
        }
    }

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    return {
        init,
        filterProjects
    };
})();
