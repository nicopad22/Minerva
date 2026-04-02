"use client"
import Perfil from './perfil'
import { createClient } from './client'
import { updateProfile } from './supa'

const supabase = createClient()

async function signInUser(user, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: user + "@ursacrux.cl",
    password: password,
  })

  if (error) {
    console.error('Login error:', error.message)
    alert("Credenciales Incorrectas")
    return null
  } else {
    console.log('User logged in successfully:', data)
    // Session is persisted automatically by Supabase in localStorage.
    // We only store the display name manually.
    Perfil().setName(user)
    return data.user
  }
}

async function changePassword(newPassword) {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword,
  })
  if (error) {
    console.error('Password change error:', error.message)
    alert("Error al cambiar la contraseña")
    return null
  } else {
    console.log('Password changed successfully:', data.user)
    return data.user
  }
}

async function signOutUser() {
  await supabase.auth.signOut()
  Perfil().clear()
}

export {
  signInUser,
  changePassword,
  signOutUser
}