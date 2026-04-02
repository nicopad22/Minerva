"use client"
import { useEffect, useState, useRef, useCallback, useMemo } from "react"
import { getGoalTasks, getPrerequisiteTasks, getTeams, createTask, updateTask, hasPermiso, getAllProfiles, addProfilesToTask, syncTaskProfiles, getTaskProgresos, getTeamMembers } from "../utils/supa"
import { MdAdd, MdClose, MdVisibility, MdEdit } from "react-icons/md"
import { createClient } from "../utils/client"
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../tareas.css';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Select, FormControl, InputLabel, Chip, OutlinedInput, Box, CircularProgress } from "@mui/material"

// Hardcoded colors for teams (since teams table doesn't have color column)
const TEAM_COLORS = {
    1: "#f87171", // Red
    2: "#60a5fa", // Blue
    3: "#facc15", // Yellow
    4: "#4ade80", // Green
    5: "#c084fc", // Purple
    default: "#94a3b8" // Gray
}

// Priority color bands
const PRIORITY_COLORS = {
    "1": "#ef4444", // Alta - Red
    "2": "#f97316", // Media - Orange
    "3": "#eab308", // Baja - Yellow
    default: "#cbd5e1" // Sin prioridad - Light gray
}

function getPriorityBorder(priority) {
    const color = PRIORITY_COLORS[String(priority)] || PRIORITY_COLORS.default
    return `10px solid ${color}`
}

function getInitials(name) {
    if (!name) return "?"
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
}

// Collect unique profiles from assigned_to + tasks_profiles
function getTaskAvatars(task) {
    const map = new Map()
    if (task.assigned_to_profile) {
        const p = task.assigned_to_profile
        map.set(p.id, p)
    }
    if (task.tasks_profiles) {
        task.tasks_profiles.forEach(tp => {
            const p = tp.profiles
            if (p && !map.has(p.id)) map.set(p.id, p)
        })
    }
    return Array.from(map.values())
}

