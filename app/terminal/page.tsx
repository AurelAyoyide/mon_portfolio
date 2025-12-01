'use client'

import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { ASCII_AVATAR, ASCII_COLORS } from '../ascii-avatar'
import './terminal.css'

type Theme = 'default' | 'dracula' | 'solarized' | 'nord'

interface OutputEntry {
  type: 'command' | 'output' | 'error' | 'info'
  content: string
}

interface TerminalInstance {
  id: string
  outputs: OutputEntry[]
  input: string
  commandHistory: string[]
  historyIndex: number
}

interface SplitContainer {
  id: string
  direction: 'horizontal' | 'vertical'
  children: (string | SplitContainer)[]  // terminal IDs or nested containers
  sizes?: number[]  // flex sizes for each child
}

export default function TerminalPage() {
  const [isBooting, setIsBooting] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [isShuttingDown, setIsShuttingDown] = useState(false)
  const [bootMessages, setBootMessages] = useState<string[]>([])
  const [theme, setTheme] = useState<Theme>('default')
  const [terminals, setTerminals] = useState<Map<string, TerminalInstance>>(
    new Map([['main', {
      id: 'main',
      outputs: [],
      input: '',
      commandHistory: [],
      historyIndex: -1
    }]])
  )
  const [layout, setLayout] = useState<string | SplitContainer>('main')
  const [activeTerminalId, setActiveTerminalId] = useState<string>('main')
  const [showThemeModal, setShowThemeModal] = useState(false)
  const [showProjectsModal, setShowProjectsModal] = useState(false)
  const [gameActive, setGameActive] = useState(false)
  const [matrixActive, setMatrixActive] = useState(false)
  const [p5Loaded, setP5Loaded] = useState(false)
  const [gameScore, setGameScore] = useState(0)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuTerminalId, setContextMenuTerminalId] = useState<string>('main')
  
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map())
  const outputRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const terminalContentRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const matrixCanvasRef = useRef<HTMLCanvasElement>(null)
  const matrixIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameCanvasRef = useRef<HTMLCanvasElement>(null)
  const gameIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const handleShutdown = () => {
    setIsShuttingDown(true)
    setTimeout(() => {
      window.location.href = '/'
    }, 800)
  }

  const projects = [
    {
      title: "Dashboard - Tableau de bord personnalisable",
      description: "Plateforme complète de dashboards personnalisables avec widgets modulaires. Interface drag & drop, authentification JWT, API REST avec NestJS.",
      image: "/image/dashboard-preview.png",
      technologies: ["React", "NestJS", "MongoDB", "Tailwind CSS"],
      demo: "https://showtime.agence-fastlane.com"
    },
    {
      title: "Pineapple - Critique de films",
      description: "Plateforme de critiques cinématographiques avec intégration API TMDB. Server-Side Rendering avec Next.js pour performances optimales.",
      image: "/image/pineapple-preview.png",
      technologies: ["Next.js", "API TMDB", "Tailwind CSS", "TypeScript"],
      demo: "https://pineapple2025.vercel.app/"
    },
    {
      title: "AurelOS Portfolio - Terminal interactif",
      description: "Portfolio personnel sous forme de terminal interactif avec boot sequence NASA/SpaceX, ASCII art coloré, effets glitch et shutdown CRT.",
      image: "/image/aurelos-preview.png",
      technologies: ["Next.js", "TypeScript", "CSS Animations", "ASCII Art"],
      demo: "https://aurelayoyide.netlify.app/",
      repo: "https://github.com/AurelAyoyide/mon_portfolio"
    },
    {
      title: "YOWL - Plateforme communautaire",
      description: "Réseau social permettant de centraliser et partager des commentaires sur tout type de contenu internet. Système de threading et votes.",
      image: "/image/yowl-preview.png",
      technologies: ["Laravel", "Vue.js", "Tailwind CSS", "MySQL"],
      demo: "https://yowlraib.netlify.app/"
    },
    {
      title: "Post-it - Gestionnaire de tâches",
      description: "Application légère de gestion de tâches inspirée des Post-it physiques. Interface drag & drop intuitive avec catégorisation par couleurs.",
      image: "/image/postit-preview.png",
      technologies: ["Vue.js", "Tailwind CSS", "LocalStorage"],
      demo: "https://apostit.netlify.app/"
    },
  ]

  // Snake game state
  const snakeRef = useRef<{x: number, y: number}[]>([])
  const foodRef = useRef<{x: number, y: number}>({x: 0, y: 0})
  const directionRef = useRef<{x: number, y: number}>({x: 1, y: 0})
  const nextDirectionRef = useRef<{x: number, y: number}>({x: 1, y: 0})
  const scoreRef = useRef(0)
  const gameOverRef = useRef(false)
  const isPausedRef = useRef(false)

  const themeColors: Record<Theme, { accent: string; matrix: string }> = {
    default: { accent: '#ff8c00', matrix: '#00ff00' },
    dracula: { accent: '#ff79c6', matrix: '#50fa7b' },
    solarized: { accent: '#268bd2', matrix: '#859900' },
    nord: { accent: '#81a1c1', matrix: '#a3be8c' },
  }

  const wrapWithColor = (text: string, color: string) => {
    return `<span style="color: ${color}">${text}</span>`
  }

  // Helper functions for terminal management
  const getTerminal = (id: string): TerminalInstance | undefined => {
    return terminals.get(id)
  }

  const updateTerminal = (id: string, updates: Partial<TerminalInstance>) => {
    setTerminals(prev => {
      const newMap = new Map(prev)
      const terminal = newMap.get(id)
      if (terminal) {
        newMap.set(id, { ...terminal, ...updates })
      }
      return newMap
    })
  }

  const addOutput = (terminalId: string, content: string, type: OutputEntry['type'] = 'output') => {
    updateTerminal(terminalId, {
      outputs: [...(getTerminal(terminalId)?.outputs || []), { type, content }]
    })
  }

  const clearTerminalOutput = (terminalId: string) => {
    updateTerminal(terminalId, {
      outputs: [{ type: 'output', content: getWelcomeMessage() }]
    })
  }

  const createNewTerminal = (): string => {
    const newId = `terminal-${Date.now()}`
    setTerminals(prev => {
      const newMap = new Map(prev)
      newMap.set(newId, {
        id: newId,
        outputs: [{ type: 'output', content: getWelcomeMessage() }],
        input: '',
        commandHistory: [],
        historyIndex: -1
      })
      return newMap
    })
    return newId
  }

  const splitTerminal = (terminalId: string, direction: 'horizontal' | 'vertical') => {
    const newTerminalId = createNewTerminal()
    
    setLayout(prevLayout => {
      // If current layout is just a single terminal ID
      if (typeof prevLayout === 'string') {
        if (prevLayout === terminalId) {
          return {
            id: `split-${Date.now()}`,
            direction,
            children: [terminalId, newTerminalId],
            sizes: [50, 50]
          }
        }
        return prevLayout
      }

      // Recursive function to update layout
      const updateLayout = (container: SplitContainer): SplitContainer => {
        const newChildren = container.children.map(child => {
          if (typeof child === 'string') {
            if (child === terminalId) {
              // Found the terminal to split
              return {
                id: `split-${Date.now()}`,
                direction,
                children: [child, newTerminalId],
                sizes: [50, 50]
              } as SplitContainer
            }
            return child
          } else {
            return updateLayout(child)
          }
        })
        return { ...container, children: newChildren }
      }

      return updateLayout(prevLayout)
    })

    // Focus the new terminal
    setTimeout(() => {
      const inputEl = inputRefs.current.get(newTerminalId)
      if (inputEl) inputEl.focus()
      setActiveTerminalId(newTerminalId)
    }, 100)
  }

  const closeTerminal = (terminalId: string) => {
    if (terminalId === 'main' && typeof layout === 'string') {
      // Can't close the only terminal
      return
    }

    setTerminals(prev => {
      const newMap = new Map(prev)
      newMap.delete(terminalId)
      return newMap
    })

    setLayout(prevLayout => {
      if (typeof prevLayout === 'string') {
        return prevLayout
      }

      const removeFromLayout = (container: SplitContainer): string | SplitContainer => {
        const newChildren = container.children.filter(child => {
          if (typeof child === 'string') {
            return child !== terminalId
          }
          return true
        }).map(child => {
          if (typeof child === 'string') {
            return child
          }
          return removeFromLayout(child)
        })

        // If only one child left, collapse the container
        if (newChildren.length === 1) {
          return newChildren[0]
        }

        return { ...container, children: newChildren }
      }

      return removeFromLayout(prevLayout)
    })

    // Set active to first available terminal
    const firstTerminalId = Array.from(terminals.keys()).find(id => id !== terminalId)
    if (firstTerminalId) {
      setActiveTerminalId(firstTerminalId)
      setTimeout(() => {
        const inputEl = inputRefs.current.get(firstTerminalId)
        if (inputEl) inputEl.focus()
      }, 100)
    }
  }

  // Logo AurelOS en ASCII art (utilisé dans boot et whoami)
  const aurelosLogo = ` █████╗ ██╗   ██╗██████╗ ███████╗██╗      ██████╗ ███████╗
██╔══██╗██║   ██║██╔══██╗██╔════╝██║     ██╔═══██╗██╔════╝
███████║██║   ██║██████╔╝█████╗  ██║     ██║   ██║███████╗
██╔══██║██║   ██║██╔══██╗██╔══╝  ██║     ██║   ██║╚════██║
██║  ██║╚██████╔╝██║  ██║███████╗███████╗╚██████╔╝███████║
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝`

  const getWelcomeMessage = useCallback(() => {
    const divider = '─────────────────────────────────────────────────'

    return wrapWithColor(aurelosLogo + '\n', '#d4843e') +
      wrapWithColor(divider + '\n', '#555555') +
      wrapWithColor('              AurelOS Terminal Environment\n', '#888888') +
      wrapWithColor('         Développeur Fullstack & Desktop\n', '#666666') +
      wrapWithColor(divider + '\n\n', '#555555') +
      wrapWithColor("Type ", '#666666') +
      wrapWithColor("'help'", '#87af87') +
      wrapWithColor(" to see available commands\n", '#666666') +
      wrapWithColor("Press ", '#666666') +
      wrapWithColor("'tab'", '#87af87') +
      wrapWithColor(" to auto-complete commands", '#666666')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  useEffect(() => {
    // Apply terminal-specific body styles
    document.body.style.backgroundColor = '#000'
    document.body.style.overflow = 'hidden'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.minHeight = '100vh'

    // Cleanup function to restore normal body styles
    return () => {
      document.body.style.backgroundColor = ''
      document.body.style.overflow = ''
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.minHeight = ''
    }
  }, [])

  useEffect(() => {
    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)

    // Boot sequence
    if (!isMobile) {
      const messages = [
        'AurelOS v1.0.0 Starting...',
        '[OK] Loading kernel modules',
        '[OK] Initializing system components',
        '[OK] Mounting file system',
        '[OK] Starting network services',
        '[OK] Loading user environment',
        '[OK] Terminal interface ready',
        'Welcome to AurelOS'
      ]

      let messageIndex = 0
      const bootInterval = setInterval(() => {
        if (messageIndex < messages.length) {
          setBootMessages(prev => [...prev, messages[messageIndex]])
          messageIndex++
        } else {
          clearInterval(bootInterval)
          setTimeout(() => setIsBooting(false), 100)
        }
      }, 100)

      return () => {
        clearInterval(bootInterval)
        window.removeEventListener('resize', checkMobile)
      }
    } else {
      setIsBooting(false)
    }

    return () => window.removeEventListener('resize', checkMobile)
  }, [isMobile])

  useEffect(() => {
    if (isBooting || isMobile) return

    // Load saved theme
    const savedTheme = localStorage.getItem('terminal-theme') as Theme
    if (savedTheme) setTheme(savedTheme)
    
    // Initialize main terminal with welcome message
    setTerminals(new Map([['main', {
      id: 'main',
      outputs: [{ type: 'output', content: getWelcomeMessage() }],
      input: '',
      commandHistory: [],
      historyIndex: -1
    }]]))
    
    // Focus first input
    setTimeout(() => {
      const mainInput = inputRefs.current.get('main')
      if (mainInput) mainInput.focus()
    }, 100)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBooting, isMobile])

  useEffect(() => {
    // Global keyboard shortcuts for split
    const handleGlobalKeys = (e: globalThis.KeyboardEvent) => {
      // Ctrl + Shift + H for horizontal split
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        splitTerminal(activeTerminalId, 'horizontal')
      }
      // Ctrl + Shift + V for vertical split
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        splitTerminal(activeTerminalId, 'vertical')
      }
      // Ctrl + Shift + W to close current terminal (if not main)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'w') {
        e.preventDefault()
        if (activeTerminalId !== 'main' || typeof layout !== 'string') {
          closeTerminal(activeTerminalId)
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [activeTerminalId, layout])

  useEffect(() => {
    // Scroll to bottom when active terminal outputs change
    const activeTerminal = terminals.get(activeTerminalId)
    if (activeTerminal) {
      const terminalContentEl = terminalContentRefs.current.get(activeTerminalId)
      if (terminalContentEl) {
        terminalContentEl.scrollTop = terminalContentEl.scrollHeight
      }
    }
  }, [terminals, activeTerminalId])

  useEffect(() => {
    // Update welcome message when theme changes for all terminals
    setTerminals(prev => {
      const newMap = new Map(prev)
      newMap.forEach((terminal, id) => {
        if (terminal.outputs.length === 1 && terminal.outputs[0].type === 'output') {
          newMap.set(id, {
            ...terminal,
            outputs: [{ type: 'output', content: getWelcomeMessage() }]
          })
        }
      })
      return newMap
    })
  }, [theme, getWelcomeMessage])

  const getHelpText = () => {
    const title = wrapWithColor('🚀 Available Commands\n\n', '#ffff00')

    const mainCommands = wrapWithColor('Main Commands:\n', '#00ffff') +
      wrapWithColor('• help', '#98fb98') + '       ' + wrapWithColor('Show this help message\n', '#ffffff') +
      wrapWithColor('• whoami', '#98fb98') + '     ' + wrapWithColor('Display ASCII portrait\n', '#ffffff') +
      wrapWithColor('• about', '#98fb98') + '      ' + wrapWithColor('Display my professional summary\n', '#ffffff') +
      wrapWithColor('• skills', '#98fb98') + '     ' + wrapWithColor('View my technical expertise\n', '#ffffff') +
      wrapWithColor('• experience', '#98fb98') + ' ' + wrapWithColor('Show my work history\n', '#ffffff') +
      wrapWithColor('• education', '#98fb98') + '  ' + wrapWithColor('View my educational background\n', '#ffffff') +
      wrapWithColor('• contact', '#98fb98') + '    ' + wrapWithColor('Get my contact information\n', '#ffffff') +
      wrapWithColor('• social', '#98fb98') + '     ' + wrapWithColor('Quick links to social media\n', '#ffffff') +
      wrapWithColor('• cv', '#98fb98') + '         ' + wrapWithColor('Download my resume (PDF)\n', '#ffffff') +
      wrapWithColor('• clear', '#98fb98') + '      ' + wrapWithColor('Clear the terminal screen\n', '#ffffff')

    const utilityCommands = '\n' + wrapWithColor('Utility Commands:\n', '#00ffff') +
      wrapWithColor('• projects', '#98fb98') + '   ' + wrapWithColor('View my project showcase\n', '#ffffff') +
      wrapWithColor('• game', '#98fb98') + '       ' + wrapWithColor('Play Snake mini-game\n', '#ffffff') +
      wrapWithColor('• exit-game', '#98fb98') + '  ' + wrapWithColor('Exit the game\n', '#ffffff') +
      wrapWithColor('• matrix', '#98fb98') + '     ' + wrapWithColor('Start Matrix digital rain effect\n', '#ffffff') +
      wrapWithColor('• stop-matrix', '#98fb98') + '' + wrapWithColor(' Stop Matrix effect\n', '#ffffff') +
      wrapWithColor('• calc', '#98fb98') + '       ' + wrapWithColor('Calculator (usage: calc [expression])\n', '#ffffff')

    const shortcuts = '\n' + wrapWithColor('Shortcuts:\n', '#666666') +
      wrapWithColor('• ', '#666666') + wrapWithColor('↑/↓', '#666666') + '         ' + wrapWithColor('Navigate command history\n', '#444444') +
      wrapWithColor('• ', '#666666') + wrapWithColor('Tab', '#666666') + '         ' + wrapWithColor('Auto-complete commands\n', '#444444') +
      wrapWithColor('• ', '#666666') + wrapWithColor('Ctrl+L', '#666666') + '      ' + wrapWithColor('Clear the screen\n', '#444444') +
      wrapWithColor('• ', '#666666') + wrapWithColor('Ctrl+Shift+H', '#666666') + ' ' + wrapWithColor('Split horizontally\n', '#444444') +
      wrapWithColor('• ', '#666666') + wrapWithColor('Ctrl+Shift+V', '#666666') + ' ' + wrapWithColor('Split vertically', '#444444')

    return title + mainCommands + utilityCommands + shortcuts
  }

  const getAboutText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">✨ About Me</span>

${wrapWithColor('┌───────────────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Développeur Fullstack & Desktop passionné depuis le lycée,', '#ffffff')}
${wrapWithColor('│', accent)} ${wrapWithColor('je conçois des solutions web modernes et applications', '#ffffff')}
${wrapWithColor('│', accent)} ${wrapWithColor('desktop performantes.', '#ffffff')}
${wrapWithColor('└───────────────────────────────────────────────────────────┘', accent)}

${wrapWithColor('⚡ Parcours', accent)}
${wrapWithColor('   De la maintenance informatique à l’architecture logicielle', '#ffffff')}
${wrapWithColor('   complexe, mon parcours m’a forgé une expertise technique', '#ffffff')}
${wrapWithColor('   solide et une capacité d’adaptation constante.', '#ffffff')}

${wrapWithColor('⚡ Expertise', accent)}
${wrapWithColor('   Maîtrise des technologies frontend/backend', '#ffffff')} ${wrapWithColor('(React, Next.js,', accent)}
${wrapWithColor('   Vue.js, NestJS, Laravel)', accent)} ${wrapWithColor('et développement desktop', '#ffffff')} ${wrapWithColor('(C#,', accent)}
${wrapWithColor('   VB.NET)', accent)} ${wrapWithColor('pour créer des expériences utilisateur', '#ffffff')}
${wrapWithColor('   exceptionnelles.', '#ffffff')}

${wrapWithColor('⚡ Philosophie', accent)}
${wrapWithColor('   Combinaison de créativité, rigueur technique et sens du', '#ffffff')}
${wrapWithColor('   travail en équipe pour transformer des idées innovantes', '#ffffff')}
${wrapWithColor('   en solutions performantes.', '#ffffff')}

${wrapWithColor('╭───────────────────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Prêt à relever de nouveaux défis techniques !', '#ffffff')}             ${wrapWithColor('│', accent)}
${wrapWithColor('╰───────────────────────────────────────────────────────╯', accent)}`
  }

  const getWhoamiText = () => {
    const accent = themeColors[theme].accent
    
    // AUREL en ASCII art
    const aurelArt = [
      ` █████╗ ██╗   ██╗██████╗ ███████╗██╗     `,
      `██╔══██╗██║   ██║██╔══██╗██╔════╝██║     `,
      `███████║██║   ██║██████╔╝█████╗  ██║     `,
      `██╔══██║██║   ██║██╔══██╗██╔══╝  ██║     `,
      `██║  ██║╚██████╔╝██║  ██║███████╗███████╗`,
      `╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝`
    ]
    
    // AYOYIDE en ASCII art
    const ayoyideArt = [
      ` █████╗ ██╗   ██╗ ██████╗ ██╗   ██╗██╗██████╗ ███████╗`,
      `██╔══██╗╚██╗ ██╔╝██╔═══██╗╚██╗ ██╔╝██║██╔══██╗██╔════╝`,
      `███████║ ╚████╔╝ ██║   ██║ ╚████╔╝ ██║██║  ██║█████╗  `,
      `██╔══██║  ╚██╔╝  ██║   ██║  ╚██╔╝  ██║██║  ██║██╔══╝  `,
      `██║  ██║   ██║   ╚██████╔╝   ██║   ██║██████╔╝███████╗`,
      `╚═╝  ╚═╝   ╚═╝    ╚═════╝    ╚═╝   ╚═╝╚═════╝ ╚══════╝`
    ]
    
    let output = `<span style="color: ${accent}; font-weight: bold;">👤 Who Am I</span>\n\n`
    
    // Afficher AUREL
    aurelArt.forEach(line => {
      output += wrapWithColor(line, accent) + '\n'
    })
    
    output += '\n'
    
    // Afficher AYOYIDE
    ayoyideArt.forEach(line => {
      output += wrapWithColor(line, accent) + '\n'
    })
    
    const divider = '─────────────────────────────────────────────────────────────'
    
    output += '\n' + wrapWithColor(divider, '#555555') + '\n'
    output += wrapWithColor('💼 Développeur Fullstack & Desktop', '#ffffff') + '\n'
    output += wrapWithColor('📍 Cotonou, Bénin', '#87cefa') + '\n'
    output += wrapWithColor('📧 aurel.ayoyide@epitech.eu', '#98fb98') + '\n'
    output += wrapWithColor('🌐 https://aurelayoyide.netlify.app/', '#87cefa') + '\n'
    output += wrapWithColor(divider, '#555555')
    
    return output
  }

  const getSkillsText = () => {
    return `<span style="color: #ffff00; font-weight: bold;">🛠️ COMPÉTENCES TECHNIQUES</span>

<span style="color: #00ffff;">💻 Langages de programmation</span>
• <i class="fab fa-js" style="color: #f7df1e; margin-right: 8px;"></i> ${wrapWithColor('JavaScript', '#ffffff')}
• <i class="fab fa-js" style="color: #3178c6; margin-right: 8px;"></i> ${wrapWithColor('TypeScript', '#ffffff')}
• <i class="fab fa-python" style="color: #3776ab; margin-right: 8px;"></i> ${wrapWithColor('Python', '#ffffff')}
• <i class="fab fa-java" style="color: #f89820; margin-right: 8px;"></i> ${wrapWithColor('Java', '#ffffff')}
• <i class="fab fa-php" style="color: #777bb4; margin-right: 8px;"></i> ${wrapWithColor('PHP', '#ffffff')}
• <i class="fas fa-code" style="color: #68217a; margin-right: 8px;"></i> ${wrapWithColor('C#', '#ffffff')}
• <i class="fas fa-code" style="color: #945db7; margin-right: 8px;"></i> ${wrapWithColor('VB.NET', '#ffffff')}
• <i class="fab fa-html5" style="color: #e34f26; margin-right: 8px;"></i> ${wrapWithColor('HTML/CSS', '#ffffff')}

<span style="color: #00ffff;">🎨 Frontend</span>
• <i class="fab fa-react" style="color: #61dafb; margin-right: 8px;"></i> ${wrapWithColor('React.js', '#ffffff')}
• <i class="fas fa-rocket" style="color: #000000; margin-right: 8px;"></i> ${wrapWithColor('Next.js', '#ffffff')}
• <i class="fab fa-vuejs" style="color: #42b883; margin-right: 8px;"></i> ${wrapWithColor('Vue.js', '#ffffff')}
• <i class="fab fa-react" style="color: #61dafb; margin-right: 8px;"></i> ${wrapWithColor('React Native', '#ffffff')}
• <i class="fas fa-wind" style="color: #38bdf8; margin-right: 8px;"></i> ${wrapWithColor('Tailwind CSS', '#ffffff')}
• <i class="fab fa-bootstrap" style="color: #7952b3; margin-right: 8px;"></i> ${wrapWithColor('Bootstrap', '#ffffff')}
• <i class="fas fa-store" style="color: #42b883; margin-right: 8px;"></i> ${wrapWithColor('Pinia', '#ffffff')}

<span style="color: #00ffff;">⚙️ Backend</span>
• <i class="fab fa-node" style="color: #339933; margin-right: 8px;"></i> ${wrapWithColor('Node.js', '#ffffff')}
• <i class="fas fa-server" style="color: #68a063; margin-right: 8px;"></i> ${wrapWithColor('Express.js', '#ffffff')}
• <i class="fas fa-cat" style="color: #e0234e; margin-right: 8px;"></i> ${wrapWithColor('NestJS', '#ffffff')}
• <i class="fab fa-laravel" style="color: #ff2d20; margin-right: 8px;"></i> ${wrapWithColor('Laravel', '#ffffff')}
• <i class="fas fa-flask" style="color: #000000; margin-right: 8px;"></i> ${wrapWithColor('Flask', '#ffffff')}

<span style="color: #00ffff;">🗄️ Bases de données</span>
• <i class="fas fa-leaf" style="color: #47a248; margin-right: 8px;"></i> ${wrapWithColor('MongoDB', '#ffffff')}
• <i class="fas fa-database" style="color: #00758f; margin-right: 8px;"></i> ${wrapWithColor('MySQL', '#ffffff')}
• <i class="fas fa-database" style="color: #336791; margin-right: 8px;"></i> ${wrapWithColor('PostgreSQL', '#ffffff')}
• <i class="fas fa-database" style="color: #003b57; margin-right: 8px;"></i> ${wrapWithColor('SQLite', '#ffffff')}
• <i class="fab fa-google" style="color: #ffca28; margin-right: 8px;"></i> ${wrapWithColor('Firebase', '#ffffff')}

<span style="color: #00ffff;">☁️ DevOps & Cloud</span>
• <i class="fab fa-docker" style="color: #2496ed; margin-right: 8px;"></i> ${wrapWithColor('Docker', '#ffffff')}
• <i class="fab fa-git-alt" style="color: #f05032; margin-right: 8px;"></i> ${wrapWithColor('Git', '#ffffff')}
• <i class="fab fa-github" style="color: #181717; margin-right: 8px;"></i> ${wrapWithColor('GitHub Actions', '#ffffff')}
• <i class="fas fa-cloud" style="color: #000000; margin-right: 8px;"></i> ${wrapWithColor('Vercel', '#ffffff')}
• <i class="fas fa-cloud" style="color: #00c7b7; margin-right: 8px;"></i> ${wrapWithColor('Netlify', '#ffffff')}

<span style="color: #00ffff;">🛠️ Outils & Autres</span>
• <i class="fas fa-rocket" style="color: #ff6c37; margin-right: 8px;"></i> ${wrapWithColor('Postman (Certifié)', '#ffffff')}
• <i class="fas fa-exchange-alt" style="color: #61dafb; margin-right: 8px;"></i> ${wrapWithColor('REST API', '#ffffff')}
• <i class="fas fa-key" style="color: #000000; margin-right: 8px;"></i> ${wrapWithColor('JWT', '#ffffff')}
• <i class="fas fa-code" style="color: #007acc; margin-right: 8px;"></i> ${wrapWithColor('Visual Studio Code', '#ffffff')}
• <i class="fas fa-code" style="color: #68217a; margin-right: 8px;"></i> ${wrapWithColor('Visual Studio', '#ffffff')}
• <i class="fab fa-figma" style="color: #f24e1e; margin-right: 8px;"></i> ${wrapWithColor('Figma', '#ffffff')}`
  }

  const getExperienceText = () => {
    return `<span style="color: #ffff00; font-weight: bold;">💼 Expérience Professionnelle</span>

<span style="color: #00ffff;">EPITECH Bénin | Étudiant Développeur Fullstack</span>
${wrapWithColor('Juillet 2025 - Décembre 2025 | Cotonou, Bénin', '#ffffff')}
${wrapWithColor('Coding Academy - Formation intensive aux technologies modernes', '#98fb98')}

• ${wrapWithColor('Développement d’applications web modernes', '#ffa07a')} - ${wrapWithColor('React, Next.js, Vue.js, NestJS', '#ffffff')}
• ${wrapWithColor('Architecture Fullstack complète', '#ffa07a')} - ${wrapWithColor('De la base de données au frontend', '#ffffff')}
• ${wrapWithColor('Collaboration en équipe', '#ffa07a')} - ${wrapWithColor('Git et méthodologies agiles', '#ffffff')}
• ${wrapWithColor('Maîtrise des API REST', '#ffa07a')} - ${wrapWithColor('Intégration de services tiers', '#ffffff')}
• ${wrapWithColor('Déploiement cloud', '#ffa07a')} - ${wrapWithColor('Vercel, Netlify et gestion d’applications', '#ffffff')}

${wrapWithColor('Technologies utilisées:', '#00ffff')} ${wrapWithColor('Next.js, React, Vue.js, NestJS, Laravel, MongoDB, MySQL, Tailwind CSS, Git, Postman', '#87cefa')}`
  }

  const getEducationText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">🎓 Formation</span>

${wrapWithColor('┌──────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' Coding Academy - Développement Fullstack ', '#ffffff')}${wrapWithColor('│', accent)}
${wrapWithColor('└──────────────────────────────────────────────────┘', accent)}

${wrapWithColor('🏛️ Institution:', accent)} ${wrapWithColor('EPITECH Bénin', '#ffffff')}
${wrapWithColor('📅 Période:', accent)}    ${wrapWithColor('Juillet 2025 - Présent', '#ffffff')}
${wrapWithColor('📍 Lieu:', accent)}        ${wrapWithColor('Cotonou, Bénin', '#ffffff')}
${wrapWithColor('🎯 Focus:', accent)}       ${wrapWithColor('Technologies web modernes, Architecture logicielle', '#ffffff')}

${wrapWithColor('┌──────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' Licence Pro - Systèmes Informatiques ', '#ffffff')}         ${wrapWithColor('│', accent)}
${wrapWithColor('└──────────────────────────────────────────────────┘', accent)}

${wrapWithColor('🏛️ Institution:', accent)} ${wrapWithColor('Institut Universitaire Les Cours Sonou', '#ffffff')}
${wrapWithColor('📅 Période:', accent)}    ${wrapWithColor('Novembre 2019 - 2024', '#ffffff')}
${wrapWithColor('📍 Lieu:', accent)}        ${wrapWithColor('Cotonou, Bénin', '#ffffff')}

${wrapWithColor('┌──────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' Diplôme de Technicien - Maintenance Info ', '#ffffff')}      ${wrapWithColor('│', accent)}
${wrapWithColor('└──────────────────────────────────────────────────┘', accent)}

${wrapWithColor('🏛️ Institution:', accent)} ${wrapWithColor('Lycée Technique et Professionnel de Kpondehou', '#ffffff')}
${wrapWithColor('📅 Période:', accent)}    ${wrapWithColor('2015 - 2018', '#ffffff')}
${wrapWithColor('📍 Lieu:', accent)}        ${wrapWithColor('Cotonou, Bénin', '#ffffff')}

${wrapWithColor('╭──────────────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' De la maintenance à l’architecture logicielle ', '#ffffff')}     ${wrapWithColor('│', accent)}
${wrapWithColor('╰──────────────────────────────────────────────────╯', accent)}`
  }

  const getContactText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">📫 Contact</span>

${wrapWithColor('┌────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Connectons-nous et créons quelque chose !', '#ffffff')} ${wrapWithColor('│', accent)}
${wrapWithColor('└────────────────────────────────────────┘', accent)}

${wrapWithColor('✉', accent)}  ${wrapWithColor('Email:', accent)} ${wrapWithColor('<a href="mailto:aurel.ayoyide@epitech.eu" style="color: #ffffff; text-decoration: none;">aurel.ayoyide@epitech.eu</a>', '#ffffff')}

${wrapWithColor('📞', accent)}  ${wrapWithColor('Téléphone:', accent)} ${wrapWithColor('+229 01 96 81 18 59', '#ffffff')}

${wrapWithColor('🌐', accent)}  ${wrapWithColor('Site web:', accent)} ${wrapWithColor('<a href="https://aurelayoyide.netlify.app/" target="_blank" style="color: #ffffff; text-decoration: none;">aurelayoyide.netlify.app</a>', '#ffffff')}

${wrapWithColor('⚡', accent)}  ${wrapWithColor('Github:', accent)} ${wrapWithColor('<a href="https://github.com/AurelAyoyide" target="_blank" style="color: #ffffff; text-decoration: none;">github.com/AurelAyoyide</a>', '#ffffff')}

${wrapWithColor('💼', accent)}  ${wrapWithColor('LinkedIn:', accent)} ${wrapWithColor('<a href="https://linkedin.com/in/aurel-ayoyide-864863396" target="_blank" style="color: #ffffff; text-decoration: none;">linkedin.com/in/aurel-ayoyide</a>', '#ffffff')}

${wrapWithColor('📍', accent)}  ${wrapWithColor('Localisation:', accent)} ${wrapWithColor('Cotonou, Bénin', '#ffffff')}

${wrapWithColor('╭────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Disponible pour nouvelles opportunités !', '#ffffff')} ${wrapWithColor('│', accent)}
${wrapWithColor('╰────────────────────────────────────────╯', accent)}`
  }

  const getSocialText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">🔗 LIENS RAPIDES</span>

${wrapWithColor('┌──────────────────────────────────────────────────┐', '#555555')}
${wrapWithColor('│', '#555555')} <i class="fab fa-github" style="color: #ffffff; font-size: 1.2em; margin-right: 8px;"></i> ${wrapWithColor('GitHub', '#87cefa')}                                     ${wrapWithColor('│', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('<a href="https://github.com/AurelAyoyide" target="_blank" style="color: #98fb98; text-decoration: none;">https://github.com/AurelAyoyide</a>', '#98fb98')}            ${wrapWithColor('│', '#555555')}
${wrapWithColor('├──────────────────────────────────────────────────┤', '#555555')}
${wrapWithColor('│', '#555555')} <i class="fab fa-linkedin" style="color: #0077b5; font-size: 1.2em; margin-right: 8px;"></i> ${wrapWithColor('LinkedIn', '#87cefa')}                                 ${wrapWithColor('│', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('<a href="https://linkedin.com/in/aurel-ayoyide-864863396/" target="_blank" style="color: #98fb98; text-decoration: none;">linkedin.com/in/aurel-ayoyide-864863396/</a>', '#98fb98')} ${wrapWithColor('│', '#555555')}
${wrapWithColor('├──────────────────────────────────────────────────┤', '#555555')}
${wrapWithColor('│', '#555555')} <i class="fas fa-globe" style="color: #ffd93d; font-size: 1.2em; margin-right: 8px;"></i> ${wrapWithColor('Portfolio', '#87cefa')}                               ${wrapWithColor('│', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('<a href="https://aurelayoyide.netlify.app/" target="_blank" style="color: #98fb98; text-decoration: none;">https://aurelayoyide.netlify.app/</a>', '#98fb98')}          ${wrapWithColor('│', '#555555')}
${wrapWithColor('└──────────────────────────────────────────────────┘', '#555555')}

${wrapWithColor('💡 Tip:', accent)} Cliquez sur les liens pour les ouvrir !`
  }

  const getCvText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">📄 CURRICULUM VITAE</span>

