/**
 * GitHub API module for Project Hub
 * Handles fetching repos and merging with config
 */

const GitHubAPI = (function() {
    const API_BASE = 'https://api.github.com';

    /**
     * Fetches all public repos for a user
     * @param {string} username - GitHub username
     * @returns {Promise<Object[]>} Array of repository objects
     */
    async function fetchUserRepos(username) {
        const url = `${API_BASE}/users/${username}/repos?per_page=100&sort=updated`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Fetches user profile information
     * @param {string} username - GitHub username
     * @returns {Promise<Object>} User profile object
     */
    async function fetchUserProfile(username) {
        const url = `${API_BASE}/users/${username}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Filters repos that have GitHub Pages enabled
     * @param {Object[]} repos - Array of GitHub repo objects
     * @returns {Object[]} Repos with GitHub Pages
     */
    function filterPagesEnabled(repos) {
        return repos.filter(repo => repo.has_pages);
    }

    /**
     * Transforms a GitHub repo into our project format
     * @param {Object} repo - GitHub repository object
     * @param {string} username - GitHub username
     * @returns {Object} Project object
     */
    function transformRepo(repo, username) {
        return {
            name: repo.name,
            description: repo.description || '',
            url: `https://${username}.github.io/${repo.name}/`,
            repoUrl: repo.html_url,
            thumbnail: null,
            isAutoDiscovered: true
        };
    }

    /**
     * Merges auto-discovered repos with config overrides
     * @param {Object[]} repos - Auto-discovered repos
     * @param {Object} config - Configuration module reference
     * @returns {Object[]} Merged and ordered projects array
     */
    function mergeWithConfig(repos, username) {
        const excluded = Config.getExcluded();
        const order = Config.getOrder();
        const reposWithCustomUrls = Config.getReposWithCustomUrls();
        
        // Filter out excluded repos and repos with custom URLs (they'll be added as manual projects)
        let projects = repos
            .filter(repo => !excluded.includes(repo.name) && !reposWithCustomUrls.includes(repo.name))
            .map(repo => {
                const project = transformRepo(repo, username);
                const override = Config.getProjectOverride(repo.name);
                
                if (override) {
                    // Apply overrides
                    return {
                        ...project,
                        name: override.name || project.name,
                        description: override.description || project.description,
                        url: override.url || project.url,
                        thumbnail: override.thumbnail || project.thumbnail
                    };
                }
                
                return project;
            });

        // Add manual projects (external, non-GitHub-Pages, or repos with custom URLs)
        const manualProjects = Config.getManualProjects().map(p => ({
            name: p.name || p.repo,
            description: p.description || '',
            url: p.url,
            repoUrl: p.repoUrl !== undefined ? p.repoUrl : (p.repo ? `https://github.com/${username}/${p.repo}` : null),
            thumbnail: p.thumbnail,
            isAutoDiscovered: false
        }));

        projects = [...projects, ...manualProjects];

        // Apply custom ordering
        if (order.length > 0) {
            projects.sort((a, b) => {
                const aIndex = order.indexOf(a.name);
                const bIndex = order.indexOf(b.name);
                
                // If both are in order array, sort by their position
                if (aIndex !== -1 && bIndex !== -1) {
                    return aIndex - bIndex;
                }
                // If only a is in order array, it comes first
                if (aIndex !== -1) return -1;
                // If only b is in order array, it comes first
                if (bIndex !== -1) return 1;
                // Otherwise, sort alphabetically
                return a.name.localeCompare(b.name);
            });
        } else {
            // Default alphabetical sort
            projects.sort((a, b) => a.name.localeCompare(b.name));
        }

        return projects;
    }

    /**
     * Main function to fetch and process all projects
     * @returns {Promise<{projects: Object[], profile: Object}>} Projects and profile data
     */
    async function getProjects() {
        const username = Config.getUsername();
        
        // Fetch repos and profile in parallel
        const [repos, profile] = await Promise.all([
            fetchUserRepos(username),
            fetchUserProfile(username)
        ]);

        // Filter for GitHub Pages repos
        const pagesRepos = filterPagesEnabled(repos);

        // Merge with config
        const projects = mergeWithConfig(pagesRepos, username);

        return {
            projects,
            profile: {
                username: profile.login,
                avatarUrl: profile.avatar_url,
                profileUrl: profile.html_url
            }
        };
    }

    /**
     * Fallback function when API fails - returns only manual projects
     * @returns {Promise<{projects: Object[], profile: Object}>} Manual projects only
     */
    async function getManualProjectsOnly() {
        const username = Config.getUsername();
        
        const manualProjects = Config.getProjects().map(p => ({
            name: p.name || p.repo || 'Untitled',
            description: p.description || '',
            url: p.url || (p.repo ? `https://${username}.github.io/${p.repo}/` : '#'),
            repoUrl: p.repoUrl !== null ? p.repoUrl : (p.repo ? `https://github.com/${username}/${p.repo}` : null),
            thumbnail: p.thumbnail,
            isAutoDiscovered: false
        }));

        // Sort by order config, then alphabetically
        const order = Config.getOrder();
        manualProjects.sort((a, b) => {
            const aIndex = order.indexOf(a.name);
            const bIndex = order.indexOf(b.name);
            
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.name.localeCompare(b.name);
        });

        return {
            projects: manualProjects,
            profile: {
                username: username,
                avatarUrl: `https://github.com/${username}.png`,
                profileUrl: `https://github.com/${username}`
            }
        };
    }

    return {
        getProjects,
        getManualProjectsOnly,
        fetchUserProfile
    };
})();
