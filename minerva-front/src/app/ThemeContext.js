"use client"
import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'

const ThemeContext = createContext()

export function useAppTheme() {
  return useContext(ThemeContext)
}

export function AppThemeProvider({ children }) {
  const [mode, setMode] = useState('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('app-theme')
    if (saved) {
      setMode(saved)
      document.documentElement.setAttribute('data-theme', saved)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        setMode('dark')
        document.documentElement.setAttribute('data-theme', 'dark')
      }
    }
  }, [])

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('app-theme', newMode)
      document.documentElement.setAttribute('data-theme', newMode)
      return newMode
    })
  }

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      ...(mode === 'dark' && {
        primary: { main: '#3b82f6' },
        background: {
          default: '#0f172a',
          paper: '#1e293b',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
        },
        divider: '#334155'
      })
    },
  }), [mode])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  )
}
