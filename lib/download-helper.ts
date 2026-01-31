import JSZip from 'jszip'
import type { GeneratedProject } from './code-generator'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'

export function downloadAsZip(project: GeneratedProject) {
  // Fallback to text file if JSZip fails
  downloadAsTextFile(project)
}

export async function downloadAsProperZip(project: GeneratedProject) {
  try {
    const zip = new JSZip()

    // Fix index.html location if it's in public/ folder (Create React App structure)
    const files = { ...project.files }
    if (files['public/index.html'] && !files['index.html']) {
      console.warn('⚠️ Fixing index.html location: moving from public/ to root directory')
      files['index.html'] = files['public/index.html']
      delete files['public/index.html']
    }

    // Create index.html if missing (for Vite projects)
    if (!files['index.html']) {
      console.warn('⚠️ index.html is missing, creating default one')

      // Detect entry file by checking actual file structure
      let entryFile = '/src/index.jsx'
      if (files['src/main.jsx']) {
        entryFile = '/src/main.jsx'
      } else if (files['src/index.jsx']) {
        entryFile = '/src/index.jsx'
      } else if (files['src/main.js']) {
        entryFile = '/src/main.js'
      } else if (files['src/index.js']) {
        entryFile = '/src/index.js'
      } else if (files['src/main.tsx']) {
        entryFile = '/src/main.tsx'
      } else if (files['src/index.tsx']) {
        entryFile = '/src/index.tsx'
      }

      files['index.html'] = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React App" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <script type="module" src="${entryFile}"></script>
  </body>
</html>`
      console.log(`✅ Auto-created index.html with entry file: ${entryFile}`)
    }

    // Create entry file if missing (for Vite projects)
    const hasEntryFile = files['src/main.jsx'] || files['src/index.jsx'] ||
                         files['src/main.js'] || files['src/index.js'] ||
                         files['src/main.tsx'] || files['src/index.tsx']

    if (!hasEntryFile) {
      console.warn('⚠️ Entry file is missing, creating default src/index.jsx')

      // Detect App component location
      let appImport = './App.jsx'
      if (files['src/App.jsx']) {
        appImport = './App.jsx'
      } else if (files['src/App.tsx']) {
        appImport = './App.tsx'
      } else if (files['src/App.js']) {
        appImport = './App.js'
      } else if (files['src/components/App.jsx']) {
        appImport = './components/App.jsx'
      } else if (files['src/components/App.tsx']) {
        appImport = './components/App.tsx'
      }

      files['src/index.jsx'] = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '${appImport}';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
      console.log(`✅ Auto-created src/index.jsx with App import: ${appImport}`)
    }

    // Create directory structure and add files
    Object.entries(files).forEach(([filePath, content]) => {
      zip.file(filePath, content)
    })

    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({ type: 'blob' })

    // Check if running in Capacitor (mobile app)
    if (Capacitor.isNativePlatform()) {
      // Mobile app - use Capacitor Filesystem
      await downloadMobile(zipBlob, `${project.projectName}.zip`)
    } else {
      // Web - use standard download
      await downloadWeb(zipBlob, `${project.projectName}.zip`)
    }

    console.log(`Downloaded ${project.projectName}.zip with ${Object.keys(project.files).length} files`)
  } catch (error) {
    console.error('Error creating ZIP:', error)
    // Fallback to text file
    downloadAsTextFile(project)
  }
}

// Web download (standard browser)
async function downloadWeb(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Mobile download (Capacitor)
async function downloadMobile(blob: Blob, filename: string) {
  try {
    // Convert blob to base64
    const base64Data = await blobToBase64(blob)

    // Write file to device storage
    const result = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Documents, // Save to Documents folder
      recursive: true
    })

    console.log('File saved to:', result.uri)

    // Show success message
    alert(`文件已保存到:\n${result.uri}\n\n请在文件管理器的"文档"文件夹中查看`)

    return result
  } catch (error: any) {
    console.error('Mobile download error:', error)
    throw new Error(`下载失败: ${error.message}`)
  }
}

// Convert blob to base64
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1] // Remove data URL prefix
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function downloadAsTextFile(project: GeneratedProject) {
  // Create a simple text representation for download
  const filesContent = Object.entries(project.files)
    .map(([path, content]) => {
      const separator = '='.repeat(60)
      return `${separator}\nFile: ${path}\n${separator}\n\n${content}\n\n`
    })
    .join('\n')

  const fullContent = `PROJECT: ${project.projectName}
Generated by mornFront - mornhub.dev

INSTALLATION INSTRUCTIONS:
1. Create a new directory: mkdir ${project.projectName}
2. Navigate to it: cd ${project.projectName}
3. Create each file below with its content
4. Run: npm install
5. Run: npm run dev

${'='.repeat(80)}

${filesContent}
${'='.repeat(80)}

To use this properly:
- Copy each file section above into the respective file path
- Make sure directory structures are created (e.g., src/)
- Run npm install to install all dependencies
- Run npm run dev to start the development server

Thank you for using mornFront!
Visit: https://mornhub.dev
`

  // Create blob
  const blob = new Blob([fullContent], { type: 'text/plain' })

  // Check if running in Capacitor (mobile app)
  if (Capacitor.isNativePlatform()) {
    // Mobile app - use Capacitor Filesystem
    await downloadMobile(blob, `${project.projectName}.txt`)
  } else {
    // Web - use standard download
    await downloadWeb(blob, `${project.projectName}.txt`)
  }
}

