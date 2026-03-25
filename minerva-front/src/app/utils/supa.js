import { createClient } from "./client"
import Perfil from "./perfil"

const supaClient = createClient()

/**
 * Fetches the current authenticated user's profile from Supabase Auth.
 * @returns {Promise<{user: object|null, error: object|null}>}
 */
export async function getUserProfile() {
    const { data, error } = await supaClient.auth.getUser()
    return { user: data?.user ?? null, error: error ?? null }
}

/**
 * Fetches a profile row from the profiles table by user id.
 * @param {string} userId
 * @returns {Promise<{profile: object|null, error: object|null}>}
 */
export async function getProfileById(userId) {
    const { data, error } = await supaClient
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single()
    return { profile: data ?? null, error: error ?? null }
}

/**
 * Updates a profile row in the profiles table.
 * @param {string} userId
 * @param {object} updates - fields to update (e.g. { username, last_login })
 * @returns {Promise<{profile: object|null, error: object|null}>}
 */
export async function updateProfile(userId, updates) {
    const { data, error } = await supaClient
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single()
    return { profile: data ?? null, error: error ?? null }
}

/**
 * Checks if the current user has a specific permiso.
 * @param {number} permiso
 * @returns {Promise<boolean>}
 */
export async function hasPermiso(permiso) {
    const { data } = await supaClient
        .from("permisos_usuarios")
        .select("permiso")
        .eq("id_usuario", Perfil().getToken()?.id_usuario)
        .eq("permiso", permiso)
        .maybeSingle()
    return !!data
}

/**
 * Fetches all profiles.
 */
export async function getAllProfiles() {
    const { data, error } = await supaClient
        .from("profiles")
        .select("*")
        .order("full_name")
    return { profiles: data ?? [], error }
}

/**
 * Fetches all rows from permisos_usuarios.
 */
export async function getPermisosUsuarios() {
    const { data, error } = await supaClient
        .from("permisos_usuarios")
        .select("*")
    return { permisos: data ?? [], error }
}

/**
 * Inserts a permiso for a user.
 */
export async function setPermisoUsuario(userId, permiso) {
    const { data, error } = await supaClient
        .from("permisos_usuarios")
        .upsert({ id_usuario: userId, permiso }, { onConflict: "id_usuario, permiso" })
        .select()
    return { data, error }
}

/**
 * Deletes a permiso for a user.
 */
export async function deletePermisoUsuario(userId, permiso) {
    const { error } = await supaClient
        .from("permisos_usuarios")
        .delete()
        .eq("id_usuario", userId)
        .eq("permiso", permiso)
    return { error }
}

/**
 * Fetches all tasks.
 */
