# Project Hub

A centralized GitHub Pages hub that displays links to all your deployed projects.

## Features

- **Auto-discovery**: Automatically finds repos with GitHub Pages enabled
- **Manual additions**: Add any project via `projects.yaml`
- **Search**: Live filtering by project name or description
- **Dark/Light mode**: Toggle with system preference detection
- **Responsive**: Desktop-first with mobile support
- **Clean & minimal**: Simple design with subtle interactions

## Quick Start

1. Clone this repository
2. Edit `projects.yaml` with your GitHub username
3. Push to GitHub and enable GitHub Pages
4. Visit `https://[username].github.io/project-aggregator/`

## Configuration

Edit `projects.yaml` to customize:

```yaml
# Your GitHub username
username: darrenmcewan

# Repos to hide from auto-discovery
exclude:
  - private-repo

# Custom display order (first in list = first displayed)
order:
  - favorite-project

# Override or add projects
projects:
  - repo: my-app
    name: "Custom Name"
    description: "Custom description"
    thumbnail: "images/my-app.png"
    
  - name: "External Project"
    url: "https://example.com"
    description: "A project hosted elsewhere"
```

## Adding Thumbnails

1. Add images to the `images/` folder
2. Reference them in `projects.yaml`:
   ```yaml
   - repo: my-project
     thumbnail: "images/my-project.png"
   ```

Recommended size: 560x320 pixels (or 16:9 ratio)

## File Structure

```
project-aggregator/
├── index.html          # Main page
├── css/
│   └── styles.css      # All styles
├── js/
│   ├── app.js          # Main application
│   ├── api.js          # GitHub API calls
│   └── config.js       # Configuration loader
├── images/             # Thumbnail images
├── projects.yaml       # Configuration file
└── README.md
```

## License

MIT