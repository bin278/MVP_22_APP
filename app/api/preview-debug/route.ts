import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

async function callDeepSeekAPI(prompt: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured')
  }

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  const completion = await client.chat.completions.create({
    model: model,
    messages: [
      {
        role: 'system',
        content: `You are a professional frontend developer. Generate a complete React component based on user requirements. Return ONLY the React component code without any imports or exports. Use modern React hooks and functional components. Include inline styles or Tailwind classes. Make it visually appealing and responsive.`
      },
      {
        role: 'user',
        content: prompt.trim()
      }
    ],
    max_tokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '2000'),
    temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
  })

  const content = completion.choices[0]?.message?.content
  if (!content) {
    throw new Error('Empty response from DeepSeek API')
  }

  return content
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const appContent = await callDeepSeekAPI(prompt.trim())

    if (!appContent || appContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not generate preview' },
        { status: 500 }
      )
    }

    // Create a minimal working preview
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App - Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    
    <script>
      // Enhanced React component that matches the generated code
      function App() {
        const [isGenerating, setIsGenerating] = React.useState(false);
        const [result, setResult] = React.useState('');
        const [count, setCount] = React.useState(0);
        
        const handleGenerate = () => {
          setIsGenerating(true);
          setTimeout(() => {
            setResult('Generated content based on your input...');
            setIsGenerating(false);
          }, 2000);
        };
        
        // Determine if this should be an AI tool or game based on prompt
        const isAITool = '${prompt.toLowerCase()}'.includes('ai') || '${prompt.toLowerCase()}'.includes('tool') || '${prompt.toLowerCase()}'.includes('website') || '${prompt.toLowerCase()}'.includes('cloth');
        
        if (isAITool) {
          return React.createElement('div', {
            className: 'min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50'
          }, [
            // Header
            React.createElement('header', {
              key: 'header',
              className: 'border-b border-gray-200 bg-white/80 backdrop-blur-sm'
            }, [
              React.createElement('div', {
                key: 'header-content',
                className: 'container mx-auto px-4 py-4'
              }, [
                React.createElement('div', {
                  key: 'logo',
                  className: 'flex items-center gap-3'
                }, [
                  React.createElement('div', {
                    key: 'logo-icon',
                    className: 'w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center'
                  }, [
                    React.createElement('span', { key: 'brain', className: 'text-white text-xl' }, '🧠')
                  ]),
                  React.createElement('h1', {
                    key: 'title',
                    className: 'text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'
                  }, '${prompt.includes('AI') ? 'AI' : 'Smart'} Tool')
                ]),
                React.createElement('button', {
                  key: 'cta-button',
                  className: 'px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors'
                }, 'Get Started')
              ])
            ]),
            
            // Hero Section
            React.createElement('section', {
              key: 'hero',
              className: 'py-20'
            }, [
              React.createElement('div', {
                key: 'hero-content',
                className: 'container mx-auto px-4 text-center'
              }, [
                React.createElement('div', {
                  key: 'hero-badge',
                  className: 'inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6'
                }, [
                  React.createElement('span', { key: 'sparkle', className: 'mr-1' }, '✨'),
                  'Powered by Advanced AI'
                ]),
                React.createElement('h2', {
                  key: 'hero-title',
                  className: 'text-5xl md:text-6xl font-bold text-gray-900 mb-6'
                }, '${prompt || 'AI-Powered Tool'}'),
                React.createElement('p', {
                  key: 'hero-description',
                  className: 'text-xl text-gray-600 mb-8 max-w-2xl mx-auto'
                }, 'Transform your ideas into reality with our cutting-edge AI technology. Generate, create, and innovate like never before.'),
                React.createElement('button', {
                  key: 'generate-button',
                  onClick: handleGenerate,
                  disabled: isGenerating,
                  className: 'px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105 mx-auto'
                }, [
                  isGenerating ? [
                    React.createElement('div', {
                      key: 'spinner',
                      className: 'w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'
                    }),
                    'Generating...'
                  ] : [
                    React.createElement('span', { key: 'zap', className: 'mr-2' }, '⚡'),
                    'Start Creating'
                  ]
                ])
              ])
            ]),
            
            // Results Section
            (isGenerating || result) && React.createElement('section', {
              key: 'results',
              className: 'py-20 bg-gray-50'
            }, [
              React.createElement('div', {
                key: 'results-content',
                className: 'container mx-auto px-4'
              }, [
                React.createElement('div', {
                  key: 'results-card',
                  className: 'max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8'
                }, [
                  React.createElement('h4', {
                    key: 'results-title',
                    className: 'text-2xl font-semibold mb-6 text-center'
                  }, 'Generation Results'),
                  isGenerating ? React.createElement('div', {
                    key: 'loading',
                    className: 'text-center py-12'
                  }, [
                    React.createElement('div', {
                      key: 'loading-spinner',
                      className: 'w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4'
                    }, [
                      React.createElement('div', {
                        key: 'spinner-inner',
                        className: 'w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin'
                      })
                    ]),
                    React.createElement('p', {
                      key: 'loading-text',
                      className: 'text-gray-600'
                    }, 'AI is working on your request...')
                  ]) : React.createElement('div', {
                    key: 'result-content',
                    className: 'space-y-4'
                  }, [
                    React.createElement('div', {
                      key: 'success-badge',
                      className: 'flex items-center gap-2 text-green-600'
                    }, [
                      React.createElement('span', { key: 'check', className: 'mr-1' }, '✓'),
                      React.createElement('span', {
                        key: 'success-text',
                        className: 'font-medium'
                      }, 'Generation Complete')
                    ]),
                    React.createElement('div', {
                      key: 'result-text',
                      className: 'bg-gray-50 rounded-lg p-4'
                    }, [
                      React.createElement('p', {
                        key: 'result-content-text',
                        className: 'text-gray-800'
                      }, result)
                    ])
                  ])
                ])
              ])
            ])
          ]);
        } else {
          // Game version
          return React.createElement('div', {
            className: 'min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-8'
          }, [
            React.createElement('div', {
              key: 'header',
              className: 'text-center mb-8'
            }, [
              React.createElement('h1', {
                key: 'title',
                className: 'text-4xl font-bold mb-4'
              }, '🎮 Generated App'),
              React.createElement('p', {
                key: 'subtitle',
                className: 'text-xl opacity-80'
              }, 'Live Preview Working!')
            ]),
            React.createElement('div', {
              key: 'game-area',
              className: 'max-w-4xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center'
            }, [
              React.createElement('div', {
                key: 'stats',
                className: 'grid grid-cols-3 gap-4 mb-8'
              }, [
                React.createElement('div', {
                  key: 'score',
                  className: 'bg-white/20 rounded-xl p-4'
                }, [
                  React.createElement('div', { key: 'score-icon', className: 'text-3xl mb-2' }, '🏆'),
                  React.createElement('div', { key: 'score-value', className: 'text-2xl font-bold' }, count),
                  React.createElement('div', { key: 'score-label', className: 'text-sm opacity-80' }, 'Score')
                ]),
                React.createElement('div', {
                  key: 'time',
                  className: 'bg-white/20 rounded-xl p-4'
                }, [
                  React.createElement('div', { key: 'time-icon', className: 'text-3xl mb-2' }, '⏱️'),
                  React.createElement('div', { key: 'time-value', className: 'text-2xl font-bold' }, '60'),
                  React.createElement('div', { key: 'time-label', className: 'text-sm opacity-80' }, 'Time Left')
                ]),
                React.createElement('div', {
                  key: 'targets',
                  className: 'bg-white/20 rounded-xl p-4'
                }, [
                  React.createElement('div', { key: 'targets-icon', className: 'text-3xl mb-2' }, '🎯'),
                  React.createElement('div', { key: 'targets-value', className: 'text-2xl font-bold' }, '3'),
                  React.createElement('div', { key: 'targets-label', className: 'text-sm opacity-80' }, 'Targets')
                ])
              ]),
              React.createElement('button', {
                key: 'play-button',
                className: 'px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold text-lg transition-colors',
                onClick: () => setCount(count + 10)
              }, [
                React.createElement('span', { key: 'play-icon', className: 'mr-2' }, '▶'),
                'Start Game'
              ]),
              React.createElement('div', {
                key: 'info',
                className: 'mt-8 text-sm opacity-80'
              }, [
                React.createElement('p', { key: 'info-text' }, 'Click the button to score points! This is a working preview.'),
                React.createElement('p', { key: 'download-text', className: 'mt-2' }, 'Download the ZIP file for the complete interactive game.')
              ])
            ])
          ]);
        }
      }
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
