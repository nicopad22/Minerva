"use client"
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import esLocale from '@fullcalendar/core/locales/es';
import listPlugin from '@fullcalendar/list';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';

import { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, Modal, Typography } from '@mui/material';
import FormInasistencia from './FormInasistencia';
import { createClient } from '../utils/client';
import { confirmarAsistencia, getEventos } from '../utils/supa';
import dayjs from 'dayjs';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 600,
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: 'divider',
    boxShadow: 24,
    p: 4,
};

export default function CalendarView() {
    const [popoverOpen, setPopoverOpen] = useState("none")
    const [hidden, setHidden] = useState(true)
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })

    const [eventTitle, setEventTitle] = useState("")
    const [description, setDescription] = useState("")
    const [lugar, setLugar] = useState("")
    const [horaDisplay, setHoraDisplay] = useState("")
    const [eventId, setEventId] = useState()
    const [asistencia, setAsistencia] = useState(0)

    const [openM, setOpenM] = useState(false)
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        createClient().auth.getSession().then(({ data: { session } }) => {
            if (session?.user?.id) setUserId(session.user.id)
        })
    }, [])

    const fetchEvents = async () => {
        const userProfileId = userId;

        const { eventos, error } = await getEventos();
        if (error || !eventos) {
            console.error(error)
            setLoading(false)
            return;
        }

        // Attendance is embedded in each event by the joined query — no extra requests needed.
        const mappedEvents = eventos.map(ev => {
            const hInicio = dayjs(ev.inicio).format('HH:mm');
            const hFinal = ev.final ? dayjs(ev.final).format('HH:mm') : '';
            const horaD = ev.final ? `${hInicio} - ${hFinal}` : hInicio;

            const myRecord = (ev.eventos_usuarios ?? []).find(u => u.id_usuario === userProfileId);
            const myAsistencia = myRecord ? myRecord.asistencia : 0;

            return {
                title: ev.titulo,
                id_evento: ev.id_evento,
                start: ev.inicio,
                end: ev.final || ev.inicio,
                color: ev.obligatorio ? "red" : "blue",
                extendedProps: {
                    description: ev.descripcion,
                    lugar: ev.lugar,
                    horaDisplay: horaD,
                    asistencia: myAsistencia
                }
            };
        });

        setEvents(mappedEvents)
        setLoading(false)
    }

    useEffect(() => {
        fetchEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId])

    const handleConfirmar = async () => {
        const userProfileId = userId;
        if (!userProfileId) return alert("Error de sesión");

        const { error } = await confirmarAsistencia(eventId, userProfileId);
        if (error) {
            console.error("Error confirmando", error);
            alert("Error al Confirmar Asistencia");
        } else {
            alert("Asistencia Confirmada");
            // Update local state instead of full reload for speed
            setAsistencia(1);
            fetchEvents(); // Reload quietly to sync calendar colors etc. if needed
        }
    }

    const handleClose = () => {
        setOpenM(false)
    }

    return (
        <div style={{ height: "100%", position: "relative" }} >
            <Modal
                open={openM}
                onClose={handleClose}
            >
                <Box sx={style}>
                    <FormInasistencia
                        eventId={eventId}
                        handleClose={handleClose}
                        onSuccess={() => {
                            setAsistencia(2);
                            fetchEvents();
                        }}
                    />
                </Box>
            </Modal>

            <div style={{
                display: popoverOpen, zIndex: 5000, position: "fixed",
                top: popoverPosition.y, left: popoverPosition.x,
                width: 250
            }} hidden={hidden}>
                <Card elevation={4}>
                    <CardContent>
                        <Typography variant="h6" component="div">
                            {eventTitle}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{horaDisplay}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{lugar}</Typography>
                        <hr style={{ margin: '8px 0' }} />
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            {description || "Sin descripción."}
                        </Typography>

                        {asistencia !== 2 && (
                            <Button
                                onClick={() => {
                                    setOpenM(true)
                                    setPopoverOpen("none")
                                    setHidden(true)
                                }}
                                variant="outlined"
                                color="error"
                                fullWidth
                                sx={{ mb: 1, textTransform: 'none' }}
                            >
                                Justificar Inasistencia
                            </Button>
                        )}

                        {asistencia === 0 && (
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                onClick={handleConfirmar}
                                sx={{ textTransform: 'none' }}
                            >
                                Confirmar Asistencia
                            </Button>
                        )}

                        {asistencia === 1 && (
                            <Typography variant="body2" color="success.main" align="center" fontWeight="bold">
                                Asistencia Confirmada
                            </Typography>
                        )}

                        {asistencia === 2 && (
                            <Typography variant="body2" color="warning.main" align="center" fontWeight="bold">
                                Justificación Enviada
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div
                style={{ height: "100%", width: "100%" }}
                onMouseEnter={() => {
                    // Hide popover if we mouse over the calendar background
                    setPopoverOpen("none");
                    setHidden(true);
                }}
            >
                {loading && <Typography align="center" sx={{ p: 4 }}>Cargando calendario...</Typography>}

                <FullCalendar
                    themeSystem='bootstrap5'
                    plugins={[dayGridPlugin, listPlugin, bootstrap5Plugin]}
                    headerToolbar={{
                        start: 'title',
                        end: 'listMonth,dayGridMonth prev,next'
                    }}
                    initialView="dayGridMonth"
                    height={"100%"}
                    locale={esLocale}
                    events={events}
                    displayEventEnd={true}
                    eventTimeFormat={{
                        hour: '2-digit',
                        minute: '2-digit',
                        meridiem: false,
                        hour12: false
                    }}
                    eventMouseEnter={(mouseEnterInfo) => {
                        mouseEnterInfo.jsEvent.stopPropagation(); // Stop calendar background from hiding popover
                        setEventTitle(mouseEnterInfo.event.title)
                        setDescription(mouseEnterInfo.event.extendedProps.description)
                        setLugar(mouseEnterInfo.event.extendedProps.lugar)
                        setHoraDisplay(mouseEnterInfo.event.extendedProps.horaDisplay)
                        setEventId(mouseEnterInfo.event.extendedProps.id_evento)
                        setAsistencia(mouseEnterInfo.event.extendedProps.asistencia)

                        setPopoverPosition({
                            x: mouseEnterInfo.jsEvent.clientX - 15,
                            y: mouseEnterInfo.jsEvent.clientY - 15
                        })
                        setHidden(false)
                        setPopoverOpen("block")
                    }}
                />
            </div>
        </div>
    )
}
