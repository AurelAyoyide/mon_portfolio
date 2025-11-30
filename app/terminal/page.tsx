'use client'

import React, { useState, useRef, useEffect, useCallback, KeyboardEvent } from 'react'
import Link from 'next/link'
import Script from 'next/script'
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
  const [showSkillsModal, setShowSkillsModal] = useState(false)
  const [showLanguageModal, setShowLanguageModal] = useState(false)
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

  const projects = [
    {
      title: "Interactive Terminal Resume",
      description: "A unique terminal-based resume with interactive features",
      image: "/image/terminal-project.png",
      technologies: ["JavaScript", "HTML", "CSS"],
      demo: "https://marjoballabani.me/terminal.html",
      repo: "https://github.com/marjoballabani/mon_portfolio"
    },
    // Add more projects as needed
  ]

  const skillsData = {
    programming: {
      JavaScript: 95,
      Python: 90,
      "React.js": 85,
      "Node.js": 88,
    },
    cloud: {
      "Google Cloud": 92,
      AWS: 85,
      Azure: 80,
    },
    databases: {
      MongoDB: 90,
      PostgreSQL: 85,
      Redis: 82,
    },
  }

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

  const getWelcomeMessage = useCallback(() => {
    const asciiArt = `███╗   ███╗ █████╗ ██████╗ ██╗ ██████╗
████╗ ████║██╔══██╗██╔══██╗██║██╔═══██╗
██╔████╔██║███████║██████╔╝██║██║   ██║
██║╚██╔╝██║██╔══██║██╔══██╗██║██║   ██║
██║ ╚═╝ ██║██║  ██║██║  ██║██║╚██████╔╝
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ `

    const divider = '─────────────────────────────────────────────────'

    return wrapWithColor(asciiArt + '\n', '#d4843e') +
      wrapWithColor(divider + '\n', '#555555') +
      wrapWithColor('              Interactive Terminal Resume\n', '#888888') +
      wrapWithColor('         Software Engineer • Cloud Architect • Tech Lead\n', '#666666') +
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
  }, [])

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
      wrapWithColor('• about', '#98fb98') + '      ' + wrapWithColor('Display my professional summary\n', '#ffffff') +
      wrapWithColor('• skills', '#98fb98') + '     ' + wrapWithColor('View my technical expertise\n', '#ffffff') +
      wrapWithColor('• experience', '#98fb98') + ' ' + wrapWithColor('Show my work history\n', '#ffffff') +
      wrapWithColor('• education', '#98fb98') + '  ' + wrapWithColor('View my educational background\n', '#ffffff') +
      wrapWithColor('• contact', '#98fb98') + '    ' + wrapWithColor('Get my contact information\n', '#ffffff') +
      wrapWithColor('• clear', '#98fb98') + '      ' + wrapWithColor('Clear the terminal screen\n', '#ffffff')

    const utilityCommands = '\n' + wrapWithColor('Utility Commands:\n', '#00ffff') +
      wrapWithColor('• projects', '#98fb98') + '   ' + wrapWithColor('View my project showcase\n', '#ffffff') +
      wrapWithColor('• skills-visual', '#98fb98') + ' ' + wrapWithColor('Show skills visualization\n', '#ffffff') +
      wrapWithColor('• game', '#98fb98') + '       ' + wrapWithColor('Play Snake mini-game\n', '#ffffff') +
      wrapWithColor('• exit-game', '#98fb98') + '  ' + wrapWithColor('Exit the game\n', '#ffffff') +
      wrapWithColor('• matrix', '#98fb98') + '     ' + wrapWithColor('Start Matrix digital rain effect\n', '#ffffff') +
      wrapWithColor('• stop-matrix', '#98fb98') + '' + wrapWithColor(' Stop Matrix effect\n', '#ffffff') +
      wrapWithColor('• weather', '#98fb98') + '    ' + wrapWithColor('Check weather (usage: weather [city])\n', '#ffffff') +
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