// ── Custom Node Component ──
function TaskNode({ data }) {
    const [hovered, setHovered] = useState(false)
    const [showProgresos, setShowProgresos] = useState(false)
    const [progresos, setProgresos] = useState([])
    const [loadingProgresos, setLoadingProgresos] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const hoverTimeout = useRef(null)
    const nodeRef = useRef(null)

    const task = data.task
    const avatars = getTaskAvatars(task)
    const MAX_AVATARS = 4

    const bgColor = TEAM_COLORS[task.team_id] || TEAM_COLORS.default

    function handleMouseEnter() {
        clearTimeout(hoverTimeout.current)
        setHovered(true)
        // Elevate the React Flow node wrapper so the tooltip renders above sibling nodes
        const wrapper = nodeRef.current?.closest('.react-flow__node')
        if (wrapper) wrapper.style.zIndex = '9999'
    }

    function handleMouseLeave() {
        hoverTimeout.current = setTimeout(() => {
            setHovered(false)
            // Restore default z-index
            const wrapper = nodeRef.current?.closest('.react-flow__node')
            if (wrapper) wrapper.style.zIndex = ''
        }, 200)
    }

    async function handleViewDetails(e) {
        e.stopPropagation()
        setHovered(false)
        setShowProgresos(true)
        setLoadingProgresos(true)
        const { progresos: data } = await getTaskProgresos(task.id)
        setProgresos(data)
        setLoadingProgresos(false)
    }

    function handleEdit(e) {
        e.stopPropagation()
        setHovered(false)
        setShowEditModal(true)
    }

    const isSelected = data.selectedTaskId != null && data.selectedTaskId === task.id

    return (
        <>
            <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
            <div
                ref={nodeRef}
                className={`flowchart_node${isSelected ? ' flowchart_node--selected' : ''}`}
                style={{
                    background: bgColor,
                    borderLeft: getPriorityBorder(task.priority),
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                <div className="flowchart_node_title">{task.title}</div>
                {avatars.length > 0 && (
                    <div className="flowchart_node_avatars">
                        {avatars.slice(0, MAX_AVATARS).map(p => (
                            <div key={p.id} className="flowchart_avatar" title={p.full_name || p.username || "Usuario"}>
                                {p.avatar_url ? (
                                    <img src={p.avatar_url} alt={p.full_name || "Avatar"} />
                                ) : (
                                    getInitials(p.full_name || p.username)
                                )}
                            </div>
                        ))}
                        {avatars.length > MAX_AVATARS && (
                            <div className="flowchart_avatar_more">
                                +{avatars.length - MAX_AVATARS}
                            </div>
                        )}
                    </div>
                )}

                {/* Hover Tooltip */}
                {hovered && (
                    <div
                        className="flowchart_tooltip"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="flowchart_tooltip_edit_icon" onClick={handleEdit} title="Editar tarea">
                            <MdEdit size={14} />
                        </button>
                        <div className="flowchart_tooltip_title">{task.title}</div>
                        {task.description && (
                            <div className="flowchart_tooltip_desc">{task.description}</div>
                        )}

                        {/* Status / Priority / Team badges */}
                        <div className="flowchart_tooltip_badges">
                            {(() => {
                                const sm = STATUS_META[task.status]
                                return sm ? (
                                    <span className="flowchart_tooltip_badge" style={{ color: sm.color, background: sm.bg }}>{sm.label}</span>
                                ) : null
                            })()}
                            {task.priority && PRIORITY_META[String(task.priority)] && (
                                <span className="flowchart_tooltip_badge" style={{ color: PRIORITY_META[String(task.priority)].color, background: PRIORITY_META[String(task.priority)].bg }}>
                                    {PRIORITY_META[String(task.priority)].label} prioridad
                                </span>
                            )}
                            {data.teams?.find(t => t.id === task.team_id)?.name && (
                                <span className="flowchart_tooltip_badge" style={{ color: '#7c3aed', background: '#ede9fe' }}>
                                    {data.teams.find(t => t.id === task.team_id).name}
                                </span>
                            )}
                        </div>

                        {/* Assigned to */}
                        <div className="flowchart_tooltip_info_row">
                            <span className="flowchart_tooltip_info_label">Asignado a</span>
                            <span className="flowchart_tooltip_info_value">
                                {task.assigned_to_profile
                                    ? (task.assigned_to_profile.full_name || task.assigned_to_profile.username)
                                    : <em style={{ color: '#bbb' }}>Sin asignar</em>
                                }
                            </span>
                        </div>

                        <Button variant="outlined" color="primary" className="flowchart_tooltip_tn" style={{ marginTop: 4 }} onClick={handleViewDetails}>
                            Ver Detalles
                        </Button>
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />

            {/* Task Details Dialog */}
            {showProgresos && (
                <ProgresosDialog
                    task={task}
                    progresos={progresos}
                    loading={loadingProgresos}
                    onClose={() => setShowProgresos(false)}
                    teams={data.teams || []}
                />
            )}

            {/* Edit Task Dialog */}
            {showEditModal && (
                <EditTaskModal
                    task={task}
                    teams={data.teams || []}
                    profiles={data.profiles || []}
                    onClose={() => setShowEditModal(false)}
                    onUpdated={(updatedTask) => {
                        setShowEditModal(false)
                        if (data.onTaskUpdated) data.onTaskUpdated(updatedTask)
                    }}
                />
            )}
        </>
    )
}

// ── Status / Priority display helpers ──
const STATUS_META = {
    pendiente:   { label: "Pendiente",   color: "#64748b", bg: "#f1f5f9" },
    en_progreso: { label: "En Progreso", color: "#2563eb", bg: "#dbeafe" },
    completado:  { label: "Completado",  color: "#16a34a", bg: "#dcfce7" },
}

const PRIORITY_META = {
    "1": { label: "Alta",   color: "#dc2626", bg: "#fee2e2" },
    "2": { label: "Media",  color: "#d97706", bg: "#fef3c7" },
    "3": { label: "Baja",   color: "#ca8a04", bg: "#fefce8" },
}

// ── Task Details Dialog (formerly only Progresos) ──
function ProgresosDialog({ task, progresos, loading, onClose, teams }) {
    const teamName = teams?.find(t => t.id === task.team_id)?.name
    const statusMeta = STATUS_META[task.status] || { label: task.status || "—", color: "#64748b", bg: "#f1f5f9" }
    const priorityMeta = task.priority ? (PRIORITY_META[String(task.priority)] || null) : null
    const participants = getTaskAvatars(task)

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm"
            PaperProps={{ style: { borderRadius: 16, overflow: "hidden" } }}
        >
            {/* ── Header ── */}
            <div className="td_header">
                <div className="td_header_inner">
                    <div className="td_title">{task.title}</div>
                    <button className="td_close_btn" onClick={onClose} title="Cerrar">
                        <MdClose size={18} />
                    </button>
                </div>
            </div>

            <DialogContent style={{ padding: "20px 24px 8px", display: "flex", flexDirection: "column", gap: 20 }}>

                {/* ── Badge Row ── */}
                <div className="td_badge_row">
                    <span className="td_badge" style={{ color: statusMeta.color, background: statusMeta.bg }}>
                        {statusMeta.label}
                    </span>
                    {priorityMeta && (
                        <span className="td_badge" style={{ color: priorityMeta.color, background: priorityMeta.bg }}>
                            {priorityMeta.label} prioridad
                        </span>
                    )}
                    {teamName && (
                        <span className="td_badge" style={{ color: "#7c3aed", background: "#ede9fe" }}>
                            {teamName}
                        </span>
                    )}
                </div>

                {/* ── Description ── */}
                {task.description && (
                    <div className="td_section">
                        <div className="td_section_label">Descripción</div>
                        <div className="td_description">{task.description}</div>
                    </div>
                )}

                {/* ── Info Grid ── */}
                <div className="td_info_grid">
                    {/* Assigned to */}
                    <div className="td_info_cell">
                        <div className="td_info_label">Asignado a</div>
                        <div className="td_info_value td_person_row">
                            {task.assigned_to_profile ? (
                                <>
                                    <div className="td_mini_avatar">
                                        {task.assigned_to_profile.avatar_url
                                            ? <img src={task.assigned_to_profile.avatar_url} alt="" />
                                            : getInitials(task.assigned_to_profile.full_name || task.assigned_to_profile.username)
                                        }
                                    </div>
                                    <span>{task.assigned_to_profile.full_name || task.assigned_to_profile.username}</span>
                                </>
                            ) : (
                                <span className="td_empty_value">Sin asignar</span>
                            )}
                        </div>
                    </div>

                    {/* Due date */}
                    <div className="td_info_cell">
                        <div className="td_info_label">Fecha límite</div>
                        <div className="td_info_value">
                            {task.due_date
                                ? new Date(task.due_date + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" })
                                : <span className="td_empty_value">Sin fecha</span>
                            }
                        </div>
                    </div>
                </div>

                {/* ── Participants ── */}
                {participants.length > 0 && (
                    <div className="td_section">
                        <div className="td_section_label">Participantes ({participants.length})</div>
                        <div className="td_participants_row">
                            {participants.map(p => (
                                <div key={p.id} className="td_participant" title={p.full_name || p.username || "Usuario"}>
                                    <div className="td_mini_avatar">
                                        {p.avatar_url
                                            ? <img src={p.avatar_url} alt="" />
                                            : getInitials(p.full_name || p.username)
                                        }
                                    </div>
                                    <span>{p.full_name || p.username || "Usuario"}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── Divider ── */}
                <div className="td_divider" />

                {/* ── Progresos Section ── */}
                <div className="td_progresos_section">
                    <div className="td_section_label" style={{ marginBottom: 12 }}>Historial de Progreso</div>
                    {loading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
                            <CircularProgress size={28} />
                        </div>
                    ) : progresos.length === 0 ? (
                        <div className="progreso_empty">No hay progresos registrados.</div>
                    ) : (
                        <div className="progreso_list">
                            {progresos.map(p => (
                                <div key={p.id} className="progreso_card">
                                    <div className="progreso_card_title">{p.titulo || "Sin título"}</div>
                                    {p.descripcion && (
                                        <div className="progreso_card_desc">{p.descripcion}</div>
                                    )}
                                    <div className="progreso_card_meta">
                                        <div className="progreso_card_author">
                                            {p.profiles?.avatar_url && (
                                                <img src={p.profiles.avatar_url} alt="" />
                                            )}
                                            <span>{p.profiles?.full_name || p.profiles?.username || "Usuario"}</span>
                                        </div>
                                        <span>{new Date(p.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>

            <DialogActions style={{ padding: "12px 24px 20px" }}>
                <Button onClick={onClose} variant="outlined" color="inherit">Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}

// Define nodeTypes outside the component to prevent React re-renders
const nodeTypes = { taskNode: TaskNode }

export default function TaskFlowchart() {
    const [tasks, setTasks] = useState([])
    const [teams, setTeams] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [loading, setLoading] = useState(false)
    const [canCreateGoal, setCanCreateGoal] = useState(false)
    const [isCreatingGoal, setIsCreatingGoal] = useState(false)
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [profiles, setProfiles] = useState([])
    // Track which nodes currently have their children expanded
    const [expandedNodes, setExpandedNodes] = useState(new Set())

    // Load initial data
    useEffect(() => {
        loadInitialData()
        checkPermissions()
    }, [])

    async function checkPermissions() {
        const has = await hasPermiso(3)
        setCanCreateGoal(has)
    }

    function handleTaskUpdated(updatedTask) {
        // Update the node data in-place so the flowchart reflects the edit
        setNodes(nds => nds.map(n => {
            if (n.id === updatedTask.id.toString()) {
                return {
                    ...n,
                    data: { ...n.data, label: updatedTask.title, task: updatedTask },
                }
            }
            return n
        }))
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    }

    // Keep selectedTaskId fresh on every node whenever selectedTask changes
    useEffect(() => {
        const id = selectedTask?.id ?? null
        setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, selectedTaskId: id } })))
    }, [selectedTask])

    function buildNode(task, position, teamsData, profilesData, selectedId) {
        return {
            id: task.id.toString(),
            type: 'taskNode',
            position,
            data: {
                label: task.title,
                task,
                teams: teamsData || teams,
                profiles: profilesData || profiles,
                onTaskUpdated: handleTaskUpdated,
                selectedTaskId: selectedId ?? selectedTask?.id ?? null,
            },
        }
    }

    async function loadInitialData() {
        const { teams: loadedTeams } = await getTeams()
        setTeams(loadedTeams)

        const { profiles: loadedProfiles } = await getAllProfiles()
        setProfiles(loadedProfiles)

        const { tasks: goals } = await getGoalTasks()
        setTasks(goals)

        // Map goals to nodes — pass loaded data directly since state hasn't updated yet
        const initialNodes = goals.map((task, index) => buildNode(task, { x: index * 250, y: 0 }, loadedTeams, loadedProfiles))
        setNodes(initialNodes)
    }

    const onNodesChange = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    const onConnect = useCallback(
        (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
        [],
    );

    // Recursively collect all descendant node IDs reachable from a given node
    // via outgoing edges (source -> target direction used for prereqs).
    function collectDescendants(startId, edgesSnapshot, nodesSnapshot) {
        const visited = new Set()
        const queue = [startId]
        while (queue.length > 0) {
            const current = queue.shift()
            // Edges go source=parent → target=child (prereq)
            edgesSnapshot
                .filter(e => e.source === current)
                .forEach(e => {
                    if (!visited.has(e.target)) {
                        visited.add(e.target)
                        queue.push(e.target)
                    }
                })
        }
        return visited
    }

    const onNodeClick = async (event, node) => {
        const task = node.data.task
        if (!task) return
        const nodeId = task.id.toString()
        setSelectedTask(task)

        // ── COLLAPSE: node is already expanded → remove its subtree ──
        if (expandedNodes.has(nodeId)) {
            setExpandedNodes(prev => {
                const next = new Set(prev)
                next.delete(nodeId)
                return next
            })

            setEdges(eds => {
                // Find all descendants first (using current edges snapshot)
                const descendants = collectDescendants(nodeId, eds, nodes)

                // Remove edges that originate from the collapsed node or any descendant
                const toRemove = new Set([nodeId, ...descendants])
                const filteredEdges = eds.filter(e => !toRemove.has(e.source))

                // Remove descendant nodes and clean up expandedNodes for them
                setNodes(nds => nds.filter(n => !descendants.has(n.id)))
                setExpandedNodes(prev => {
                    const next = new Set(prev)
                    descendants.forEach(id => next.delete(id))
                    return next
                })

                return filteredEdges
            })

            return
        }

        // ── EXPAND: fetch prerequisites and add them ──
        const { tasks: prereqs } = await getPrerequisiteTasks(task.id)
        if (!prereqs || prereqs.length === 0) return

        // Mark this node as expanded
        setExpandedNodes(prev => new Set([...prev, nodeId]))

        setNodes((nds) => {
            const newNodes = []

            // Check which prereqs are already in the graph
            prereqs.forEach((p, idx) => {
                if (nds.find(n => n.id === p.id.toString())) {
                    return
                }

                // Position new nodes BELOW the target
                newNodes.push(buildNode(p, {
                    x: node.position.x + (idx * 220) - ((prereqs.length - 1) * 110),
                    y: node.position.y + 150
                }))
            })
            return [...nds, ...newNodes]
        })

        setEdges((eds) => {
            const newEdges = []
            prereqs.forEach(p => {
                const edgeId = `${p.id}-${task.id}`
                if (!eds.find(e => e.id === edgeId)) {
                    newEdges.push({
                        id: edgeId,
                        source: task.id.toString(),
                        target: p.id.toString(),
                        animated: true
                    })
                }
            })
            return [...eds, ...newEdges]
        })

        // Also update local tasks state for the chart context
        setTasks(prev => {
            const newTasks = [...prev]
            prereqs.forEach(p => {
                if (!newTasks.find(t => t.id === p.id)) newTasks.push(p)
            })
            return newTasks
        })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            {/* Graph Container — full height, floating controls inside */}
            <div style={{ flex: 1, overflow: "auto", background: "#fff", borderRadius: 8, border: "1px solid #e2e8f0", minHeight: 400, position: "relative" }}>
                <div style={{ width: '100%', height: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        nodesConnectable={false}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        fitView
                    />
                </div>

                {/* ── Floating Action Panel ── */}
                <div className="flowchart_float_panel">
                    {/* Add Task button (always visible when permitted) */}
                    {canCreateGoal && (
                        <button
                            className="flowchart_float_btn flowchart_float_btn--primary"
                            onClick={() => {
                                setSelectedTask(null)
                                setIsCreatingGoal(true)
                                setShowCreateModal(true)
                            }}
                            title="Añadir Tarea"
                        >
                            <MdAdd size={20} />
                            <span>Añadir Tarea</span>
                        </button>
                    )}

                    {/* Selected task label */}
                    <div className={`flowchart_float_selected${selectedTask ? ' flowchart_float_selected--active' : ''}`}>
                        {selectedTask
                            ? <><span className="flowchart_float_selected_dot" />{selectedTask.title}</>
                            : <em>Ninguna tarea seleccionada</em>
                        }
                    </div>

                    {/* Add Prerequisite button */}
                    <button
                        className={`flowchart_float_btn flowchart_float_btn--secondary${!selectedTask ? ' flowchart_float_btn--disabled' : ''}`}
                        onClick={() => selectedTask && setShowCreateModal(true)}
                        disabled={!selectedTask}
                        title={selectedTask ? 'Añadir Prerrequisito' : 'Selecciona una tarea primero'}
                    >
                        <MdAdd size={20} />
                        <span>Añadir Prerrequisito</span>
                    </button>
                </div>

                {/* Create Task Modal */}
                {showCreateModal && (
                    <CreateTaskModal
                        unlockedTask={isCreatingGoal ? null : selectedTask}
                        onClose={() => {
                            setShowCreateModal(false)
                            setIsCreatingGoal(false)
                        }}
                        onCreated={(newTask) => {
                            setTasks(prev => [...prev, newTask])
                            setShowCreateModal(false)
                            setIsCreatingGoal(false)

                            if (isCreatingGoal) {
                                const topLevelNodes = nodes.filter(n => n.position.y === 0)
                                const newX = topLevelNodes.length * 250
                                setNodes(prev => [...prev, buildNode(newTask, { x: newX, y: 0 })])
                                return
                            }

                            const targetNode = nodes.find(n => n.id === selectedTask.id.toString())
                            const targetPos = targetNode ? targetNode.position : { x: 0, y: 0 }
                            setNodes(prev => [...prev, buildNode(newTask, { x: targetPos.x, y: targetPos.y + 150 })])

                            const newEdge = {
                                id: `${newTask.id}-${selectedTask.id}`,
                                source: selectedTask.id.toString(),
                                target: newTask.id.toString(),
                                animated: true
                            }
                            setEdges(prev => [...prev, newEdge])
                        }}
                        teams={teams}
                        profiles={profiles}
                    />
                )}
            </div>
        </div>
    )
}

function CreateTaskModal({ unlockedTask, onClose, onCreated, teams, profiles }) {
    const [title, setTitle] = useState("")
    const [teamId, setTeamId] = useState("")
    const [assignedTo, setAssignedTo] = useState("")
    const [participantIds, setParticipantIds] = useState([])
    const [teamProfiles, setTeamProfiles] = useState(null) // null = no team selected yet
    const [loadingTeamProfiles, setLoadingTeamProfiles] = useState(false)
    const [id_usuario, setIdUsuario] = useState(null)

    // Load current user id from native Supabase session
    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setIdUsuario(session.user.id)
        })
    }, [])

    // Profiles list to display: filter by team when a team is selected
    const filteredProfiles = teamProfiles !== null ? teamProfiles : (profiles || [])

    // Set default assignedTo to current user if available
    useEffect(() => {
        if (id_usuario) {
            setAssignedTo(id_usuario)
        }
    }, [id_usuario])

    // When team changes, load that team's members and reset user selections
    async function handleTeamChange(newTeamId) {
        setTeamId(newTeamId)
        // Reset selections to avoid having values from a different team
        setAssignedTo("")
        setParticipantIds([])

        if (!newTeamId) {
            setTeamProfiles(null)
            return
        }

        setLoadingTeamProfiles(true)
        const { profiles: members } = await getTeamMembers(newTeamId)
        setTeamProfiles(members)
        setLoadingTeamProfiles(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()

        // 1. Create Task
        const { task, error } = await createTask({
            title,
            team_id: teamId || null,
            desbloquea: unlockedTask ? unlockedTask.id : null,
            assigned_to: assignedTo || null,
            created_by: id_usuario,
            status: "pendiente"
        })

        if (error) {
            console.error(error)
            if (error.code === "42501") {
                alert("No tienes permitido crear/editar/borrar esta tarea")
            } else {
                alert("Error creando la tarea: " + error.message)
            }
            return
        }

        // 2. Add Participants (tasks_profiles)
        if (participantIds.length > 0) {
            const { error: profileError } = await addProfilesToTask(task.id, participantIds)
            if (profileError) {
                console.error("Error adding participants:", profileError)
                alert("Tarea creada, pero hubo un error añadiendo participantes.")
            }
        }

        // Enrich task with profile data so avatars render immediately
        const allProfiles = filteredProfiles.length > 0 ? filteredProfiles : (profiles || [])
        const assignedProfile = assignedTo ? allProfiles.find(p => p.id === assignedTo) : null
        task.assigned_to_profile = assignedProfile
            ? { id: assignedProfile.id, full_name: assignedProfile.full_name, username: assignedProfile.username, avatar_url: assignedProfile.avatar_url }
            : null
        task.tasks_profiles = participantIds.map(pid => {
            const prof = allProfiles.find(p => p.id === pid)
            return prof
                ? { id_profile: pid, profiles: { id: prof.id, full_name: prof.full_name, username: prof.username, avatar_url: prof.avatar_url } }
                : { id_profile: pid, profiles: null }
        })

        onCreated(task)
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                {unlockedTask ? `Nuevo Prerrequisito para "${unlockedTask.title}"` : "Nuevo Objetivo"}
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <TextField
                        autoFocus
                        label="Título"
                        type="text"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <FormControl fullWidth>
                        <InputLabel>Equipo</InputLabel>
                        <Select
                            value={teamId}
                            label="Equipo"
                            onChange={(e) => handleTeamChange(e.target.value)}
                        >
                            <MenuItem value=""><em>Sin equipo</em></MenuItem>
                            {teams.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Asignado a</InputLabel>
                        <Select
                            value={assignedTo}
                            label="Asignado a"
                            onChange={(e) => setAssignedTo(e.target.value)}
                            disabled={loadingTeamProfiles}
                        >
                            <MenuItem value=""><em>Sin asignar</em></MenuItem>
                            {filteredProfiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.full_name || p.username || "Usuario"}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id="participants-label">Participantes</InputLabel>
                        <Select
                            labelId="participants-label"
                            multiple
                            value={participantIds}
                            onChange={(e) => {
                                const { target: { value } } = e;
                                setParticipantIds(
                                    typeof value === 'string' ? value.split(',') : value,
                                );
                            }}
                            input={<OutlinedInput label="Participantes" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const profile = filteredProfiles.find(p => p.id === value)
                                        return (
                                            <Chip key={value} label={profile?.full_name || profile?.username || "Usuario"} />
                                        )
                                    })}
                                </Box>
                            )}
                            disabled={loadingTeamProfiles}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                },
                            }}
                        >
                            {filteredProfiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.full_name || p.username || "Usuario"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions style={{ padding: 24 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit">
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loadingTeamProfiles}>
                        Crear
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}

function EditTaskModal({ task, teams, profiles, onClose, onUpdated }) {
    const [title, setTitle] = useState(task.title || "")
    const [description, setDescription] = useState(task.description || "")
    const [status, setStatus] = useState(task.status || "pendiente")
    const [priority, setPriority] = useState(task.priority ?? "")
    const [teamId, setTeamId] = useState(task.team_id ?? "")
    const [assignedTo, setAssignedTo] = useState(task.assigned_to || "")
    const [dueDate, setDueDate] = useState(task.due_date || "")
    const [participantIds, setParticipantIds] = useState(
        (task.tasks_profiles || []).map(tp => tp.id_profile)
    )
    const [saving, setSaving] = useState(false)
    const [teamProfiles, setTeamProfiles] = useState(null) // null = use all profiles
    const [loadingTeamProfiles, setLoadingTeamProfiles] = useState(false)
    const [id_usuario, setIdUsuario] = useState(null)

    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setIdUsuario(session.user.id)
        })
    }, [])

    // Load team members for the task's current team on mount
    useEffect(() => {
        if (task.team_id) {
            setLoadingTeamProfiles(true)
            getTeamMembers(task.team_id).then(({ profiles: members }) => {
                setTeamProfiles(members)
                setLoadingTeamProfiles(false)
            })
        }
    }, [])

    // Profiles list to display: filtered by team when a team is selected
    const filteredProfiles = teamProfiles !== null ? teamProfiles : (profiles || [])

    // When team changes, load that team's members and reset user-related selections
    async function handleTeamChange(newTeamId) {
        setTeamId(newTeamId)
        setAssignedTo("")
        setParticipantIds([])

        if (!newTeamId) {
            setTeamProfiles(null)
            return
        }

        setLoadingTeamProfiles(true)
        const { profiles: members } = await getTeamMembers(newTeamId)
        setTeamProfiles(members)
        setLoadingTeamProfiles(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setSaving(true)

        // 1. Update task fields
        const { task: updated, error } = await updateTask(task.id, {
            title,
            description: description || null,
            status,
            priority: priority === "" ? null : Number(priority),
            team_id: teamId || null,
            assigned_to: assignedTo || null,
            due_date: dueDate || null,
            last_edited_by: id_usuario,
            updated_at: new Date().toISOString(),
        })

        if (error) {
            setSaving(false)
            console.error(error)
            if (error.code === "42501") {
                alert("No tienes permitido editar esta tarea.")
            } else {
                alert("Error actualizando la tarea: " + error.message)
            }
            return
        }

        if (!updated) {
            setSaving(false)
            alert("No tienes permitido editar esta tarea.")
            return
        }

        // 2. Sync participants
        const { error: syncError } = await syncTaskProfiles(task.id, participantIds)
        if (syncError) {
            console.error("Error syncing participants:", syncError)
            alert("Tarea actualizada, pero hubo un error actualizando participantes.")
        }

        // Enrich updated task with participant profiles for immediate avatar rendering
        updated.tasks_profiles = participantIds.map(pid => {
            const prof = filteredProfiles.find(p => p.id === pid) || (profiles || []).find(p => p.id === pid)
            return prof
                ? { id_profile: pid, profiles: { id: prof.id, full_name: prof.full_name, username: prof.username, avatar_url: prof.avatar_url } }
                : { id_profile: pid, profiles: null }
        })

        setSaving(false)
        onUpdated(updated)
    }

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Editar Tarea</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <TextField
                        autoFocus
                        label="Título"
                        fullWidth
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                    <TextField
                        label="Descripción"
                        fullWidth
                        multiline
                        minRows={2}
                        maxRows={5}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select value={status} label="Estado" onChange={(e) => setStatus(e.target.value)}>
                            <MenuItem value="pendiente">Pendiente</MenuItem>
                            <MenuItem value="en_progreso">En Progreso</MenuItem>
                            <MenuItem value="completado">Completado</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Prioridad</InputLabel>
                        <Select value={priority} label="Prioridad" onChange={(e) => setPriority(e.target.value)}>
                            <MenuItem value=""><em>Sin prioridad</em></MenuItem>
                            <MenuItem value={1}>Alta</MenuItem>
                            <MenuItem value={2}>Media</MenuItem>
                            <MenuItem value={3}>Baja</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Equipo</InputLabel>
                        <Select value={teamId} label="Equipo" onChange={(e) => handleTeamChange(e.target.value)}>
                            <MenuItem value=""><em>Sin equipo</em></MenuItem>
                            {teams.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Asignado a</InputLabel>
                        <Select
                            value={assignedTo}
                            label="Asignado a"
                            onChange={(e) => setAssignedTo(e.target.value)}
                            disabled={loadingTeamProfiles}
                        >
                            <MenuItem value=""><em>Sin asignar</em></MenuItem>
                            {filteredProfiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.full_name || p.username || "Usuario"}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel id="edit-participants-label">Participantes</InputLabel>
                        <Select
                            labelId="edit-participants-label"
                            multiple
                            value={participantIds}
                            onChange={(e) => {
                                const { target: { value } } = e;
                                setParticipantIds(
                                    typeof value === 'string' ? value.split(',') : value,
                                );
                            }}
                            input={<OutlinedInput label="Participantes" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => {
                                        const profile = filteredProfiles.find(p => p.id === value) || (profiles || []).find(p => p.id === value)
                                        return (
                                            <Chip key={value} label={profile?.full_name || profile?.username || "Usuario"} />
                                        )
                                    })}
                                </Box>
                            )}
                            disabled={loadingTeamProfiles}
                            MenuProps={{
                                PaperProps: {
                                    style: {
                                        maxHeight: 224,
                                        width: 250,
                                    },
                                },
                            }}
                        >
                            {filteredProfiles.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.full_name || p.username || "Usuario"}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        label="Fecha límite"
                        type="date"
                        fullWidth
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </DialogContent>
                <DialogActions style={{ padding: 24 }}>
                    <Button onClick={onClose} variant="outlined" color="inherit" disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={saving}>
                        {saving ? "Guardando..." : "Guardar"}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}