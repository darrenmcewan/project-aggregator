/**
 * Configuration loader for Project Hub
 * Fetches and parses projects.yaml
 */

const Config = (function() {
    let config = null;

    /**
     * Fetches and parses the projects.yaml configuration file
     * @returns {Promise<Object>} Parsed configuration object
     */
    async function load() {
        if (config) {
            return config;
        }

        try {
            const response = await fetch('projects.yaml');
            
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status}`);
            }

            const yamlText = await response.text();
            config = jsyaml.load(yamlText) || {};

            // Normalize config with defaults
            config = {
                username: config.username || '',
                exclude: config.exclude || [],
                order: config.order || [],
                projects: (config.projects || []).map(normalizeProject)
            };

            return config;
        } catch (error) {
            console.warn('Could not load projects.yaml, using defaults:', error.message);
            config = {
                username: 'darrenmcewan',
                exclude: [],
                order: [],
                projects: []
            };
            return config;
        }
    }

    /**
     * Normalizes a project entry to ensure consistent structure
     * @param {Object} project - Raw project from YAML
     * @returns {Object} Normalized project object
     */
    function normalizeProject(project) {
        return {
            repo: project.repo || null,
            name: project.name || project.repo || 'Untitled',
            description: project.description || null,
            url: project.url || null,
            repoUrl: project.repoUrl !== undefined ? project.repoUrl : null,
            thumbnail: project.thumbnail || null,
            order: project.order || null
        };
    }

    /**
     * Gets the GitHub username from config
     * @returns {string} GitHub username
     */
    function getUsername() {
        return config?.username || 'darrenmcewan';
    }

    /**
     * Gets the list of repos to exclude
     * @returns {string[]} Array of repo names to exclude
     */
    function getExcluded() {
        return config?.exclude || [];
    }

    /**
     * Gets the custom order array
     * @returns {string[]} Array of repo names in custom order
     */
    function getOrder() {
        return config?.order || [];
    }

    /**
     * Gets manual project entries
     * @returns {Object[]} Array of manual project configs
     */
    function getProjects() {
        return config?.projects || [];
    }

    /**
     * Finds a project override by repo name
     * @param {string} repoName - Repository name
     * @returns {Object|null} Project override if found
     */
    function getProjectOverride(repoName) {
        const projects = getProjects();
        return projects.find(p => p.repo === repoName) || null;
    }

    /**
     * Gets manually added projects that need explicit inclusion
     * (repos with custom URLs or external projects without a repo)
     * @returns {Object[]} Array of manual-only projects
     */
    function getManualProjects() {
        const projects = getProjects();
        // Include projects that have a custom URL (whether they have a repo name or not)
        return projects.filter(p => p.url);
    }

    /**
     * Gets repo names that have custom URLs (non-GitHub-Pages repos)
     * These should be excluded from auto-discovery merging
     * @returns {string[]} Array of repo names with custom URLs
     */
    function getReposWithCustomUrls() {
        const projects = getProjects();
        return projects.filter(p => p.url && p.repo).map(p => p.repo);
    }

    return {
        load,
        getUsername,
        getExcluded,
        getOrder,
        getProjects,
        getProjectOverride,
        getManualProjects,
        getReposWithCustomUrls
    };
})();