${wrapWithColor('┌─────────────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Senior software engineer with more than 10 years of', '#ffffff')}
${wrapWithColor('│', accent)} ${wrapWithColor('programming experience.', '#ffffff')}
${wrapWithColor('└─────────────────────────────────────────────────────────┘', accent)}

${wrapWithColor('⚡ Experience', accent)}
${wrapWithColor('   Building scalable and efficient software solutions using', '#ffffff')}
${wrapWithColor('   React, JavaScript, and Google Cloud', accent)}

${wrapWithColor('⚡ Passion', accent)}
${wrapWithColor('   Transforming innovative ideas into high-quality applications', '#ffffff')}
${wrapWithColor('   with elegant and efficient implementations', '#ffffff')}

${wrapWithColor('⚡ Strengths', accent)}
${wrapWithColor('   Strong team player with expertise in designing robust,', '#ffffff')}
${wrapWithColor('   high-performance systems', '#ffffff')}

${wrapWithColor('╭───────────────────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Ready to bring your innovative ideas to life!', '#ffffff')} ${wrapWithColor('│', accent)}
${wrapWithColor('╰───────────────────────────────────────────────────────╯', accent)}`
  }

  const getSkillsText = () => {
    return `<span style="color: #ffff00; font-weight: bold;">🛠️ PROGRAMMING</span>

• <i class="fab fa-js" style="color: #f7df1e; margin-right: 8px;"></i> ${wrapWithColor('Typescript', '#ffffff')}
• <i class="fab fa-python" style="color: #3776ab; margin-right: 8px;"></i> ${wrapWithColor('Python', '#ffffff')}
• <i class="fab fa-js-square" style="color: #f7df1e; margin-right: 8px;"></i> ${wrapWithColor('Javascript', '#ffffff')}
• <i class="fab fa-node" style="color: #339933; margin-right: 8px;"></i> ${wrapWithColor('Node', '#ffffff')}
• <i class="fab fa-react" style="color: #61dafb; margin-right: 8px;"></i> ${wrapWithColor('React', '#ffffff')}
• <i class="fab fa-angular" style="color: #dd0031; margin-right: 8px;"></i> ${wrapWithColor('Angular', '#ffffff')}
• <i class="fab fa-google" style="color: #4285f4; margin-right: 8px;"></i> ${wrapWithColor('Google Cloud', '#ffffff')}
• <i class="fab fa-aws" style="color: #ff9900; margin-right: 8px;"></i> ${wrapWithColor('AWS', '#ffffff')}
• <i class="fab fa-microsoft" style="color: #00a4ef; margin-right: 8px;"></i> ${wrapWithColor('Azure', '#ffffff')}
• <i class="fab fa-docker" style="color: #2496ed; margin-right: 8px;"></i> ${wrapWithColor('Docker', '#ffffff')}
• <i class="fas fa-cubes" style="color: #7b42bc; margin-right: 8px;"></i> ${wrapWithColor('Terraform', '#ffffff')}
• <i class="fas fa-dharmachakra" style="color: #326ce5; margin-right: 8px;"></i> ${wrapWithColor('Kubernetes', '#ffffff')}
• <i class="fab fa-java" style="color: #f89820; margin-right: 8px;"></i> ${wrapWithColor('Java', '#ffffff')}
• <i class="fas fa-code" style="color: #7f52ff; margin-right: 8px;"></i> ${wrapWithColor('Kotlin', '#ffffff')}
• <i class="fas fa-leaf" style="color: #47a248; margin-right: 8px;"></i> ${wrapWithColor('MongoDB', '#ffffff')}
• <i class="fas fa-database" style="color: #4db33d; margin-right: 8px;"></i> ${wrapWithColor('RethinkDB', '#ffffff')}
• <i class="fas fa-vial" style="color: #c21325; margin-right: 8px;"></i> ${wrapWithColor('Jest', '#ffffff')}
• <i class="fas fa-search" style="color: #00bfb3; margin-right: 8px;"></i> ${wrapWithColor('ElasticSearch', '#ffffff')}
• <i class="fas fa-project-diagram" style="color: #e10098; margin-right: 8px;"></i> ${wrapWithColor('GraphQL', '#ffffff')}
• <i class="fas fa-server" style="color: #68a063; margin-right: 8px;"></i> ${wrapWithColor('Express', '#ffffff')}
• <i class="fas fa-database" style="color: #dc382d; margin-right: 8px;"></i> ${wrapWithColor('Redis', '#ffffff')}
• <i class="fas fa-database" style="color: #00758f; margin-right: 8px;"></i> ${wrapWithColor('SQL', '#ffffff')}
• <i class="fab fa-html5" style="color: #e34f26; margin-right: 8px;"></i> ${wrapWithColor('HTML', '#ffffff')}
• <i class="fab fa-css3-alt" style="color: #1572b6; margin-right: 8px;"></i> ${wrapWithColor('CSS', '#ffffff')}`
  }

  const getExperienceText = () => {
    return `<span style="color: #ffff00; font-weight: bold;">💼 Professional Experience</span>

