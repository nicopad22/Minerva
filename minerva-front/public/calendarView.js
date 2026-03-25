"use client"


import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // needs additional webpack config!
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid' // a plugin!
import esLocale from '@fullcalendar/core/locales/es-us';
import listPlugin from '@fullcalendar/list';
import { useEffect, useRef, useState } from 'react';
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import Popover from '@mui/material/Popover';
import { Box, Button, Divider, Tooltip, Typography } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Modal from '@mui/material/Modal';
import FormInasistencia from './FormInasistencia';
import Perfil from '../utils/perfil';


export default function Calendar() {
    const [popoverOpen, setPopoverOpen] = useState("none")
    const [hidden, setHidden] = useState(true)
    const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
    const [eventTitle, setEventTitle] = useState("")
    const [description, setDescription] = useState("")
    const [lugar, setLugar] = useState("")
    const [horaDisplay, setHoraDisplay] = useState("")
    const [eventId, setEventId] = useState()
    const [openM, setOpenM] = useState(false)
    const [events, setEvents] = useState([])
    const [asistencia, setAsistencia] = useState(0)
    const [loading, setLoading] = useState(true)


    useEffect(() => {
        fetch("https://www.sechstela.cl/public/api/getUserCalendarEvents.php", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify(Perfil().getToken())
        }).then((res) => res.json()).then((data) => {
            const neventos = []
            data.data.map((event) => {
                const hInicio = new Date(event.inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let horaDisplay = hInicio
                if (event.final) {
                    const hFinal = new Date(event.final).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    horaDisplay = hInicio + " - " + hFinal
                }
                const newEvent = {
                    title: event.titulo,
                    id_evento: event.id_evento,
                    start: event.inicio * 1000,
                    end: event.final *1000,
                    color: (event.obligatorio == 1 ? "red" : "blue"),
                    description: event.descripcion,
                    lugar: event.lugar,
                    horaDisplay: horaDisplay,
                    asistencia: event.asistencia
                }
                neventos.push(newEvent)
            })
            setEvents(neventos)
            setLoading(false)
        })

    }, [])


    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };
    function handleClose(){
        setOpenM(false)
    }


    return (
        <div style={{ height: "100%" }} >
            <Modal
                open={openM}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                onClose={() => { setOpenM(false) }}
            >
                <Box sx={style}>
                    <FormInasistencia handleClose={handleClose} eventId={eventId} />
                </Box>
            </Modal>
            <div style={{
                display: { popoverOpen }, zIndex: 5000, position: "absolute",
                top: popoverPosition.y, left: popoverPosition.x,
                height: 200, width: 200
            }} hidden={hidden}
            >
                <Card >
                    <CardContent>
                        <Typography variant="h6" component="div">
                            {eventTitle}

                        </Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{horaDisplay}</Typography>
                        <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>{lugar}</Typography>
                        <hr />
                        <Typography variant="body2">
                            {description}
                        </Typography>
                        {asistencia != 2 &&
                            <Button onClick={() => {
                                setOpenM(true)
                                setPopoverOpen("none")
                                setHidden(true)
                            }} variant="outlined" color='error'
                                style={{ height: 35, fontSize: 12, lineHeight: 1, marginBottom: 5 }}>Justificar Inasistencia</Button>
                        }
                        {asistencia == 0 &&
                            <Button variant="outlined" style={{ height: 35, fontSize: 12, lineHeight: 1 }} onClick={() => {
                                fetch("https://www.sechstela.cl/public/api/confirmarAsistencia.php", {
                                    method: "POST",
                                    body: JSON.stringify({
                                        token: Perfil().getToken().token,
                                        id_usuario: Perfil().getToken().id_usuario,
                                        id_evento: eventId
                                    })
                                }).then((rsp) => rsp.json())
                                    .then((data) => {
                                        if (data.codigo == 1) {
                                            alert("Asistencia Confirmada")
                                            const newEvents = events.map((event) => {
                                                if (event.id_evento == eventId) {
                                                    return { ...event, asistencia: 1 }
                                                }
                                                return event
                                            })
                                            setEvents(newEvents)
                                        } else {
                                            alert("Error al Confirmar Asistencia")
                                        }
                                    })
                            }} >Confirmar Asistencia</Button>
                        }
                        {asistencia == 1 &&
                            <div>
                                Asistencia Confirmada
                            </div>}
                        {asistencia == 2 &&
                            <div>
                                Justificacion Enviada
                            </div>}

                    </CardContent>
                </Card>
            </div>
            <div onMouseEnter={() => {
                console.log("ok")
                setPopoverOpen("none")
                setHidden(true)
                console.log(events)
            }} style={{ height: "100%", width: "100%" }} >
                <FullCalendar
                    themeSystem='bootstrap5'
                    plugins={[dayGridPlugin, listPlugin, bootstrap5Plugin]}
                    header={true}
                    displayEventEnd={true}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        start: 'title', // will normally be on the left. if RTL, will be on the right
                        end: 'listMonth,dayGridMonth prev,next' // will normally be on the right. if RTL, will be on the left
                    }}
                    height={"100%"}
                    locale={esLocale}
                    eventMouseEnter={(mouseEnterInfo) => {

                        setEventTitle(mouseEnterInfo.event.title)
                        setDescription(mouseEnterInfo.event.extendedProps.description)
                        setLugar(mouseEnterInfo.event.extendedProps.lugar)

                        setHoraDisplay(mouseEnterInfo.event.extendedProps.horaDisplay)

                        setPopoverPosition({ x: mouseEnterInfo.jsEvent.pageX - 10, y: mouseEnterInfo.jsEvent.pageY - 50 })
                        setHidden(false)
                        setPopoverOpen("block")
                        setEventId(mouseEnterInfo.event.extendedProps.id_evento)
                        setAsistencia(mouseEnterInfo.event.extendedProps.asistencia)
                    }}
                    eventTimeFormat={{
                        hour: 'numeric',
                        minute: '2-digit',
                        meridiem: false
                    }}
                    events={events}
                />
            </div>

        </div>

    )
}