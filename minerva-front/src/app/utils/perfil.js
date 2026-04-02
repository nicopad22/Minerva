"use client"

/**
 * Lightweight helper for non-auth user state (display name only).
 * Auth session is managed natively by Supabase (localStorage).
 * id_usuario is available via supabase.auth.getUser() or getSession().
 */
export default function Perfil() {

    function setName(name) {
        if (typeof window === "undefined") return
        localStorage.setItem('user_name', name)
    }

    function getName() {
        if (typeof window === "undefined") return null
        return localStorage.getItem('user_name')
    }

    function clear() {
        if (typeof window === "undefined") return
        localStorage.removeItem('user_name')
    }

    return {
        setName,
        getName,
        clear,
    }
}
