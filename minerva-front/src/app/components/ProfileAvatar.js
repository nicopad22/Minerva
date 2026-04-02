"use client"
import { useState, useEffect, useRef } from "react"
import { MdAdd, MdCameraAlt } from "react-icons/md"
import { getProfileById, uploadAvatar as uploadAvatarSupa } from "../utils/supa"
import { createClient } from "../utils/client"
import Image from "next/image"

export default function ProfileAvatar({ size = 40 }) {
    const [avatarUrl, setAvatarUrl] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [id_usuario, setIdUsuario] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setIdUsuario(session.user.id)
        })
    }, [])

    useEffect(() => {
        if (id_usuario) {
            getProfile()
        }
    }, [id_usuario])

    async function getProfile() {
        try {
            const { profile, error } = await getProfileById(id_usuario)

            if (error) {
                console.warn("Error loading user profile:", error)
            } else if (profile) {
                setAvatarUrl(profile.avatar_url)
            }
        } catch (error) {
            console.warn("Error loading user profile:", error)
        }
    }

    async function uploadAvatar(event) {
        try {
            setUploading(true)

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error("You must select an image to upload.")
            }

            const file = event.target.files[0]
            const { publicUrl, error } = await uploadAvatarSupa(id_usuario, file)

            if (error) {
                throw error
            }

            setAvatarUrl(publicUrl)
        } catch (error) {
            alert("Error uploading avatar: " + error.message)
        } finally {
            setUploading(false)
        }
    }

    const handleClick = () => {
        fileInputRef.current.click()
    }

    return (
        <div
            className="profile_avatar_container"
            style={{ width: size, height: size }}
            onClick={handleClick}
            title="Cambiar foto de perfil"
        >
            {avatarUrl ? (
                <Image
                    src={avatarUrl}
                    alt="Avatar"
                    width={size}
                    height={size}
                    className="profile_avatar_image"
                    style={{ objectFit: 'cover' }}
                />
            ) : (
                <div className="profile_avatar_placeholder">
                    <MdAdd size={size * 0.6} color="#666" />
                </div>
            )}

            {uploading && (
                <div className="profile_avatar_loading">
                    <div className="profile_avatar_spinner"></div>
                </div>
            )}

            <input
                style={{
                    visibility: "hidden",
                    position: "absolute",
                }}
                type="file"
                id="single"
                accept="image/*"
                onChange={uploadAvatar}
                disabled={uploading}
                ref={fileInputRef}
            />
        </div>
    )
}