<span style="color: #00ffff;">UNICEPTA | Senior Software Engineer</span>
${wrapWithColor('Jul 2020 - Present | Cologne, Germany | 450+ employees', '#ffffff')}
${wrapWithColor('Visionary, AI-powered Media & Data Intelligence Solutions', '#98fb98')}

• ${wrapWithColor('Part of Core team', '#ffa07a')} - ${wrapWithColor('Architect and part of every decision.', '#ffffff')}
• ${wrapWithColor('Microservices engineer', '#ffa07a')} - ${wrapWithColor('Designed and build services for distributed system', '#ffffff')}
• ${wrapWithColor('Pipeline engineer', '#ffa07a')} - ${wrapWithColor('Google cloud engineer for data pipeline', '#ffffff')}
• ${wrapWithColor('Fullstack engineer', '#ffa07a')} - ${wrapWithColor('Wrote and reviewed code for front/back/cloud.', '#ffffff')}

${wrapWithColor('Technologies used:', '#00ffff')} ${wrapWithColor('Typescript, React, NodeJs, Poetry, PyTest, ReactJS, Jest, Cypress, ES6, ElasticSearch, Google Cloud, JIRA, Firebase, Kubernetes, Data Flow', '#87cefa')}

<span style="color: #00ffff;">RITECH SOLUTIONS | Senior Software Engineer</span>
${wrapWithColor('Jul 2018 – Jul 2020 | Tirana, Albania | 100-150 employees', '#ffffff')}

• ${wrapWithColor('Part of Core team', '#ffa07a')} - ${wrapWithColor('Team that leads company tech decisions', '#ffffff')}
• ${wrapWithColor('Tech interviewer', '#ffa07a')} - ${wrapWithColor('Interview potential candidates.', '#ffffff')}
• ${wrapWithColor('Microsoft project', '#ffa07a')} - ${wrapWithColor('IOT marketing project in every Microsoft store.', '#ffffff')}
• ${wrapWithColor('AppriseMobile Tech Lead', '#ffa07a')} - ${wrapWithColor('CRM for Toyota and corporates in USA', '#ffffff')}

${wrapWithColor('Technologies used:', '#00ffff')} ${wrapWithColor('JavaScript, Python, pandas, NodeJs, ReactJS, Chai, Sinon, Mocha, ES6, ElasticSearch, Redis, Nginx, Gulp, JIRA, Docker, Azure, AWS, MongoDB', '#87cefa')}

<span style="color: #00ffff;">GUTENBERG TECHNOLOGY | Software Engineering</span>
${wrapWithColor('Feb 2017 – Aug 2018 | Paris, France | 50-100 employees', '#ffffff')}

• ${wrapWithColor('Fullstack developer', '#ffa07a')} - ${wrapWithColor('Frontend and backend (real-time publisher platform) used by National Geographics, IUBH, Fujitsu', '#ffffff')}
• ${wrapWithColor('MEFIO developer', '#ffa07a')} - ${wrapWithColor('Highly available publisher platform', '#ffffff')}
• ${wrapWithColor('SaaS developer', '#ffa07a')} - ${wrapWithColor('Integrated strategy to migrate from manual sales to SaaS', '#ffffff')}

