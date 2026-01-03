# mornFront Usage Guide

## Quick Start - Generate Your First App

### Step 1: Access the Generator
Open your browser and navigate to:
```
http://localhost:3009/generate
```

### Step 2: Enter Your Idea

Choose from these example prompts or create your own:

#### 🎯 Dashboard Examples
```
A modern analytics dashboard with metrics
Dashboard for project management with tasks
Sales dashboard with revenue charts
```

#### 🚀 Landing Page Examples
```
A modern landing page for a SaaS product
Marketing homepage with hero and features
Landing page for a mobile app
```

#### 📝 Form Examples
```
User signup form with email validation
Contact form with name, email, and message
Multi-step registration form
```

#### 💰 Pricing Examples
```
Pricing page with 3 tiers and dark theme
SaaS pricing with monthly and annual options
Simple pricing table with comparison
```

#### 📰 Blog Examples
```
Blog homepage with article cards
News website with latest articles
Portfolio blog with project showcases
```

#### 🎮 Game Examples
```
Game page with target practice
Interactive puzzle game
Simple arcade game
Click-based reaction game
```

### Step 3: Generate

1. Click the **"Generate UI Code"** button
2. Wait 2-3 seconds for generation to complete
3. View the generated files in the file browser

### Step 4: Explore the Code

- **File Browser**: Left sidebar shows all generated files
- **Code View**: Click any file to view its contents
- **File Count**: Badge shows total number of files generated

### Step 5: Download

Click the **"Download All Files"** button to get a `.txt` file containing:
- Complete project structure
- All file contents
- Installation instructions
- Setup guide

### Step 6: Run Locally

#### Extract Files

Open the downloaded `.txt` file and create each file manually, or use this helper:

```bash
# Create project directory
mkdir my-app
cd my-app

# Create directory structure
mkdir -p src

# Copy each file content from the downloaded file
# Look for lines like:
# File: package.json
# File: src/App.tsx
# etc.
```

#### Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Your app will be available at `http://localhost:3000`

## Generated Project Structure

Every generated project includes:

```
your-project/
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── index.html            # HTML entry point
├── tailwind.config.js    # Tailwind CSS config
├── postcss.config.js     # PostCSS config
├── .gitignore           # Git ignore rules
├── README.md            # Project documentation
└── src/
    ├── main.tsx         # App entry point
    ├── App.tsx          # Main component
    └── index.css        # Global styles
```

## Template Detection

mornFront automatically detects the type of app you want:

| Keywords | Template | Features |
|----------|----------|----------|
| dashboard, analytics | Dashboard | Stats cards, charts, activity feed |
| landing, homepage, marketing | Landing Page | Hero, features, CTA, footer |
| form, signup, login | Form | Validation, error handling, icons |
| pricing | Pricing Page | Multi-tier cards, feature lists |
| blog, article | Blog | Article grid, metadata, images |
| game, gaming, play | Game | Interactive gameplay, scoring |
| (any other) | Generic App | Clean starting point |

## Tips for Better Results

### ✅ DO:
- Be specific: "Modern dashboard with sales metrics and dark theme"
- Include key features: "Landing page with pricing, testimonials, and FAQ"
- Mention styling: "Minimalist signup form with gradient background"

### ❌ DON'T:
- Be too vague: "Make an app"
- Request backend: "With database and authentication"
- Use unclear terms: "Something cool"

## Features Overview

### 🎨 Code Generation
- Instant React + TypeScript code
- Production-ready components
- Best practices included
- Modern styling with Tailwind

### 📦 Project Setup
- Complete package.json
- TypeScript configuration
- Build tools (Vite)
- Development scripts

### 🎯 Smart Templates
- Automatic type detection
- Context-aware generation
- Professional layouts
- Responsive design

### 💻 Developer Ready
- Clean code structure
- Comments where helpful
- ESLint compatible
- Git ready

## Example Workflow

### Creating a Dashboard

1. **Input**:
   ```
   Analytics dashboard for an e-commerce store with sales, users, and revenue metrics
   ```

2. **Generated Files**: 14 files including:
   - Complete React app structure
   - Dashboard with stat cards
   - Chart placeholders
   - Navigation header

3. **Customize**: Download and modify:
   - Update colors in `tailwind.config.js`
   - Add real data to `App.tsx`
   - Connect to your API

### Creating a Landing Page

1. **Input**:
   ```
   Modern landing page for a AI writing tool with hero section, features, and pricing
   ```

2. **Generated Files**: 13 files including:
   - Hero with gradient background
   - Features grid with icons
   - CTA sections
   - Responsive footer

3. **Customize**:
   - Replace placeholder text
   - Update brand colors
   - Add your logo

## Troubleshooting

### Generation Fails
- **Error**: "Failed to generate code"
- **Solution**: Refresh page and try again
- **Prevention**: Use clear, descriptive prompts

### Download Issues
- **Error**: Nothing downloads
- **Solution**: Check browser download permissions
- **Alternative**: Copy code directly from the viewer

### Running Generated Code
- **Error**: `npm install` fails
- **Solution**: Delete `node_modules` and try again
- **Check**: Node.js version (need 18+)

### Port Conflicts
- **Error**: Port 3000 in use
- **Solution**: Change port in `vite.config.ts`:
  ```ts
  server: {
    port: 3001  // Change to any available port
  }
  ```

## Advanced Usage

### Combining Templates

Generate multiple projects and combine features:

1. Generate dashboard template
2. Generate form template
3. Copy form component into dashboard
4. Integrate and style

### Extending Generated Code

#### Add New Dependencies
```bash
npm install react-router-dom
npm install @tanstack/react-query
```

#### Add New Pages
1. Create new file in `src/pages/`
2. Import in `App.tsx`
3. Add routing

#### Custom Styling
- Edit `tailwind.config.js` for theme
- Update `src/index.css` for globals
- Modify component styles in `App.tsx`

## Best Practices

### 1. Start Simple
Generate a basic version first, then enhance

### 2. Version Control
```bash
git init
git add .
git commit -m "Initial generated code"
```

### 3. Customize Gradually
Don't change everything at once

### 4. Test Locally First
Verify everything works before deploying

### 5. Keep Dependencies Updated
```bash
npm update
```

## Support

### Need Help?
- Check the main README.md
- Review generated README.md in each project
- Open an issue on the repository

### Feedback
We'd love to hear about:
- Templates you'd like to see
- Issues you encounter
- Features you need

## What's Next?

After generating and running your code:

1. **Customize**: Update colors, text, images
2. **Extend**: Add new features and pages
3. **Connect**: Integrate with your backend
4. **Deploy**: Push to Vercel, Netlify, or others
5. **Share**: Show us what you built!

---

**Happy Coding! 🚀**

Visit [mornhub.dev](https://mornhub.dev) for more information.

