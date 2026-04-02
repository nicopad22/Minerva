"use client"
import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { MdHome, MdPeople, MdAssignment, MdEvent } from "react-icons/md"
import UserProfilePopup from "../components/UserProfilePopup"
import { signOutUser } from "../utils/supaAuth"
import { hasPermiso } from "../utils/supa"
import "@/app/dashboard.css"

const PAGE_LABELS = {
  "/": null,
  "/tareas": "Tareas",
  "/usuarios": "Usuarios",
  "/eventos": "Eventos",
}

export default function UserLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [navItems, setNavItems] = useState([
    { label: "Inicio", icon: <MdHome size={18} />, href: "/" },
    { label: "Tareas", icon: <MdAssignment size={18} />, href: "/tareas" },
  ])
  const router = useRouter()
  const pathname = usePathname()


  useEffect(() => {
    async function checkPermisos() {
      const canEditUsers = await hasPermiso(1)
      const canEditEventos = await hasPermiso(2)
      if (canEditUsers) {
        setNavItems(prev => {
          if (prev.some(item => item.href === "/usuarios")) return prev
          return [...prev, { label: "Usuarios", icon: <MdPeople size={18} />, href: "/usuarios" }]
        })
      }
      if (canEditEventos) {
        setNavItems(prev => {
          if (prev.some(item => item.href === "/eventos")) return prev
          return [...prev, { label: "Eventos", icon: <MdEvent size={18} />, href: "/eventos" }]
        })
      }
    }
    checkPermisos()
  }, [])

  // Trigger window resize event when sidebar toggles to fix Calendar width
  useEffect(() => {
    const timeout = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 300) // Wait for 250ms transition + buffer
    return () => clearTimeout(timeout)
  }, [sidebarOpen])

  const handleSignOut = async () => {
    await signOutUser()
    router.replace("/login")
  }

  return (
    <div>
      {/* Header */}
      <header className="dashboard_header">
        <div className="dashboard_header_left">
          <button
            className="dashboard_hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <span className="dashboard_header_title">
            Minerva{PAGE_LABELS[pathname] ? <span className="dashboard_header_section"> · {PAGE_LABELS[pathname]}</span> : null}
          </span>
        </div>
        <div className="dashboard_header_right">
          <UserProfilePopup onSignOut={handleSignOut} />
        </div>
      </header>

      {/* Sidebar overlay (mobile) */}
      <div
        className={`dashboard_sidebar_overlay ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav className={`dashboard_sidebar ${sidebarOpen ? "open" : ""}`}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`dashboard_nav_item ${pathname === item.href ? "active" : ""}`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Main content */}
      <main className={`dashboard_main ${sidebarOpen ? "shifted" : ""}`}>
        {children}
      </main>
    </div>
  )
}
