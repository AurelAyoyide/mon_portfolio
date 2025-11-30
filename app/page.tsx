'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faMoon, faSun, faMapMarkerAlt, faTerminal, faEnvelope,
  faCode, faCloud, faDatabase, faTools, faSitemap, faUsersCog,
  faServer, faCube, faCogs, faFire, faCheckCircle, faStream,
  faPalette, faMobileAlt, faMobile, faBolt, faNetworkWired,
  faDharmachakra, faCodeBranch, faPlay, faLeaf, faMemory,
  faSearch, faProjectDiagram, faChartLine, faVial, faTasks,
  faCubes, faExchangeAlt, faRoute, faInbox, faSyncAlt, faUsers
} from '@fortawesome/free-solid-svg-icons'
import { 
  faGithub, faLinkedin, faStackOverflow, faReact, faNodeJs, 
  faPython, faJs, faHtml5, faCss3, faGoogle, faDocker,
  faAngular, faBootstrap, faAws, faMicrosoft, faGitAlt, 
  faJira, faJava
} from '@fortawesome/free-brands-svg-icons'

// Dynamic import for Leaflet (client-side only)
const JourneyMap = dynamic(() => import('./components/JourneyMap'), {
  ssr: false,
  loading: () => (
    <div className="map-loading" style={{ 
      width: '100%', 
      height: '400px', 
      background: 'var(--paper)', 
      border: '3px solid var(--border)',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Space Mono, monospace'
    }}>
      🗺️ Loading map...
    </div>
  )
})

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [theme, setTheme] = useState('light')
  const [greeting, setGreeting] = useState('')
  const [navHidden, setNavHidden] = useState(false)
  const [photoTilted, setPhotoTilted] = useState(true)
  const [terminalFalling, setTerminalFalling] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeCheckpoint, setActiveCheckpoint] = useState(0)
  
  const hasScrolledRef = useRef(false)
  const heroPhotoRef = useRef<HTMLImageElement>(null)
  const decoTerminalRef = useRef<HTMLDivElement>(null)
  const heroContentRef = useRef<HTMLDivElement>(null)
  const pageGapRef = useRef<HTMLDivElement>(null)
  const paperTearBottomRef = useRef<HTMLDivElement>(null)
  const tearTapeStickerRef = useRef<HTMLDivElement>(null)
  const lastScrollRef = useRef(0)

  // Mark component as mounted (client-side only)
  useEffect(() => {
    setMounted(true)
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light'
    setTheme(savedTheme)
    document.body.setAttribute('data-theme', savedTheme)
    
    // Set initial tilt state
    hasScrolledRef.current = true
  }, [])

  // Always start at top of page on reload
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
  }, [])

  // Loading screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  // Matrix typing effect
  useEffect(() => {
    const finalText = 'Hi there! 👋'
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let iterations = 0

    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        const newText = finalText
          .split('')
          .map((char, index) => {
            if (index < iterations) return finalText[index]
            if (char === ' ' || char === '👋') return char
            return chars[Math.floor(Math.random() * chars.length)]
          })
          .join('')
        
        setGreeting(newText)
        
        if (iterations >= finalText.length) {
          clearInterval(interval)
        }
        iterations += 1/3
      }, 50)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  // Calculate fall distance for terminal SVG
  useEffect(() => {
    const calculateFallDistance = () => {
      if (heroContentRef.current && decoTerminalRef.current) {
        const heroRect = heroContentRef.current.getBoundingClientRect()
        const terminalRect = decoTerminalRef.current.getBoundingClientRect()
        const fallDistance = Math.max(0, heroRect.bottom - terminalRect.bottom - 50)
        decoTerminalRef.current.style.setProperty('--fall-distance', `${fallDistance}px`)
      }
    }
    
    calculateFallDistance()
    window.addEventListener('resize', calculateFallDistance)
    return () => window.removeEventListener('resize', calculateFallDistance)
  }, [])

  // Initialize journey timeline book flip
  useEffect(() => {
    if (!mounted || isLoading) return
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const timeline = document.querySelector('.journey-timeline') as HTMLElement
      const timelineBack = document.querySelector('.journey-timeline-back') as HTMLElement
      
      if (timeline && timelineBack && window.innerWidth >= 769) {
        // Initial state - book closed, showing map (back)
        timeline.style.transform = 'rotateY(180deg)'
        timelineBack.style.transform = 'rotateY(180deg)'
        timeline.style.zIndex = '1'
        timelineBack.style.zIndex = '100'
        timeline.style.overflowY = 'hidden'
      }
    })
  }, [mounted, isLoading])

  // Scroll handlers
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      
      // Progress bar
      const progressPercent = (scrollY / documentHeight) * 100
      setProgress(progressPercent)
      
      // Navbar hide/show
      if (scrollY > lastScrollRef.current && scrollY > 100) {
        setNavHidden(true)
      } else if (scrollY < lastScrollRef.current) {
        setNavHidden(false)
      }
      lastScrollRef.current = scrollY
      
      // Photo tilt
      if (!hasScrolledRef.current && scrollY > 5) {
        hasScrolledRef.current = true
        setPhotoTilted(true)
      }
      
      // Terminal fall
      if (!terminalFalling && scrollY > 5) {
        setTerminalFalling(true)
      }
      
      // Paper tear parallax (desktop only)
      if (window.innerWidth > 768) {
        updateGapParallax(scrollY)
      }
      
      // Checkpoint updates
      const sections = ['hero', 'about', 'experience', 'skills', 'contact']
      let active = 0
      sections.forEach((sectionId, index) => {
        const section = document.getElementById(sectionId)
        if (section) {
          const rect = section.getBoundingClientRect()
          if (rect.top <= windowHeight / 2 && rect.bottom >= windowHeight / 2) {
            active = index
          }
        }
      })
      setActiveCheckpoint(active)
      
      // Highlight animations
      updateHighlights(scrollY)
      
      // Language stars animation
      updateLanguageStars(scrollY)
      
      // Journey book flip
      updateJourneyTimeline(scrollY)
    }

    window.addEventListener('scroll', handleScroll)
    
    // Initialize on mount
    requestAnimationFrame(() => {
      if (window.innerWidth > 768) {
        updateGapParallax(window.scrollY)
      }
    })
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [photoTilted, terminalFalling])

  // Intersection Observer for fade-in animations
  useEffect(() => {
    if (!mounted || isLoading) return

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.section, .timeline-item, .skill-box, .education-card, .languages-card').forEach(el => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [mounted, isLoading])

  const updateGapParallax = (scrollY: number) => {
    const pageGap = pageGapRef.current
    const paperTearBottom = paperTearBottomRef.current
    const tearTapeSticker = tearTapeStickerRef.current
    const paperTearBottomBgGray = paperTearBottom?.querySelector('svg path[fill="#d0d0d0"]') as SVGPathElement | null
    
    if (!pageGap || !paperTearBottom) return
    
    // Update tape position to follow paper tear
    if (tearTapeSticker) {
      const rect = paperTearBottom.getBoundingClientRect()
      tearTapeSticker.style.setProperty('--tape-position', `${rect.top}px`)
    }
    
    const initialGapHeight = 300
    const minGapHeight = -30
    const scrollStart = 100
    const scrollRange = 200
    const stickerDelay = 30
    const stickerStart = scrollStart + scrollRange + stickerDelay
    const stickerRange = 60

    if (scrollY <= scrollStart) {
      pageGap.style.height = initialGapHeight + 'px'
      paperTearBottom.style.marginTop = '0px'
      if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '1'
      if (tearTapeSticker) {
        tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-40px) translateZ(30px) rotateX(35deg)'
        tearTapeSticker.style.opacity = '0'
      }
    } else if (scrollY > scrollStart && scrollY <= scrollStart + scrollRange) {
      const prog = (scrollY - scrollStart) / scrollRange
      const currentHeight = initialGapHeight - (initialGapHeight - minGapHeight) * prog
      
      if (currentHeight >= 0) {
        pageGap.style.height = currentHeight + 'px'
        paperTearBottom.style.marginTop = '0px'
        if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '1'
        if (tearTapeSticker) {
          tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-100px) translateZ(50px) rotateX(45deg)'
          tearTapeSticker.style.opacity = '0'
        }
      } else {
        // Negative margin starts - fade background
        pageGap.style.height = '0px'
        paperTearBottom.style.marginTop = currentHeight + 'px'
        
        // Fade based on negative margin progress
        const negativePart = Math.abs(minGapHeight)
        const negativeProgress = Math.abs(currentHeight) / negativePart
        const opacity = 1 - negativeProgress
        
        if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = String(opacity)
        if (tearTapeSticker) {
          tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-100px) translateZ(50px) rotateX(45deg)'
          tearTapeSticker.style.opacity = '0'
        }
      }
    } else if (scrollY > stickerStart && scrollY < stickerStart + stickerRange) {
      // Sticker animation in progress
      pageGap.style.height = '0px'
      paperTearBottom.style.marginTop = minGapHeight + 'px'
      if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0'
      
      if (tearTapeSticker) {
        const stickerProgress = (scrollY - stickerStart) / stickerRange
        
        // Interpolate transform values based on progress
        const translateY = -40 + (40 * stickerProgress)
        const translateZ = 30 - (30 * stickerProgress)
        const rotateX = 35 - (35 * stickerProgress)
        const opacityVal = Math.min(1, Math.max(0, (stickerProgress - 0.35) * 1.54))
        
        tearTapeSticker.style.transform = `rotate(-8deg) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg)`
        tearTapeSticker.style.opacity = String(opacityVal)
      }
    } else if (scrollY >= stickerStart + stickerRange) {
      // Sticker fully stuck
      pageGap.style.height = '0px'
      paperTearBottom.style.marginTop = minGapHeight + 'px'
      if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0'
      
      if (tearTapeSticker) {
        tearTapeSticker.style.transform = 'rotate(-8deg) translateY(0px) translateZ(0px) rotateX(0deg)'
        tearTapeSticker.style.opacity = '1'
      }
    } else {
      // Between gap close and sticker start
      pageGap.style.height = '0px'
      paperTearBottom.style.marginTop = minGapHeight + 'px'
      if (paperTearBottomBgGray) paperTearBottomBgGray.style.opacity = '0'
      if (tearTapeSticker) {
        tearTapeSticker.style.transform = 'rotate(-8deg) translateY(-40px) translateZ(30px) rotateX(35deg)'
        tearTapeSticker.style.opacity = '0'
      }
    }
  }

  const updateHighlights = (scrollY: number) => {
    const highlights = document.querySelectorAll('.highlight')
    const windowHeight = window.innerHeight
    
    highlights.forEach((highlight) => {
      const rect = highlight.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const triggerPoint = scrollY + windowHeight * 0.8
      
      const el = highlight as HTMLElement
      const started = el.dataset.started === 'true'
      const startScroll = parseFloat(el.dataset.startScroll || '0')
      
      if (!started && triggerPoint >= elementTop) {
        el.dataset.started = 'true'
        el.dataset.startScroll = String(scrollY)
      }
      
      if (el.dataset.started === 'true') {
        const prog = Math.min(1, Math.max(0, (scrollY - parseFloat(el.dataset.startScroll || '0')) / 100))
        el.style.setProperty('--highlight-progress', `${prog * 100}%`)
      }
      
      // Reset when scrolling back up past element
      if (started && scrollY < startScroll - 50) {
        el.dataset.started = 'false'
        el.style.setProperty('--highlight-progress', '0%')
      }
    })
  }

  const updateLanguageStars = (scrollY: number) => {
    const languageItems = document.querySelectorAll('.language-item')
    const windowHeight = window.innerHeight
    
    languageItems.forEach((item) => {
      const rect = item.getBoundingClientRect()
      const elementTop = rect.top + scrollY
      const triggerPoint = scrollY + windowHeight * 0.8
      const el = item as HTMLElement
      
      if (triggerPoint >= elementTop) {
        const stars = el.querySelectorAll('.star')
        stars.forEach((star, index) => {
          setTimeout(() => {
            star.classList.add('visible')
          }, index * 150)
        })
      }
    })
  }

  const updateJourneyTimeline = (scrollY: number) => {
    if (window.innerWidth < 769) return
    
    const timeline = document.querySelector('.journey-timeline') as HTMLElement
    const timelineBack = document.querySelector('.journey-timeline-back') as HTMLElement
    
    if (!timeline || !timelineBack) return
    
    const rect = timeline.getBoundingClientRect()
    const elementTop = rect.top + scrollY
    const windowHeight = window.innerHeight
    const triggerPoint = scrollY + windowHeight * 0.5
    
    const started = timeline.dataset.started === 'true'
    const startScroll = parseFloat(timeline.dataset.startScroll || '0')
    
    if (!started && triggerPoint >= elementTop) {
      timeline.dataset.started = 'true'
      timeline.dataset.startScroll = String(scrollY)
    }
    
    // Reset when scrolling back up past element
    if (started && scrollY < startScroll - 50) {
      timeline.dataset.started = 'false'
      timeline.style.transform = 'rotateY(180deg)'
      timelineBack.style.transform = 'rotateY(180deg)'
      timeline.style.zIndex = '1'
      timelineBack.style.zIndex = '100'
      timeline.style.overflowY = 'hidden'
      return
    }
    
    if (timeline.dataset.started === 'true') {
      const prog = Math.min(1, Math.max(0, (scrollY - parseFloat(timeline.dataset.startScroll || '0')) / 200))
      const rotateY = 180 - (180 * prog)
      
      timeline.style.transform = `rotateY(${rotateY}deg)`
      timelineBack.style.transform = `rotateY(${rotateY}deg)`
      
      if (rotateY > 95) {
        timeline.style.zIndex = '1'
        timelineBack.style.zIndex = '100'
      } else {
        timeline.style.zIndex = '100'
        timelineBack.style.zIndex = '1'
      }
      
      timeline.style.overflowY = prog >= 1 ? 'auto' : 'hidden'
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.body.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const experiences = [
    {
      id: 'exp-1',
      country: 'Germany',
      title: 'Senior Software Engineer @ Unicepta',
      date: 'Jul 2020 - Nov 2025',
      description: 'Part of Core team working on AI-powered Media & Data Intelligence Solutions. Designed and built microservices for distributed systems, engineered data pipelines on Google Cloud, and wrote full-stack code for front/back/cloud.',
      location: 'Cologne, Germany (Hybrid)'
    },
    {
      id: 'exp-2',
      country: 'Albania',
      title: 'Senior Software Engineer @ Ritech Solutions',
      date: 'Jul 2018 - Jul 2020',
      description: 'Part of Core team leading tech decisions. Led AppriseMobile CRM for Toyota and Microsoft IOT marketing project deployed across USA, Canada, and Australia.',
      location: 'Tirana, Albania'
    },
    {
      id: 'exp-3',
      country: 'France',
      title: 'Software Engineer @ Gutenberg Technology',
      date: 'Feb 2017 - Aug 2018',
      description: 'Fullstack developer building real-time publisher platform used by National Geographic, IUBH, and Fujitsu. Developed highly available MEFIO platform and integrated SaaS strategy.',
      location: 'Paris, France'
    },
    {
      id: 'exp-4',
      country: 'Albania',
      title: 'Software Engineer @ Group of Companies',
      date: 'Mar 2015 - Feb 2017',
      description: 'Developed bar/restaurant management app, optimized bank system aggregation from 11h to 1h, and built water supply billing process for Albania government project.',
      location: 'Tirana, Albania'
    }
  ]

  // Function to get icon for each technology tag
  const getTagIcon = (tag: string) => {
    const iconMap: { [key: string]: any } = {
      // Frontend
      'React.js': faReact,
      'Redux': faDatabase,
      'MobX': faDatabase,
      'Angular': faAngular,
      'Bootstrap': faBootstrap,
      'Material-UI': faPalette,
      'React Native': faMobileAlt,
      'Ionic': faMobile,
      
      // Languages
      'JavaScript': faJs,
      'TypeScript': faJs,
      'Python': faPython,
      'Java': faJava,
      'Kotlin': faCode,
      'SQL': faDatabase,
      'HTML': faHtml5,
      'CSS': faCss3,
      
      // Backend
      'Node.js': faNodeJs,
      'Express.js': faServer,
      'Hapi': faServer,
      'Firebase': faFire,
      'Cloud Functions': faBolt,
      'AWS Lambda': faAws,
      'AWS S3': faCube,
      'NGINX': faNetworkWired,
      
      // Cloud & DevOps
      'Google Cloud': faGoogle,
      'AWS': faAws,
      'Azure': faMicrosoft,
      'Docker': faDocker,
      'Kubernetes': faDharmachakra,
      'Terraform': faCodeBranch,
      'Cloud Run': faPlay,
      
      // Databases
      'MongoDB': faLeaf,
      'Firestore': faFire,
      'RethinkDB': faDatabase,
      'Redis': faMemory,
      'PostgreSQL': faDatabase,
      'SQL Server': faServer,
      'BigQuery': faGoogle,
      
      // Tools
      'Git': faGitAlt,
      'Elasticsearch': faSearch,
      'GraphQL': faProjectDiagram,
      'pandas': faChartLine,
      'Jest': faVial,
      'Cypress': faVial,
      'Jira': faTasks,
      'VSCode': faCode,
      
      // Architecture
      'Microservices': faCubes,
      'SaaS': faCloud,
      'Pub/Sub': faExchangeAlt,
      'Routing Slip': faRoute,
      'Dead Letter Queues': faInbox,
      
      // Methodologies
      'Agile': faSyncAlt,
      'Scrum': faUsers,
      'CI/CD': faCodeBranch,
      'TDD': faVial
    }
    
    return iconMap[tag] || faCode // Default icon if not found
  }

  const skills = [
    {
      icon: faReact,
      title: 'Frontend',
      tags: ['React.js', 'Redux', 'MobX', 'Angular', 'Bootstrap', 'Material-UI', 'React Native', 'Ionic']
    },
    {
      icon: faCode,
      title: 'Languages',
      tags: ['JavaScript', 'TypeScript', 'Python', 'Java', 'Kotlin', 'SQL', 'HTML', 'CSS']
    },
    {
      icon: faNodeJs,
      title: 'Backend',
      tags: ['Node.js', 'Express.js', 'Hapi', 'Firebase', 'Cloud Functions', 'AWS Lambda', 'AWS S3', 'NGINX']
    },
    {
      icon: faCloud,
      title: 'Cloud & DevOps',
      tags: ['Google Cloud', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'Cloud Run']
    },
    {
      icon: faDatabase,
      title: 'Databases',
      tags: ['MongoDB', 'Firestore', 'RethinkDB', 'Redis', 'PostgreSQL', 'SQL Server', 'BigQuery']
    },
    {
      icon: faTools,
      title: 'Tools & More',
      tags: ['Git', 'Elasticsearch', 'GraphQL', 'pandas', 'Jest', 'Cypress', 'Jira', 'VSCode']
    },
    {
      icon: faSitemap,
      title: 'Architecture',
      tags: ['Microservices', 'SaaS', 'Pub/Sub', 'Routing Slip', 'Dead Letter Queues'],
      highlight: true
    },
    {
      icon: faUsersCog,
      title: 'Methodologies',
      tags: ['Agile', 'Scrum', 'CI/CD', 'TDD'],
      highlight: true
    }
  ]

  const languages = [
    { name: 'Albanian', stars: 3 },
    { name: 'English', stars: 3 },
    { name: 'German', stars: 2 },
    { name: 'Italian', stars: 1 }
  ]

  return (
    <>
      {/* Loading Screen */}
      <div className={`loader-overlay ${!isLoading ? 'hidden' : ''}`}>
        <div className="loader-shapes">
          <div className="loader-shape-svg loader-shape-1">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <rect x="6" y="6" width="88" height="88" rx="8" fill="#66d9ef" stroke="#000" strokeWidth="4"/>
              <rect x="3" y="3" width="88" height="88" rx="8" fill="#66d9ef" stroke="#000" strokeWidth="4"/>
              <path d="M35 40 L20 50 L35 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M65 40 L80 50 L65 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="55" y1="35" x2="45" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="loader-shape-svg loader-shape-2">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <rect x="6" y="6" width="88" height="88" rx="8" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
              <rect x="3" y="3" width="88" height="88" rx="8" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
              <path d="M25 35 L40 50 L25 65" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="50" y1="65" x2="75" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="loader-shape-svg loader-shape-3">
            <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
              <rect x="6" y="6" width="88" height="88" rx="8" fill="#a8e6cf" stroke="#000" strokeWidth="4"/>
              <rect x="3" y="3" width="88" height="88" rx="8" fill="#a8e6cf" stroke="#000" strokeWidth="4"/>
              <rect x="20" y="20" width="60" height="60" rx="3" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
              <rect x="30" y="20" width="40" height="20" fill="#66d9ef" stroke="#000" strokeWidth="3"/>
              <rect x="35" y="55" width="30" height="15" rx="2" fill="#000"/>
              <circle cx="50" cy="35" r="3" fill="#000"/>
            </svg>
          </div>
        </div>
        <div className="loader-wrapper">
          <div className="loader-letter">M</div>
          <div className="loader-letter">B</div>
        </div>
        <div className="loader-progress-bar">
          <div className="loader-progress-fill"></div>
        </div>
      </div>

      <div className="page-wrapper">
        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
          <div className="progress-checkpoints">
            {['hero', 'about', 'experience', 'skills', 'contact'].map((section, index) => (
              <div 
                key={section}
                className={`checkpoint ${index <= activeCheckpoint ? 'active' : ''}`}
                onClick={() => scrollToSection(section)}
              >
                <div className="checkpoint-dot"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Navbar */}
        <nav className={`navbar ${navHidden ? 'navbar-hidden' : ''}`}>
          <div className="nav-content">
            <a href="#" className="nav-brand">MB</a>
            <div className="nav-right">
              <a href="#hero" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>Home</a>
              <a href="#about" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
              <a href="#experience" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); }}>Journey</a>
              <a href="#skills" className="nav-link" onClick={(e) => { e.preventDefault(); scrollToSection('skills'); }}>Skills</a>
              <a href="#contact" className="nav-cta" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Get in Touch!</a>
              <button className="theme-toggle-nav" onClick={toggleTheme} aria-label="Toggle theme">
                <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="hero" id="hero">
          <div className="hero-content" ref={heroContentRef}>
            <div className="hero-left">
              <p className="hero-greeting">{greeting || 'Hi there! 👋'}</p>
              <h1 className="hero-name">I&apos;m Marjo Ballabani.</h1>
              <p className="hero-description">
                Based in Munich, Germany, I&apos;m a Senior Software Engineer. I love to work with distributed systems, data pipelines, and cloud technologies. I&apos;m passionate about microservices, full-stack development, and building cool stuff.
              </p>
              <div className="hero-social">
                <a href="https://github.com/marjoballabani" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FontAwesomeIcon icon={faGithub} />
                </a>
                <a href="https://www.linkedin.com/in/marjo-ballabani/" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FontAwesomeIcon icon={faLinkedin} />
                </a>
                <a href="https://stackoverflow.com/users/7563517/marjo-ballabani" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FontAwesomeIcon icon={faStackOverflow} />
                </a>
              </div>
              <div className="hero-cta-container">
                <div className="coffee-cta-wrapper">
                  <div className="coffee-arrow">
                    <span className="coffee-arrow-text">Buy me a coffee</span>
                    <Image src="/image/arrow.png" alt="arrow" className="coffee-arrow-img" width={140} height={140} />
                  </div>
                  <a href="https://www.paypal.com/paypalme/Ballabani" target="_blank" rel="noopener noreferrer" className="btn-coffee">
                    <Image src="/image/caffe-icon.gif" alt="Coffee" className="coffee-icon-img" width={52} height={52} unoptimized />
                  </a>
                </div>
                <a href="#contact" className="btn-cta" onClick={(e) => { e.preventDefault(); scrollToSection('contact'); }}>Get in Touch!</a>
              </div>
            </div>
            <div className="hero-right">
              <div className="hero-image-wrapper">
                <div className="tape-sticker"></div>
                <Image 
                  ref={heroPhotoRef as any}
                  src="/image/avatar-gpt.png" 
                  alt="Marjo Ballabani" 
                  className={`hero-photo ${photoTilted ? 'tilted' : ''}`}
                  width={400} 
                  height={400}
                  priority
                  onMouseEnter={() => setPhotoTilted(false)}
                  onMouseLeave={() => hasScrolledRef.current && setPhotoTilted(true)}
                />
                <div className="deco-code">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <rect x="6" y="6" width="88" height="88" rx="8" fill="#66d9ef" stroke="#000" strokeWidth="4"/>
                    <rect x="3" y="3" width="88" height="88" rx="8" fill="#66d9ef" stroke="#000" strokeWidth="4"/>
                    <path d="M35 40 L20 50 L35 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M65 40 L80 50 L65 60" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="55" y1="35" x2="45" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div ref={decoTerminalRef} className={`deco-terminal ${terminalFalling ? 'falling' : ''}`}>
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <rect x="6" y="6" width="88" height="88" rx="8" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
                    <rect x="3" y="3" width="88" height="88" rx="8" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
                    <path d="M25 35 L40 50 L25 65" stroke="#000" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="50" y1="65" x2="75" y2="65" stroke="#000" strokeWidth="5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div className="deco-floppy">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                    <rect x="6" y="6" width="88" height="88" rx="8" fill="#a8e6cf" stroke="#000" strokeWidth="4"/>
                    <rect x="3" y="3" width="88" height="88" rx="8" fill="#a8e6cf" stroke="#000" strokeWidth="4"/>
                    <rect x="20" y="20" width="60" height="60" rx="3" fill="#ffd93d" stroke="#000" strokeWidth="4"/>
                    <rect x="30" y="20" width="40" height="20" fill="#66d9ef" stroke="#000" strokeWidth="3"/>
                    <rect x="35" y="55" width="30" height="15" rx="2" fill="#000"/>
                    <circle cx="50" cy="35" r="3" fill="#000"/>
                  </svg>
                </div>
                <div className="deco-label">Full-Stack Ninja</div>
              </div>
            </div>
          </div>
          <div className="tech-badges">
            <span className="tech-badge"><FontAwesomeIcon icon={faNodeJs} /> Node.js</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faReact} /> React</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faPython} /> Python</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faJs} /> JavaScript</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faHtml5} /> HTML</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faCss3} /> TypeScript</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faGoogle} /> Google Cloud</span>
            <span className="tech-badge"><FontAwesomeIcon icon={faDocker} /> Docker</span>
          </div>
        </section>

        {/* Paper Tear Top */}
        <div className="paper-tear paper-tear-top hidden md:block">
          <svg width="100%" height="30" viewBox="0 0 1440 30" preserveAspectRatio="none">
            <path d="M0,0 L0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15 L1440,0 Z" fill="#ffffff" stroke="none"/>
            <path d="M0,30 L0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15 L1440,30 Z" fill="#d0d0d0" stroke="none"/>
            <path d="M0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div ref={pageGapRef} className="page-gap hidden md:block" style={{ height: '300px' }}></div>

        <div ref={paperTearBottomRef} className="paper-tear paper-tear-bottom hidden md:block" style={{ marginTop: '-30px' }}>
          <svg width="100%" height="30" viewBox="0 0 1440 30" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 L0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15 L1440,0 Z" fill="#d0d0d0" stroke="none" style={{ opacity: 0 }}/>
            <path d="M0,30 L0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15 L1440,30 Z" fill="#ffffff" stroke="none"/>
            <path d="M0,15 Q10,5 20,15 T40,15 Q50,5 60,15 T80,15 Q90,20 100,15 T120,15 Q130,10 140,15 T160,15 Q170,5 180,15 T200,15 Q210,20 220,15 T240,15 Q250,8 260,15 T280,15 Q290,18 300,15 T320,15 Q330,5 340,15 T360,15 Q370,12 380,15 T400,15 Q410,20 420,15 T440,15 Q450,6 460,15 T480,15 Q490,16 500,15 T520,15 Q530,8 540,15 T560,15 Q570,20 580,15 T600,15 Q610,10 620,15 T640,15 Q650,5 660,15 T680,15 Q690,18 700,15 T720,15 Q730,12 740,15 T760,15 Q770,7 780,15 T800,15 Q810,20 820,15 T840,15 Q850,9 860,15 T880,15 Q890,14 900,15 T920,15 Q930,6 940,15 T960,15 Q970,19 980,15 T1000,15 Q1010,11 1020,15 T1040,15 Q1050,5 1060,15 T1080,15 Q1090,17 1100,15 T1120,15 Q1130,8 1140,15 T1160,15 Q1170,13 1180,15 T1200,15 Q1210,20 1220,15 T1240,15 Q1250,7 1260,15 T1280,15 Q1290,16 1300,15 T1320,15 Q1330,10 1340,15 T1360,15 Q1370,5 1380,15 T1400,15 Q1410,18 1420,15 T1440,15" fill="none" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <div ref={tearTapeStickerRef} className="tear-tape-sticker"></div>

        <div className="container">
          {/* About Section */}
          <section className="section fade-in" id="about">
            <h2 className="section-title">ABOUT</h2>
            <div className="card">
              <p className="text">
                Highly experienced and dynamic software engineer with a rich professional background spanning over <span className="highlight highlight-yellow" data-direction="left">11 years</span>.
                Throughout my career, I&apos;ve held positions in renowned tech companies across <span className="highlight highlight-pink" data-direction="right">Albania, France, USA, and Germany</span>.
                My contributions have been pivotal in designing and constructing <span className="highlight highlight-cyan" data-direction="left">microservices for distributed systems</span>,
                implementing <span className="highlight highlight-green" data-direction="right">data pipelines on Google Cloud</span>, and engaging in <span className="highlight highlight-yellow" data-direction="left">full-stack development</span>.
              </p>
              <p className="text">
                My passion for <span className="highlight highlight-cyan" data-direction="right">continuous learning and innovation</span> is evident through my active presence on various platforms.
                I thrive on staying updated with the <span className="highlight highlight-pink" data-direction="left">latest trends and technologies</span> in the ever-evolving tech landscape.
              </p>
              <p className="text">
                I bring a unique blend of <span className="highlight highlight-yellow" data-direction="right">technical expertise</span>, <span className="highlight highlight-green" data-direction="left">leadership qualities</span>, and a genuine enthusiasm for creating
                <span className="highlight highlight-cyan" data-direction="right"> impactful software solutions</span>.
              </p>
            </div>
          </section>

          {/* Journey Section */}
          <section className="section journey-section fade-in" id="experience">
            <h2 className="section-title-center">My Journey</h2>
            <div className="journey-container">
              <div className="journey-timeline">
                <h3 className="timeline-header">Journey Timeline</h3>
                <div className="timeline-list">
                  {experiences.map((exp) => (
                    <div key={exp.id} className="timeline-item-flat" data-country={exp.country}>
                      <div className="timeline-dot"></div>
                      <div className="timeline-content-flat">
                        <h4 className="timeline-title">{exp.title}</h4>
                        <p className="timeline-date">{exp.date}</p>
                        <p className="timeline-description">{exp.description}</p>
                        <p className="timeline-location">
                          <FontAwesomeIcon icon={faMapMarkerAlt} /> {exp.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="journey-timeline-back">
                <svg className="treasure-map-svg" viewBox="0 0 400 600">
                  <rect width="400" height="600" fill="#f4e7d7"/>
                  <g transform="translate(320, 80)">
                    <circle cx="0" cy="0" r="35" fill="none" stroke="#8B4513" strokeWidth="2"/>
                    <circle cx="0" cy="0" r="30" fill="none" stroke="#8B4513" strokeWidth="1"/>
                    <polygon points="0,-30 5,-10 -5,-10" fill="#D2691E"/>
                    <polygon points="0,30 5,10 -5,10" fill="#8B4513"/>
                    <polygon points="30,0 10,5 10,-5" fill="#8B4513"/>
                    <polygon points="-30,0 -10,5 -10,-5" fill="#8B4513"/>
                    <text x="0" y="-40" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#8B4513">N</text>
                  </g>
                  <path d="M 80,150 Q 120,200 100,250 T 140,350 Q 160,400 200,420" stroke="#D2691E" strokeWidth="3" fill="none" strokeDasharray="8,8" strokeLinecap="round"/>
                  <circle cx="80" cy="150" r="8" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
                  <circle cx="100" cy="250" r="8" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
                  <circle cx="140" cy="350" r="8" fill="#8B4513" stroke="#654321" strokeWidth="2"/>
                  <g transform="translate(200, 420)">
                    <circle cx="0" cy="0" r="25" fill="#FFD700" opacity="0.3"/>
                    <line x1="-15" y1="-15" x2="15" y2="15" stroke="#DC143C" strokeWidth="4" strokeLinecap="round"/>
                    <line x1="15" y1="-15" x2="-15" y2="15" stroke="#DC143C" strokeWidth="4" strokeLinecap="round"/>
                  </g>
                  <g opacity="0.4">
                    <polygon points="250,200 270,150 290,200" fill="#8B4513"/>
                    <polygon points="280,200 300,160 320,200" fill="#A0522D"/>
                    <polygon points="220,220 245,170 270,220" fill="#8B4513"/>
                  </g>
                  {/* Trees */}
                  <g opacity="0.4">
                    <polygon points="100,450 110,420 120,450" fill="#228B22"/>
                    <rect x="108" y="450" width="4" height="15" fill="#8B4513"/>
                    <polygon points="150,480 160,450 170,480" fill="#228B22"/>
                    <rect x="158" y="480" width="4" height="15" fill="#8B4513"/>
                    <polygon points="70,500 80,470 90,500" fill="#228B22"/>
                    <rect x="78" y="500" width="4" height="15" fill="#8B4513"/>
                  </g>
                  {/* Waves/Water */}
                  <g opacity="0.3">
                    <path d="M 40,300 Q 50,295 60,300 T 80,300" stroke="#4682B4" strokeWidth="2" fill="none"/>
                    <path d="M 40,310 Q 50,305 60,310 T 80,310" stroke="#4682B4" strokeWidth="2" fill="none"/>
                    <path d="M 280,520 Q 290,515 300,520 T 320,520" stroke="#4682B4" strokeWidth="2" fill="none"/>
                    <path d="M 280,530 Q 290,525 300,530 T 320,530" stroke="#4682B4" strokeWidth="2" fill="none"/>
                  </g>
                  <rect x="10" y="10" width="380" height="580" fill="none" stroke="#8B4513" strokeWidth="3" strokeDasharray="10,5"/>
                </svg>
              </div>
              <div className="journey-map-container">
                <JourneyMap />
                <svg className="map-overlay-lines" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <defs>
                    <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#000" strokeWidth="2" opacity="0.8"/>
                    </pattern>
                    <pattern id="scratches" width="200" height="200" patternUnits="userSpaceOnUse">
                      <line x1="10" y1="20" x2="60" y2="25" stroke="#000" strokeWidth="2" opacity="0.7"/>
                      <line x1="100" y1="50" x2="180" y2="48" stroke="#000" strokeWidth="1.5" opacity="0.6"/>
                      <line x1="30" y1="120" x2="90" y2="115" stroke="#000" strokeWidth="2" opacity="0.7"/>
                      <line x1="140" y1="160" x2="195" y2="165" stroke="#000" strokeWidth="1.5" opacity="0.6"/>
                      <line x1="5" y1="180" x2="45" y2="175" stroke="#000" strokeWidth="1.5" opacity="0.6"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)"/>
                  <rect width="100%" height="100%" fill="url(#scratches)"/>
                </svg>
                <Image src="/image/pirat.png" alt="Pirate" className="map-pirate-overlay" width={200} height={200} />
              </div>
            </div>
          </section>

          {/* Skills Section */}
          <section className="section" id="skills">
            <h2 className="section-title">SKILLS</h2>
            <div className="skills-grid-modern">
              {skills.map((skill, index) => (
                <div key={index} className={`skill-box ${skill.highlight ? 'highlight-box' : ''}`}>
                  <div className="skill-box-header">
                    <FontAwesomeIcon icon={skill.icon} className="skill-icon-large" />
                    <h3 className="skill-box-title">{skill.title}</h3>
                  </div>
                  <div className="tech-tags">
                    {skill.tags.map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">
                        <FontAwesomeIcon icon={getTagIcon(tag)} style={{ marginRight: '6px' }} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Education & Languages */}
          <section className="section education-languages-section" id="education">
            <div className="education-languages-grid">
              <div className="education-column">
                <h2 className="section-title">EDUCATION</h2>
                <div className="card education-card">
                  <div className="education-header">
                    <div>
                      <h3 className="education-title">Bachelor&apos;s Degree in Computer Science</h3>
                      <p className="education-school">University of Tirana</p>
                    </div>
                    <span className="badge">2013 - 2016</span>
                  </div>
                  <p className="education-location">
                    <FontAwesomeIcon icon={faMapMarkerAlt} /> Tirana, Albania
                  </p>
                </div>
              </div>
              <div className="languages-column">
                <h2 className="section-title">LANGUAGES</h2>
                <div className="card languages-card">
                  {languages.map((lang, index) => (
                    <div key={index} className="language-item">
                      <span className="language-name-inline">{lang.name}</span>
                      <div className="language-stars">
                        {[1, 2, 3].map((star) => (
                          <span key={star} className={`star ${star <= lang.stars ? 'filled' : ''}`}></span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className="section fade-in" id="contact">
            <h2 className="section-title">GET IN TOUCH</h2>
            <div className="contact-container-compact">
              <p className="contact-intro">Let&apos;s build something amazing together</p>
              <div className="contact-grid">
                <a href="https://linkedin.com/in/marjoballabani" target="_blank" rel="noopener noreferrer" className="contact-card">
                  <FontAwesomeIcon icon={faLinkedin} />
                  <span>LinkedIn</span>
                </a>
                <a href="https://github.com/marjoballabani" target="_blank" rel="noopener noreferrer" className="contact-card">
                  <FontAwesomeIcon icon={faGithub} />
                  <span>GitHub</span>
                </a>
                <a href="https://stackoverflow.com/users/7563517/marjo-ballabani" target="_blank" rel="noopener noreferrer" className="contact-card">
                  <FontAwesomeIcon icon={faStackOverflow} />
                  <span>Stack Overflow</span>
                </a>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="footer">
            <div className="footer-compact">
              <div className="footer-main">
                <div className="footer-brand-compact">
                  <strong>MARJO BALLABANI</strong>
                  <span>Senior Software Engineer</span>
                </div>
                <div className="footer-nav-compact">
                  <a href="#hero" onClick={(e) => { e.preventDefault(); scrollToSection('hero'); }}>Home</a>
                  <a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection('about'); }}>About</a>
                  <a href="#experience" onClick={(e) => { e.preventDefault(); scrollToSection('experience'); }}>Experience</a>
                  <a href="#skills" onClick={(e) => { e.preventDefault(); scrollToSection('skills'); }}>Skills</a>
                </div>
                <div className="footer-social-compact">
                  <a href="https://github.com/marjoballabani" target="_blank" rel="noopener noreferrer" title="GitHub">
                    <FontAwesomeIcon icon={faGithub} />
                  </a>
                  <a href="https://linkedin.com/in/marjoballabani" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                    <FontAwesomeIcon icon={faLinkedin} />
                  </a>
                  <a href="https://stackoverflow.com/users/7563517/marjo-ballabani" target="_blank" rel="noopener noreferrer" title="Stack Overflow">
                    <FontAwesomeIcon icon={faStackOverflow} />
                  </a>
                  <a href="mailto:marjoballabani@gmail.com" title="Email">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </a>
                </div>
              </div>
              <div className="footer-bottom-compact">
                <span>© 2025 Marjo Ballabani</span>
                <Link href="/terminal" className="footer-terminal-link-compact">
                  <FontAwesomeIcon icon={faTerminal} /> Terminal
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>


    </>
  )
}
