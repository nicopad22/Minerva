"use client"
import { useState, useEffect } from "react"
import { getMyTasks } from "../utils/supa"
import { createClient } from "../utils/client"
import Link from "next/link"
import CalendarView from "@/app/components/CalendarView"

export default function Home() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      const id_usuario = session?.user?.id
      if (id_usuario) loadTasks(id_usuario)
    })
  }, [])

  async function loadTasks(userId) {
    const { tasks, error } = await getMyTasks(userId)
    if (error) {
      console.error("Error loading tasks:", error)
    } else {
      setTasks(tasks)
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#1a1a1a", marginBottom: 16 }}>
        Inicio
      </h1>

      <div className="home_grid">
        {/* Calendar Section */}
        <div style={{ background: "#fff", borderRadius: 8, border: "1px solid #e0e0e0", padding: 16 }}>
          <div style={{ height: "60vh", minHeight: 400 }}>
            <CalendarView />
          </div>
        </div>

        {/* My Tasks Section */}
        <div className="my_tasks_section">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#333", marginBottom: 12 }}>
            Mis trabajos
          </h2>

          <div className="tasks_list">
            {loading ? (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>Cargando tareas...</p>
            ) : tasks.length === 0 ? (
              <p style={{ color: "#666", fontSize: "0.9rem" }}>No tienes trabajos asignados.</p>
            ) : (
              tasks.map(task => (
                <Link href={`/tareas`} key={task.id} className="task_card_link">
                  <div className="task_mini_card">
                    <div className="task_mini_header">
                      <span className="task_mini_title">{task.title}</span>
                      <span className={`task_status_badge ${task.status?.toLowerCase()}`}>
                        {task.status || "Pendiente"}
                      </span>
                    </div>
                    {task.due_date && (
                      <div className="task_mini_date">
                        Vence: {new Date(task.due_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
