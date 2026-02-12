# Static Site for Cloudify

A clean, minimal static HTML/CSS site ready to deploy on Cloudify with zero configuration.

## Deploy on Cloudify

1. Push this project to a GitHub repository
2. Go to your Cloudify dashboard
3. Click "Import Project" and select your repository
4. Set framework to "Other" or "Static"
5. Leave build command empty
6. Set output directory to `./`
7. Click "Deploy"

### Build Settings

| Setting | Value |
|---------|-------|
| Framework | Static / HTML |
| Build Command | *(none)* |
| Output Directory | `./` |
| Install Command | *(none)* |

## Project Structure

```
static-site/
  index.html    -- Main page
  styles.css    -- Styling
  README.md
```

## Customization

Edit `index.html` and `styles.css` directly. No build tools, no dependencies, no complexity.