${wrapWithColor('┌───────────────────────────────────────────────┐', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('📥 Télécharger mon CV', '#87cefa')}                        ${wrapWithColor('│', '#555555')}
${wrapWithColor('├───────────────────────────────────────────────┤', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('Format:', '#87cefa')} ${wrapWithColor('PDF', '#98fb98')}                                    ${wrapWithColor('│', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('Taille:', '#87cefa')} ${wrapWithColor('~ 150 KB', '#98fb98')}                              ${wrapWithColor('│', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('Langue:', '#87cefa')} ${wrapWithColor('Français', '#98fb98')}                             ${wrapWithColor('│', '#555555')}
${wrapWithColor('├───────────────────────────────────────────────┤', '#555555')}
${wrapWithColor('│', '#555555')} ${wrapWithColor('<a href="/Aurel_AYOYIDE_Developpeur_full_stack.pdf" download style="color: #98fb98; text-decoration: underline;">👉 Cliquez ici pour télécharger</a>', '#98fb98')}                 ${wrapWithColor('│', '#555555')}
${wrapWithColor('└───────────────────────────────────────────────┘', '#555555')}

${wrapWithColor('💡 Tip:', accent)} Le CV sera téléchargé au format PDF`
  }

  // Matrix Effect
  const startMatrix = (terminalId: string) => {
    setMatrixActive(true)
    addOutput(terminalId, 'Matrix effect started. Type "stop-matrix" to exit.', 'info')
  }

  const stopMatrix = () => {
    if (matrixIntervalRef.current) {
      clearInterval(matrixIntervalRef.current)
      matrixIntervalRef.current = null
    }
    setMatrixActive(false)
  }

  useEffect(() => {
    if (matrixActive && matrixCanvasRef.current) {
      const canvas = matrixCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = canvas.offsetWidth
      canvas.height = 300

      const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~'
      const columns = Math.floor(canvas.width / 20)
      const drops: number[] = []

      for (let i = 0; i < columns; i++) {
        drops[i] = Math.floor(Math.random() * -20)
      }

      const matrixColor = themeColors[theme].matrix

      const draw = () => {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = matrixColor
        ctx.font = '15px monospace'

        for (let i = 0; i < drops.length; i++) {
          const char = characters[Math.floor(Math.random() * characters.length)]
          ctx.fillText(char, i * 20, drops[i] * 20)

          if (drops[i] * 20 > canvas.height && Math.random() > 0.975) {
            drops[i] = 0
          }
          drops[i]++
        }
      }

      matrixIntervalRef.current = setInterval(draw, 50)

      return () => {
        if (matrixIntervalRef.current) {
          clearInterval(matrixIntervalRef.current)
        }
      }
    }
  }, [matrixActive, theme])

  // Snake Game
  const placeFood = () => {
    const gridSize = 20
    const canvasWidth = 400
    const canvasHeight = 300
    let validPosition = false
    
    while (!validPosition) {
      foodRef.current = {
        x: Math.floor(Math.random() * (canvasWidth / gridSize)),
        y: Math.floor(Math.random() * (canvasHeight / gridSize))
      }
      
      validPosition = true
      for (const segment of snakeRef.current) {
        if (segment.x === foodRef.current.x && segment.y === foodRef.current.y) {
          validPosition = false
          break
        }
      }
    }
  }

  const initSnakeGame = (terminalId: string) => {
    if (!p5Loaded) {
      addOutput(terminalId, 'Loading game...', 'info')
    }
    
    setGameActive(true)
    snakeRef.current = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 }
    ]
    directionRef.current = { x: 1, y: 0 }
    nextDirectionRef.current = { x: 1, y: 0 }
    scoreRef.current = 0
    setGameScore(0)
    gameOverRef.current = false
    isPausedRef.current = false
    placeFood()
  }

  const endGame = (terminalId: string) => {
    if (gameIntervalRef.current) {
      clearInterval(gameIntervalRef.current)
      gameIntervalRef.current = null
    }
    setGameActive(false)
    addOutput(terminalId, 'Game exited.', 'info')
  }

  useEffect(() => {
    if (gameActive && gameCanvasRef.current) {
      const canvas = gameCanvasRef.current
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const gridSize = 20
      const canvasWidth = 400
      const canvasHeight = 300
      canvas.width = canvasWidth
      canvas.height = canvasHeight

      const gameLoop = () => {
        if (isPausedRef.current || gameOverRef.current) return

        // Update direction
        directionRef.current = nextDirectionRef.current

        // Move snake
        const head = {
          x: snakeRef.current[0].x + directionRef.current.x,
          y: snakeRef.current[0].y + directionRef.current.y
        }

        // Wrap around
        if (head.x < 0) head.x = Math.floor(canvasWidth / gridSize) - 1
        if (head.x >= canvasWidth / gridSize) head.x = 0
        if (head.y < 0) head.y = Math.floor(canvasHeight / gridSize) - 1
        if (head.y >= canvasHeight / gridSize) head.y = 0

        // Check self collision
        for (let i = 0; i < snakeRef.current.length; i++) {
          if (head.x === snakeRef.current[i].x && head.y === snakeRef.current[i].y) {
            gameOverRef.current = true
            return
          }
        }

        snakeRef.current.unshift(head)

        // Check food
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          scoreRef.current += 10
          setGameScore(scoreRef.current)
          placeFood()
        } else {
          snakeRef.current.pop()
        }

        // Draw
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        // Draw grid
        ctx.strokeStyle = '#333'
        ctx.lineWidth = 0.5
        for (let x = 0; x <= canvasWidth; x += gridSize) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, canvasHeight)
          ctx.stroke()
        }
        for (let y = 0; y <= canvasHeight; y += gridSize) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(canvasWidth, y)
          ctx.stroke()
        }

        // Draw snake
        ctx.fillStyle = '#0f0'
        for (let i = 1; i < snakeRef.current.length; i++) {
          ctx.fillRect(
            snakeRef.current[i].x * gridSize + 1,
            snakeRef.current[i].y * gridSize + 1,
            gridSize - 2,
            gridSize - 2
          )
        }
        ctx.fillStyle = '#0c0'
        ctx.fillRect(
          snakeRef.current[0].x * gridSize + 1,
          snakeRef.current[0].y * gridSize + 1,
          gridSize - 2,
          gridSize - 2
        )

        // Draw food
        ctx.fillStyle = '#f00'
        ctx.beginPath()
        ctx.arc(
          foodRef.current.x * gridSize + gridSize / 2,
          foodRef.current.y * gridSize + gridSize / 2,
          gridSize * 0.4,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }

      const drawGameOver = () => {
        if (!gameOverRef.current) return

        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        ctx.fillStyle = '#f00'
        ctx.font = '24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('Game Over!', canvasWidth / 2, canvasHeight / 2 - 20)
        ctx.font = '16px monospace'
        ctx.fillStyle = '#fff'
        ctx.fillText(`Score: ${scoreRef.current}`, canvasWidth / 2, canvasHeight / 2 + 20)
        ctx.fillText('Press SPACE to restart', canvasWidth / 2, canvasHeight / 2 + 50)
      }

      const drawPaused = () => {
        if (!isPausedRef.current) return

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)
        ctx.fillStyle = '#fff'
        ctx.font = '24px monospace'
        ctx.textAlign = 'center'
        ctx.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2)
        ctx.font = '16px monospace'
        ctx.fillText('Press P to resume', canvasWidth / 2, canvasHeight / 2 + 30)
      }

      gameIntervalRef.current = setInterval(() => {
        if (gameOverRef.current) {
          drawGameOver()
        } else if (isPausedRef.current) {
          drawPaused()
        } else {
          gameLoop()
        }
      }, 100)

      return () => {
        if (gameIntervalRef.current) {
          clearInterval(gameIntervalRef.current)
        }
      }
    }
  }, [gameActive])

  // Game keyboard handler
  useEffect(() => {
    if (!gameActive) return

    const handleGameKeys = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'p' || e.key === 'P') {
        isPausedRef.current = !isPausedRef.current
        return
      }

      if (isPausedRef.current) return

      if (e.key === ' ' && gameOverRef.current) {
        e.preventDefault()
        // Restart game
        snakeRef.current = [
          { x: 5, y: 5 },
          { x: 4, y: 5 },
          { x: 3, y: 5 }
        ]
        directionRef.current = { x: 1, y: 0 }
        nextDirectionRef.current = { x: 1, y: 0 }
        scoreRef.current = 0
        setGameScore(0)
        gameOverRef.current = false
        placeFood()
        return
      }

      if (e.key === 'Escape') {
        endGame(activeTerminalId)
        return
      }

      if (e.key === 'ArrowUp' && directionRef.current.y !== 1) {
        nextDirectionRef.current = { x: 0, y: -1 }
      } else if (e.key === 'ArrowDown' && directionRef.current.y !== -1) {
        nextDirectionRef.current = { x: 0, y: 1 }
      } else if (e.key === 'ArrowLeft' && directionRef.current.x !== 1) {
        nextDirectionRef.current = { x: -1, y: 0 }
      } else if (e.key === 'ArrowRight' && directionRef.current.x !== -1) {
        nextDirectionRef.current = { x: 1, y: 0 }
      }

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault()
      }
    }

    window.addEventListener('keydown', handleGameKeys)
    return () => window.removeEventListener('keydown', handleGameKeys)
  }, [gameActive, endGame])

  // Weather command
  // Calculator command
  const calculate = (expression: string, terminalId: string) => {
    if (!expression) {
      addOutput(terminalId, "Please enter a mathematical expression. Usage: calc [expression]", 'error')
      return
    }

    try {
      const sanitizedExpression = expression.replace(/[^0-9+\-*/().%\s]/g, '')
      // eslint-disable-next-line no-eval
      const result = eval(sanitizedExpression)

      if (isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid result')
      }

      const formattedResult = typeof result === 'number' && !Number.isInteger(result)
        ? result.toFixed(4).replace(/\.?0+$/, '')
        : result.toString()

      const calculationHTML = `<div class="calculation">
        <div class="calculation-expression">${wrapWithColor(expression, '#87cefa')}</div>
        <div class="calculation-result">${wrapWithColor('= ' + formattedResult, '#98fb98')}</div>
      </div>`

      addOutput(terminalId, calculationHTML)
    } catch {
      addOutput(terminalId, `Error: Could not evaluate the expression. Make sure it's a valid mathematical expression.`, 'error')
    }
  }

  const handleCommand = (cmd: string, terminalId: string) => {
    const terminal = terminals.get(terminalId)
    if (!terminal) return

    const command = cmd.trim().toLowerCase()
    const [baseCmd, ...args] = command.split(' ')

    // Add command to output
    addOutput(terminalId, `➜ ${cmd}`, 'command')

    // Add to history
    if (cmd.trim()) {
      updateTerminal(terminalId, {
        commandHistory: [...terminal.commandHistory, cmd],
        historyIndex: -1
      })
    }

    switch (baseCmd) {
      case 'help':
        addOutput(terminalId, getHelpText())
        break
      case 'whoami':
        addOutput(terminalId, getWhoamiText())
        break
      case 'about':
        addOutput(terminalId, getAboutText())
        break
      case 'skills':
        addOutput(terminalId, getSkillsText())
        break
      case 'experience':
        addOutput(terminalId, getExperienceText())
        break
      case 'education':
        addOutput(terminalId, getEducationText())
        break
      case 'contact':
        addOutput(terminalId, getContactText())
        break
      case 'social':
        addOutput(terminalId, getSocialText())
        break
      case 'cv':
      case 'resume':
        addOutput(terminalId, getCvText())
        break
      case 'clear':
        clearTerminalOutput(terminalId)
        break
      case 'projects':
        setShowProjectsModal(true)
        break
      case 'game':
        initSnakeGame(terminalId)
        break
      case 'exit-game':
        endGame(terminalId)
        break
      case 'matrix':
        startMatrix(terminalId)
        break
      case 'stop-matrix':
        stopMatrix()
        addOutput(terminalId, 'Matrix effect stopped.', 'info')
        break
      case 'calc':
      case 'calculate':
        calculate(args.join(' '), terminalId)
        break
      case '':
        break
      default:
        addOutput(terminalId, `Command not found: ${command}. Type 'help' for available commands.`, 'error')
    }

    updateTerminal(terminalId, { input: '' })
  }

  const handleTabCompletion = (terminalId: string) => {
    const terminal = terminals.get(terminalId)
    if (!terminal) return

    const currentInput = terminal.input.toLowerCase().trim()
    const commands = ['help', 'whoami', 'about', 'skills', 'experience', 'education', 'contact', 'social', 'cv', 'resume', 'clear', 'projects', 'game', 'exit-game', 'matrix', 'stop-matrix', 'calc']

    const matches = commands.filter(cmd => cmd.startsWith(currentInput))

    if (matches.length === 1) {
      updateTerminal(terminalId, { input: matches[0] })
    } else if (matches.length > 1 && currentInput) {
      addOutput(terminalId, `\nPossible commands:\n${matches.join('  ')}`, 'info')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, terminalId: string) => {
    const terminal = terminals.get(terminalId)
    if (!terminal) return

    if (e.key === 'Enter') {
      handleCommand(terminal.input, terminalId)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (terminal.historyIndex < terminal.commandHistory.length - 1) {
        const newIndex = terminal.historyIndex + 1
        updateTerminal(terminalId, {
          historyIndex: newIndex,
          input: terminal.commandHistory[terminal.commandHistory.length - 1 - newIndex] || ''
        })
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (terminal.historyIndex > 0) {
        const newIndex = terminal.historyIndex - 1
        updateTerminal(terminalId, {
          historyIndex: newIndex,
          input: terminal.commandHistory[terminal.commandHistory.length - 1 - newIndex] || ''
        })
      } else {
        updateTerminal(terminalId, { historyIndex: -1, input: '' })
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      handleTabCompletion(terminalId)
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      clearTerminalOutput(terminalId)
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('terminal-theme', newTheme)
    setShowThemeModal(false)
  }

  // Recursive render function for split layout
  const renderTerminalLayout = (layoutNode: string | SplitContainer): JSX.Element => {
    if (typeof layoutNode === 'string') {
      // Render single terminal
      return renderSingleTerminal(layoutNode)
    }

    // Render split container
    const { direction, children } = layoutNode
    const splitClass = direction === 'horizontal' ? 'split-h' : 'split-v'

    return (
      <div className={`terminal-container ${splitClass}`}>
        {children.map((child, index) => (
          <React.Fragment key={typeof child === 'string' ? child : child.id}>
            {typeof child === 'string' ? renderSingleTerminal(child) : renderTerminalLayout(child)}
          </React.Fragment>
        ))}
      </div>
    )
  }

  const renderSingleTerminal = (terminalId: string): JSX.Element => {
    const terminal = terminals.get(terminalId)
    if (!terminal) return <div>Terminal not found</div>

    const isActive = terminalId === activeTerminalId

    return (
      <div
        className="terminal-content"
        onClick={() => {
          setActiveTerminalId(terminalId)
          inputRefs.current.get(terminalId)?.focus()
        }}
        onContextMenu={(e) => {
          e.preventDefault()
          setContextMenuTerminalId(terminalId)
          setContextMenuPos({ x: e.clientX, y: e.clientY })
          setShowContextMenu(true)
        }}
        ref={(el) => {
          if (el) terminalContentRefs.current.set(terminalId, el)
        }}
      >
        {/* Output */}
        <div
          className="terminal-output"
          ref={(el) => {
            if (el) outputRefs.current.set(terminalId, el)
          }}
        >
          {terminal.outputs.map((entry, index) => (
            <div
              key={index}
              className={entry.type}
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
          ))}
        </div>

        {/* Matrix Effect - only show in active terminal */}
        {matrixActive && isActive && (
          <div className="matrix-container">
            <canvas ref={matrixCanvasRef} className="matrix-canvas" />
            <div className="matrix-instructions">Type &apos;stop-matrix&apos; to exit</div>
          </div>
        )}

        {/* Snake Game - only show in active terminal */}
        {gameActive && isActive && (
          <div className="game-container">
            <div className="game-instructions">
              <p>Snake Game: Use arrow keys to move.</p>
              <p>Press P to pause, SPACE to restart, ESC to exit.</p>
            </div>
            <div className="game-score">Score: {gameScore}</div>
            <canvas ref={gameCanvasRef} className="game-canvas" width={400} height={300} />
          </div>
        )}

        {/* Input Line */}
        <div className="input-line">
          <span className="prompt">➜</span>
          <input
            ref={(el) => {
              if (el) inputRefs.current.set(terminalId, el)
            }}
            type="text"
            value={terminal.input}
            onChange={(e) => updateTerminal(terminalId, { input: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, terminalId)}
            className="command-input"
            autoFocus={isActive}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.6.0/p5.min.js"
        onLoad={() => setP5Loaded(true)}
      />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      
      {/* Mobile Warning */}
      {isMobile && (
        <div className="mobile-warning">
          <div className="mobile-warning-content">
            <i className="fa-solid fa-desktop" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
            <h1>AurelOS</h1>
            <p>Cette section est optimisée pour ordinateur.</p>
            <p>Veuillez utiliser un ordinateur pour accéder à AurelOS mon terminal interactif.</p>
            <Link href="/" className="back-button">
              <i className="fa-solid fa-arrow-left"></i> Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      )}

      {/* Boot Sequence */}
      {!isMobile && isBooting && (
        <div className="boot-screen">
          <div className="boot-content">
            <div className="boot-ascii-art">
              {ASCII_AVATAR.split('\n').map((line, lineIndex) => (
                <div 
                  key={lineIndex} 
                  style={{ 
                    display: 'flex', 
                    height: '1em', 
                    lineHeight: '1em',
                    animation: `asciiLineAppear 0.01s ease-out ${lineIndex * 0.003}s both`
                  }}
                >
                  {line.split('').map((char, charIndex) => {
                    const color = ASCII_COLORS[lineIndex]?.[charIndex] || '#ffd93d';
                    return (
                      <span
                        key={charIndex}
                        style={{
                          color: color,
                          textShadow: `0 0 10px ${color}40`,
                          width: '0.6em',
                          display: 'inline-block',
                          fontFamily: 'monospace',
                          fontWeight: 'bold'
                        }}
                      >
                        {char}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="boot-logo glitch-text" data-text="AurelOS">AurelOS</div>
            <div className="boot-version">Version 1.0.0</div>
            <div className="boot-messages">
              {bootMessages.map((msg, i) => (
                <div key={i} className="boot-message">
                  {msg}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Terminal */}
      {!isMobile && !isBooting && (
        <div className={`terminal-page theme-${theme} ${isShuttingDown ? 'shutdown' : ''}`}>
          <div className="terminal">
          {/* Header */}
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="close" onClick={handleShutdown}></span>
              <span className="minimize"></span>
              <span className="maximize"></span>
            </div>
            <div className="terminal-title">aurel@aurelos: ~/terminal</div>
            <div className="terminal-controls">
              <div className="theme-selector" onClick={() => setShowThemeModal(true)}>
                <i className="fa-solid fa-palette" id="theme-toggle"></i>
              </div>
            </div>
          </div>

          {/* Terminal Container */}
          <div className="terminal-container" style={{ height: 'calc(100% - 50px)', overflow: 'hidden' }}>
            {renderTerminalLayout(layout)}
          </div>

          {/* Context Menu */}
          {showContextMenu && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 999
                }}
                onClick={() => setShowContextMenu(false)}
              />
              <div
                className="context-menu active"
                style={{
                  position: 'fixed',
                  left: `${contextMenuPos.x}px`,
                  top: `${contextMenuPos.y}px`,
                  zIndex: 1000
                }}
              >
                <div className="menu-item" onClick={() => {
                  splitTerminal(contextMenuTerminalId, 'horizontal')
                  setShowContextMenu(false)
                }}>
                  Split Horizontally
                </div>
                <div className="menu-item" onClick={() => {
                  splitTerminal(contextMenuTerminalId, 'vertical')
                  setShowContextMenu(false)
                }}>
                  Split Vertically
                </div>
                {contextMenuTerminalId !== 'main' || typeof layout !== 'string' ? (
                  <div className="menu-item" onClick={() => {
                    closeTerminal(contextMenuTerminalId)
                    setShowContextMenu(false)
                  }}>
                    Close Split
                  </div>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Theme Modal */}
        <div className={`modal ${showThemeModal ? 'active' : ''}`} onClick={() => setShowThemeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setShowThemeModal(false)}>&times;</span>
            <h2>Select Theme</h2>
            <div className="theme-options">
              <div className="theme-option" onClick={() => handleThemeChange('default')}>
                <div className="theme-preview default-theme"></div>
                <span>Default</span>
              </div>
              <div className="theme-option" onClick={() => handleThemeChange('dracula')}>
                <div className="theme-preview dracula-theme"></div>
                <span>Dracula</span>
              </div>
              <div className="theme-option" onClick={() => handleThemeChange('solarized')}>
                <div className="theme-preview solarized-theme"></div>
                <span>Solarized</span>
              </div>
              <div className="theme-option" onClick={() => handleThemeChange('nord')}>
                <div className="theme-preview nord-theme"></div>
                <span>Nord</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Modal */}
        <div className={`modal ${showProjectsModal ? 'active' : ''}`} onClick={() => setShowProjectsModal(false)}>
          <div className="modal-content projects-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setShowProjectsModal(false)}>&times;</span>
            <h2>Projects</h2>
            <div className="projects-container">
              {projects.map((project, index) => (
                <div key={index} className="project-card">
                  {project.demo !== "#" ? (
                    <iframe 
                      src={project.demo} 
                      className="project-iframe" 
                      title={project.title}
                      loading="lazy"
                    />
                  ) : (
                    <div className="project-placeholder">
                      <p>Preview not available</p>
                    </div>
                  )}
                  <div className="project-details">
                    <h3 className="project-title">{project.title}</h3>
                    <p className="project-description">{project.description}</p>
                    <div className="project-tech">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                    <div className="project-links">
                      <a href={project.demo} className="project-link" target="_blank" rel="noopener noreferrer">
                        <i className="fas fa-external-link-alt"></i> Demo
                      </a>
                      {project.repo && (
                        <a href={project.repo} className="project-link" target="_blank" rel="noopener noreferrer">
                          <i className="fab fa-github"></i> Repository
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}
