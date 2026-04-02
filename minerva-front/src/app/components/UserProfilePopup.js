"use client"
import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import { MdAdd, MdLock, MdLogout, MdPerson, MdEmail, MdGroup, MdVisibility, MdVisibilityOff, MdCheck, MdClose } from "react-icons/md"
import Perfil from "../utils/perfil"
import { getProfileById, uploadAvatar as uploadAvatarSupa, getUserTeam } from "../utils/supa"
import { changePassword } from "../utils/supaAuth"
import { createClient } from "../utils/client"

export default function UserProfilePopup({ onSignOut }) {
    const [open, setOpen] = useState(false)
    const [profile, setProfile] = useState(null)
    const [team, setTeam] = useState(null)
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [uploading, setUploading] = useState(false)

    // Password change state
    const [pwSection, setPwSection] = useState(false)
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPw, setShowPw] = useState(false)
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState(null) // { type: "success"|"error", text }

    const panelRef = useRef(null)
    const triggerRef = useRef(null)
    const fileInputRef = useRef(null)

    const [id_usuario, setIdUsuario] = useState(null)
    const userName = Perfil().getName() || "Usuario"

    // Fetch id_usuario from native Supabase session
    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setIdUsuario(session.user.id)
        })
    }, [])

    // Fetch profile + team once we have id_usuario
    useEffect(() => {
        if (id_usuario) fetchData()
    }, [id_usuario])

    async function fetchData() {
        const [{ profile: p }, { team: t }] = await Promise.all([
            getProfileById(id_usuario),
            getUserTeam(id_usuario),
        ])
        if (p) {
            setProfile(p)
            setAvatarUrl(p.avatar_url)
        }
        if (t) setTeam(t)
    }

    // Close on outside click
    useEffect(() => {
        if (!open) return
        function handleOutside(e) {
            if (
                panelRef.current && !panelRef.current.contains(e.target) &&
                triggerRef.current && !triggerRef.current.contains(e.target)
            ) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleOutside)
        return () => document.removeEventListener("mousedown", handleOutside)
    }, [open])

    async function handleAvatarUpload(e) {
        if (!e.target.files || e.target.files.length === 0) return
        setUploading(true)
        try {
            const { publicUrl, error } = await uploadAvatarSupa(id_usuario, e.target.files[0])
            if (error) throw error
            setAvatarUrl(publicUrl)
        } catch (err) {
            alert("Error al subir avatar: " + err.message)
        } finally {
            setUploading(false)
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault()
        setPwMsg(null)
        if (newPassword.length < 6) {
            setPwMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." })
            return
        }
        if (newPassword !== confirmPassword) {
            setPwMsg({ type: "error", text: "Las contraseñas no coinciden." })
            return
        }
        setPwLoading(true)
        const result = await changePassword(newPassword)
        setPwLoading(false)
        if (result) {
            setPwMsg({ type: "success", text: "Contraseña actualizada correctamente." })
            setNewPassword("")
            setConfirmPassword("")
        } else {
            setPwMsg({ type: "error", text: "Error al cambiar la contraseña." })
        }
    }

    function toggleOpen() {
        setOpen(v => !v)
        if (!open) {
            // reset password section on re-open
            setPwSection(false)
            setPwMsg(null)
            setNewPassword("")
            setConfirmPassword("")
        }
    }

    return (
        <div className="profile_popup_root">
            {/* ── Trigger pill ── */}
            <button
                ref={triggerRef}
                className={`profile_popup_trigger ${open ? "active" : ""}`}
                onClick={toggleOpen}
                aria-label="Perfil de usuario"
                id="profile-popup-trigger"
            >
                <div className="profile_popup_trigger_avatar">
                    {avatarUrl ? (
                        <Image
                            src={avatarUrl}
                            alt="Avatar"
                            width={32}
                            height={32}
                            style={{ objectFit: "cover", borderRadius: "50%" }}
                        />
                    ) : (
                        <MdPerson size={18} color="#666" />
                    )}
                </div>
                <span className="profile_popup_trigger_name">{userName}</span>
                <span className="profile_popup_trigger_chevron">{open ? "▴" : "▾"}</span>
            </button>

            {/* ── Popup panel ── */}
            {open && (
                <div ref={panelRef} className="profile_popup_panel" id="profile-popup-panel">

                    {/* User info */}
                    <div className="profile_popup_info_block">
                        {/* Avatar (large, clickable) */}
                        <div
                            className="profile_popup_avatar_wrap"
                            onClick={() => fileInputRef.current.click()}
                            title="Cambiar foto de perfil"
                        >
                            {avatarUrl ? (
                                <Image
                                    src={avatarUrl}
                                    alt="Avatar"
                                    width={72}
                                    height={72}
                                    style={{ objectFit: "cover", borderRadius: "50%" }}
                                />
                            ) : (
                                <div className="profile_popup_avatar_placeholder">
                                    <MdPerson size={36} color="#aaa" />
                                </div>
                            )}
                            <div className="profile_popup_avatar_overlay">
                                {uploading ? (
                                    <div className="profile_popup_spinner" />
                                ) : (
                                    <MdAdd size={20} color="#fff" />
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                onChange={handleAvatarUpload}
                                disabled={uploading}
                            />
                        </div>

                        {/* Text info */}
                        <div className="profile_popup_text">
                            <div className="profile_popup_fullname">
                                {profile?.full_name || userName}
                            </div>
                            <div className="profile_popup_meta">
                                <MdPerson size={13} />
                                <span>{profile?.username || userName}</span>
                            </div>
                            <div className="profile_popup_meta">
                                <MdEmail size={13} />
                                <span>{profile?.email || "—"}</span>
                            </div>
                            <div className="profile_popup_meta">
                                <MdGroup size={13} />
                                <span>{team?.teams?.name || "Sin equipo"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="profile_popup_divider" />

                    {/* Change password */}
                    <button
                        className="profile_popup_section_toggle"
                        onClick={() => { setPwSection(v => !v); setPwMsg(null) }}
                        id="profile-popup-pw-toggle"
                    >
                        <MdLock size={15} />
                        <span>Cambiar contraseña</span>
                        <span className="profile_popup_toggle_chevron">{pwSection ? "▴" : "▾"}</span>
                    </button>

                    {pwSection && (
                        <form onSubmit={handlePasswordChange} className="profile_popup_pw_form">
                            <div className="profile_popup_input_wrap">
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="Nueva contraseña"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="profile_popup_input"
                                    id="profile-popup-new-pw"
                                    minLength={6}
                                    required
                                />
                                <button
                                    type="button"
                                    className="profile_popup_pw_eye"
                                    onClick={() => setShowPw(v => !v)}
                                    tabIndex={-1}
                                >
                                    {showPw ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                                </button>
                            </div>
                            <div className="profile_popup_input_wrap">
                                <input
                                    type={showPw ? "text" : "password"}
                                    placeholder="Confirmar contraseña"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="profile_popup_input"
                                    id="profile-popup-confirm-pw"
                                    required
                                />
                            </div>
                            {pwMsg && (
                                <div className={`profile_popup_pw_msg ${pwMsg.type}`}>
                                    {pwMsg.type === "success" ? <MdCheck size={13} /> : <MdClose size={13} />}
                                    {pwMsg.text}
                                </div>
                            )}
                            <button
                                type="submit"
                                className="profile_popup_pw_submit"
                                disabled={pwLoading}
                                id="profile-popup-pw-submit"
                            >
                                {pwLoading ? "Guardando…" : "Guardar contraseña"}
                            </button>
                        </form>
                    )}

                    <div className="profile_popup_divider" />

                    {/* Logout */}
                    <button
                        className="profile_popup_signout"
                        onClick={onSignOut}
                        id="profile-popup-signout"
                    >
                        <MdLogout size={16} />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            )}
        </div>
    )
}