${wrapWithColor('Technologies used:', '#00ffff')} ${wrapWithColor('Python, ES6, ElasticSearch, Redis, Nginx, npm, Gulp, JIRA, Docker, AWS S3, RethinkDB, ReactJS, NodeJS, AngularJS, JavaScript', '#87cefa')}

<span style="color: #00ffff;">GROUP OF COMPANIES | Software Engineer</span>
${wrapWithColor('Mar 2015 – Feb 2017 | Tirana, Albania | 5-30 employees', '#ffffff')}

• ${wrapWithColor('Software developer', '#ffa07a')} - ${wrapWithColor('Developed web and native projects', '#ffffff')}
• ${wrapWithColor('Bar management app', '#ffa07a')} - ${wrapWithColor('Developed app for bar/restaurant management.', '#ffffff')}
• ${wrapWithColor('Bank system optimisation', '#ffa07a')} - ${wrapWithColor('Optimised aggregation from 11h to 1h', '#ffffff')}

${wrapWithColor('Technologies used:', '#00ffff')} ${wrapWithColor('Typescript, Python, Gulp, Docker, MongoDB, ReactJS, NodeJs, AngularJS, JavaScript, Java', '#87cefa')}`
  }

  const getEducationText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">🎓 Education</span>

${wrapWithColor('┌──────────────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' Bachelor of Computer Science ', '#ffffff')}${wrapWithColor('│', accent)}
${wrapWithColor('└──────────────────────────────────────────────────┘', accent)}

${wrapWithColor('🏛️ Institution:', accent)} ${wrapWithColor('University of Tirana', '#ffffff')}
${wrapWithColor('📅 Duration:', accent)}    ${wrapWithColor('2013 - 2016', '#ffffff')}
${wrapWithColor('📍 Location:', accent)}    ${wrapWithColor('Tirana, Albania', '#ffffff')}

${wrapWithColor('╭──────────────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)}${wrapWithColor(' Foundation of my software engineering journey ', '#ffffff')}${wrapWithColor('│', accent)}
${wrapWithColor('╰──────────────────────────────────────────────────╯', accent)}`
  }

  const getContactText = () => {
    const accent = themeColors[theme].accent
    return `<span style="color: ${accent}; font-weight: bold;">📫 Contact Information</span>

${wrapWithColor('┌────────────────────────────────────────┐', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor("Let's connect and create something great!", '#ffffff')} ${wrapWithColor('│', accent)}
${wrapWithColor('└────────────────────────────────────────┘', accent)}

${wrapWithColor('✉', accent)}  ${wrapWithColor('Email:', accent)} ${wrapWithColor('<a href="mailto:marjoballabani@gmail.com" style="color: #ffffff; text-decoration: none;">marjoballabani@gmail.com</a>', '#ffffff')}

${wrapWithColor('🌐', accent)}  ${wrapWithColor('Website:', accent)} ${wrapWithColor('<a href="https://marjoballabani.me" target="_blank" style="color: #ffffff; text-decoration: none;">marjoballabani.me</a>', '#ffffff')}

${wrapWithColor('⚡', accent)}  ${wrapWithColor('Github:', accent)} ${wrapWithColor('<a href="https://github.com/marjoballabani" target="_blank" style="color: #ffffff; text-decoration: none;">github.com/marjoballabani</a>', '#ffffff')}

${wrapWithColor('💼', accent)}  ${wrapWithColor('LinkedIn:', accent)} ${wrapWithColor('<a href="https://linkedin.com/in/marjo-ballabani" target="_blank" style="color: #ffffff; text-decoration: none;">linkedin.com/in/marjo-ballabani</a>', '#ffffff')}

${wrapWithColor('╭────────────────────────────────────────╮', accent)}
${wrapWithColor('│', accent)} ${wrapWithColor('Feel free to reach out for opportunities!', '#ffffff')} ${wrapWithColor('│', accent)}
${wrapWithColor('╰────────────────────────────────────────╯', accent)}`
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
  const showWeather = async (location: string, terminalId: string) => {
    if (!location) {
      addOutput(terminalId, "Please specify a location. Usage: weather [city name]", 'error')
      return
    }

    addOutput(terminalId, `Fetching weather for ${location}...`, 'info')

    try {
      const apiKey = '4331a27995f4c5b5e8d1eab1ed3d88b4'
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&appid=${apiKey}&units=metric`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()

      const weatherHTML = `<div class="weather-container">
        <div class="weather-header">
          <span style="color: #ffff00; font-weight: bold;">🌤️ Weather for ${data.name}, ${data.sys.country}</span>
        </div>
        <div class="weather-body">
          <div class="weather-main">
            <span style="font-size: 2rem; color: #ffffff;">${Math.round(data.main.temp)}°C</span>
            <span style="color: #cccccc;">${data.weather[0].main}</span>
          </div>
          <div class="weather-details">
            <div><span style="color: #87cefa;">Feels like:</span> ${Math.round(data.main.feels_like)}°C</div>
            <div><span style="color: #87cefa;">Humidity:</span> ${data.main.humidity}%</div>
            <div><span style="color: #87cefa;">Wind:</span> ${Math.round(data.wind.speed * 3.6)} km/h</div>
          </div>
        </div>
      </div>`

      addOutput(terminalId, weatherHTML)
    } catch {
      addOutput(terminalId, `Failed to fetch weather data. Please check the city name.`, 'error')
    }
  }

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
      case 'clear':
        clearTerminalOutput(terminalId)
        break
      case 'projects':
        setShowProjectsModal(true)
        break
      case 'skills-visual':
        setShowSkillsModal(true)
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
      case 'weather':
        showWeather(args.join(' '), terminalId)
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
    const commands = ['help', 'about', 'skills', 'experience', 'education', 'contact', 'clear', 'projects', 'skills-visual', 'game', 'exit-game', 'matrix', 'stop-matrix', 'weather', 'calc']

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
      
      <div className={`terminal-page theme-${theme}`}>
        <div className="terminal">
          {/* Header */}
          <div className="terminal-header">
            <div className="terminal-buttons">
              <span className="close"></span>
              <span className="minimize"></span>
              <span className="maximize"></span>
            </div>
            <div className="terminal-title">marjo@ballabani: ~/resume</div>
            <div className="terminal-controls">
              <div className="theme-selector" onClick={() => setShowThemeModal(true)}>
                <i className="fa-solid fa-palette" id="theme-toggle"></i>
              </div>
              <div className="language-selector" style={{ display: 'none' }} onClick={() => setShowLanguageModal(true)}>
                <i className="fa-solid fa-globe" id="language-toggle"></i>
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

        {/* Language Modal */}
        <div className={`modal ${showLanguageModal ? 'active' : ''}`} onClick={() => setShowLanguageModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setShowLanguageModal(false)}>&times;</span>
            <h2>Select Language</h2>
            <div className="language-options">
              <div className="language-option" data-lang="en">English</div>
              <div className="language-option" data-lang="de">Deutsch</div>
              <div className="language-option" data-lang="fr">Français</div>
              <div className="language-option" data-lang="sq">Albanian</div>
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
                  <img src={project.image} alt={project.title} className="project-image" />
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
                      <a href={project.repo} className="project-link" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-github"></i> Repository
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skills Modal */}
        <div className={`modal ${showSkillsModal ? 'active' : ''}`} onClick={() => setShowSkillsModal(false)}>
          <div className="modal-content skills-modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={() => setShowSkillsModal(false)}>&times;</span>
            <h2>Skills Visualization</h2>
            <div className="skills-container">
              {Object.entries(skillsData).map(([category, skills]) => (
                <div key={category} className="skill-category">
                  <h3 className="skill-category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h3>
                  <div className="skill-bars">
                    {Object.entries(skills).map(([skill, level]) => (
                      <div key={skill} className="skill-item">
                        <div className="skill-info">
                          <span className="skill-name">{skill}</span>
                          <span className="skill-level">{level}%</span>
                        </div>
                        <div className="skill-progress">
                          <div className="skill-progress-bar" style={{ width: `${level}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