export async function getAllTasks() {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*")
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Creates a new user via the create-user Edge Function.
 * @param {string} username
 * @param {string} password
 * @param {string} [full_name]
 * @param {string} [email]
 */
export async function createUser(username, password, full_name, email) {
    const token = Perfil().getToken()?.token
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_dbUrl}/functions/v1/create-user`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
                "apikey": process.env.NEXT_PUBLIC_dbKey,
            },
            body: JSON.stringify({ username, password, full_name, email }),
        }
    )
    const data = await res.json()
    if (!res.ok) {
        return { user: null, error: data.error || "Error al crear usuario" }
    }
    return { user: data.user, error: null }
}

/**
 * Uploads an avatar image to storage and updates the user profile.
 * @param {string} userId 
 * @param {File} file 
 */
export async function uploadAvatar(userId, file) {
    const fileExt = file.name.split(".").pop()
    const fileName = `${userId}-${Math.random()}.${fileExt}`
    const filePath = `${fileName}`

    // Upload image to storage
    const { error: uploadError } = await supaClient.storage
        .from("avatars")
        .upload(filePath, file)

    if (uploadError) {
        return { error: uploadError }
    }

    // Get public URL
    const { data: { publicUrl } } = supaClient.storage
        .from("avatars")
        .getPublicUrl(filePath)

    // Update profile
    const { error: updateError } = await supaClient
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

    return { publicUrl, error: updateError }
}

/**
 * Fetches tasks where the user is assigned or related via tasks_profiles.
 * @param {string} userId 
 */
export async function getMyTasks(userId) {
    // 1. Tasks assigned to user
    const { data: assignedTasks, error: assignedError } = await supaClient
        .from("tasks")
        .select("*")
        .eq("assigned_to", userId)

    if (assignedError) return { tasks: [], error: assignedError }

    // 2. Tasks where user is in tasks_profiles
    const { data: relatedTasksData, error: relatedError } = await supaClient
        .from("tasks_profiles")
        .select("id_task, tasks(*)")
        .eq("id_profile", userId)

    if (relatedError) return { tasks: [], error: relatedError }

    // Extract task objects from relatedTasksData
    const relatedTasks = relatedTasksData.map(item => item.tasks).filter(Boolean)

    // Merge and deduplicate
    const allTasks = [...assignedTasks, ...relatedTasks]
    const uniqueTasks = Array.from(new Map(allTasks.map(task => [task.id, task])).values())

    // Sort by due_date (ascending), then created_at
    uniqueTasks.sort((a, b) => {
        const dateA = new Date(a.due_date || a.created_at)
        const dateB = new Date(b.due_date || b.created_at)
        return dateA - dateB
    })

    return { tasks: uniqueTasks, error: null }
}

/**
 * Fetches all teams.
 */
export async function getTeams() {
    const { data, error } = await supaClient
        .from("teams")
        .select("*")
        .order("id")
    return { teams: data ?? [], error }
}

/**
 * Fetches tasks that are "Goals" (have no unlocking task above them, i.e., desbloquea is NULL).
 */
export async function getGoalTasks() {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
        .is("desbloquea", null)
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Fetches tasks that unlock a specific task (prerequisites).
 * @param {number} unlockedTaskId 
 */
export async function getPrerequisiteTasks(unlockedTaskId) {
    const { data, error } = await supaClient
        .from("tasks")
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
        .eq("desbloquea", unlockedTaskId)
        .order("created_at")
    return { tasks: data ?? [], error }
}

/**
 * Creates a new task.
 * @param {object} taskData
 */
export async function createTask(taskData) {
    const { data, error } = await supaClient
        .from("tasks")
        .insert(taskData)
        .select()
        .single()
    return { task: data, error }
}

/**
 * Updates an existing task. RLS will determine if the user has permission.
 * @param {number} taskId
 * @param {object} updates - fields to update
 */
export async function updateTask(taskId, updates) {
    const { data, error } = await supaClient
        .from("tasks")
        .update(updates)
        .eq("id", taskId)
        .select("*, assigned_to_profile:assigned_to(id, full_name, username, avatar_url), tasks_profiles(id_profile, profiles:id_profile(id, full_name, username, avatar_url))")
    return { task: data?.[0] ?? null, error }
}

/**
 * Adds multiple profiles to a task (tasks_profiles).
 * @param {number} taskId
 * @param {string[]} profileIds
 */
export async function addProfilesToTask(taskId, profileIds) {
    if (!profileIds || profileIds.length === 0) return { error: null }

    const rows = profileIds.map(pid => ({
        id_task: taskId,
        id_profile: pid
    }))

    const { error } = await supaClient
        .from("tasks_profiles")
        .insert(rows)

    return { error }
}

/**
 * Syncs the participants of a task: removes all existing and inserts the new list.
 * @param {number} taskId
 * @param {string[]} profileIds
 */
export async function syncTaskProfiles(taskId, profileIds) {
    // Delete all existing
    const { error: delError } = await supaClient
        .from("tasks_profiles")
        .delete()
        .eq("id_task", taskId)

    if (delError) return { error: delError }

    // Insert new list
    if (profileIds.length === 0) return { error: null }

    const rows = profileIds.map(pid => ({
        id_task: taskId,
        id_profile: pid
    }))

    const { error } = await supaClient
        .from("tasks_profiles")
        .insert(rows)

    return { error }
}

/**
 * Fetches the team membership for a user, including team name.
 * @param {string} userId
 * @returns {Promise<{team: object|null, error: object|null}>}
 */
export async function getUserTeam(userId) {
    const { data, error } = await supaClient
        .from("team_members")
        .select("role, teams(id, name)")
        .eq("user_id", userId)
        .maybeSingle()
    return { team: data ?? null, error: error ?? null }
}

/**
 * Fetches all team memberships for a user, including team id and name.
 * @param {string} userId
 * @returns {Promise<{teams: object[], error: object|null}>}
 */
export async function getUserTeams(userId) {
    const { data, error } = await supaClient
        .from("team_members")
        .select("role, teams(id, name)")
        .eq("user_id", userId)
    return { teams: data ?? [], error: error ?? null }
}

/**
 * Adds a user to a team.
 * @param {string} userId
 * @param {number} teamId
 * @param {string} [role="miembro"]
 */
export async function addUserTeam(userId, teamId, role = "miembro") {
    const { data, error } = await supaClient
        .from("team_members")
        .insert({ user_id: userId, team_id: teamId, role })
        .select("role, teams(id, name)")
        .single()
    return { data, error }
}

/**
 * Updates the role of a user in a team.
 * @param {string} userId
 * @param {number} teamId
 * @param {string} role
 */
export async function updateUserTeamRole(userId, teamId, role) {
    const { data, error } = await supaClient
        .from("team_members")
        .update({ role })
        .eq("user_id", userId)
        .eq("team_id", teamId)
        .select("role, teams(id, name)")
        .single()
    return { data, error }
}

/**
 * Removes a user from a team.
 * @param {string} userId
 * @param {number} teamId
 */
export async function removeUserTeam(userId, teamId) {
    const { error } = await supaClient
        .from("team_members")
        .delete()
        .eq("user_id", userId)
        .eq("team_id", teamId)
    return { error }
}

/**
 * Fetches all progresos for a given task, with creator profile info.
 * @param {number} taskId
 */
export async function getTaskProgresos(taskId) {
    const { data, error } = await supaClient
        .from("progresos")
        .select("*, profiles:created_by(full_name, username, avatar_url)")
        .eq("id_task", taskId)
        .order("created_at", { ascending: false })
    return { progresos: data ?? [], error }
}

/**
 * Fetches all non-deleted eventos, ordered by inicio (ascending).
 */
export async function getEventos() {
    const { data, error } = await supaClient
        .from("eventos")
        .select("*")
        .eq("deleted", false)
        .order("inicio", { ascending: true })
    return { eventos: data ?? [], error }
}

/**
 * Creates a new evento and initializes attendees.
 * @param {object} eventoData 
 * @param {string[]} userIds 
 */
export async function createEvento(eventoData, userIds = []) {
    const { data: evento, error: eventoError } = await supaClient
        .from("eventos")
        .insert(eventoData)
        .select()
        .single()
    
    if (eventoError || !evento) return { evento: null, error: eventoError }

    if (userIds.length > 0) {
        const rows = userIds.map(uid => ({
            id_evento: evento.id_evento,
            id_usuario: uid,
            asistencia: 0
        }))
        const { error: asisError } = await supaClient
            .from("eventos_usuarios")
            .insert(rows)
        if (asisError) console.error("Error creating attendance rows", asisError)
    }

    return { evento, error: null }
}

/**
 * Updates an evento.
 * @param {string} id_evento 
 * @param {object} eventoData 
 * @param {string[]} userIds 
 */
export async function updateEvento(id_evento, eventoData, userIds = []) {
    const { data: evento, error: eventoError } = await supaClient
        .from("eventos")
        .update(eventoData)
        .eq("id_evento", id_evento)
        .select()
        .single()
    
    if (eventoError) return { evento: null, error: eventoError }

    // Sync users
    const { data: existing } = await supaClient
        .from("eventos_usuarios")
        .select("id_usuario")
        .eq("id_evento", id_evento)

    const existingIds = existing ? existing.map(e => e.id_usuario) : []
    const toAdd = userIds.filter(uid => !existingIds.includes(uid))
    const toRemove = existingIds.filter(uid => !userIds.includes(uid))

    if (toAdd.length > 0) {
        const rows = toAdd.map(uid => ({
            id_evento,
            id_usuario: uid,
            asistencia: 0
        }))
        await supaClient.from("eventos_usuarios").insert(rows)
    }

    if (toRemove.length > 0) {
        await supaClient.from("eventos_usuarios")
            .delete()
            .eq("id_evento", id_evento)
            .in("id_usuario", toRemove)
    }

    return { evento, error: null }
}

/**
 * Soft deletes an evento.
 * @param {string} id_evento 
 * @param {string} userId 
 */
export async function deleteEvento(id_evento, userId) {
    const { error } = await supaClient
        .from("eventos")
        .update({ deleted: true, deleted_by: userId })
        .eq("id_evento", id_evento)
    return { error }
}

/**
 * Fetches users assigned to an evento grouped by their attendance status.
 * @param {string} id_evento 
 */
export async function getEventUsers(id_evento) {
    const { data, error } = await supaClient
        .from("eventos_usuarios")
        .select("asistencia, profiles(*)")
        .eq("id_evento", id_evento)

    if (error) return { data: null, error }

    // Supabase returns profiles as an object or array. Usually object because it's a many-to-one mapping
    const confirmados = data.filter(d => d.asistencia === 1).map(d => d.profiles)
    const justificados = data.filter(d => d.asistencia === 2).map(d => d.profiles)
    const nr = data.filter(d => d.asistencia === 0).map(d => d.profiles)

    return { 
        data: { confirmados, justificados, nr }, 
        error: null 
    }
}

/**
 * Confirm user's attendance for an event.
 * @param {string} id_evento 
 * @param {string} id_usuario 
 */
export async function confirmarAsistencia(id_evento, id_usuario) {
    const { error } = await supaClient
        .from("eventos_usuarios")
        .update({ asistencia: 1 })
        .eq("id_evento", id_evento)
        .eq("id_usuario", id_usuario)
    return { error }
}

/**
 * Submit justification for absence. Upload files to storage and update db.
 * @param {string} id_evento 
 * @param {string} id_usuario 
 * @param {string} motivo 
 * @param {File[]} archivos 
 */
export async function enviarJustificacion(id_evento, id_usuario, motivo, archivos = []) {
    const uploadedUrls = []

    for (const file of archivos) {
        const fileExt = file.name.split(".").pop()
        const fileName = `${id_evento}/${id_usuario}-${Math.random()}.${fileExt}`
        
        const { error: uploadError } = await supaClient.storage
            .from("justificaciones")
            .upload(fileName, file)
        
        if (!uploadError) {
            const { data: { publicUrl } } = supaClient.storage
                .from("justificaciones")
                .getPublicUrl(fileName)
            uploadedUrls.push(publicUrl)
        }
    }

    const { error } = await supaClient
        .from("eventos_usuarios")
        .update({ 
            asistencia: 2, 
            motivo_justificacion: motivo,
            archivos: uploadedUrls
        })
        .eq("id_evento", id_evento)
        .eq("id_usuario", id_usuario)
        
    return { error }
}

export { supaClient }
