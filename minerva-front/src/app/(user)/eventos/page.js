"use client"
import { Button, CircularProgress, Modal, Box, Typography, Tabs, Tab } from "@mui/material";
import { useEffect, useState } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { MdDeleteForever, MdEdit, MdAdd, MdRecentActors } from "react-icons/md";
import dayjs from 'dayjs';
import { createClient } from "@/app/utils/client";
import { getEventos, deleteEvento, getEventUsers } from "@/app/utils/supa";
import FormEvento from "@/app/components/FormEvento";
import EventUsersList from "@/app/components/EventUsersList";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: { xs: '90%', md: 1000 },
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: 'background.paper',
    border: '2px solid',
    borderColor: 'divider',
    boxShadow: 24,
    p: 4,
};

export default function EventosPage() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [openCreate, setOpenCreate] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [openAsistencia, setOpenAsistencia] = useState(false);

    // Selected event state
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [selectedEventUsers, setSelectedEventUsers] = useState({ confirmados: [], justificados: [], nr: [] });

    const fetchAllEvents = async () => {
        setLoading(true);
        const { eventos, error } = await getEventos();
        if (!error && eventos) {
            setEvents(eventos);
        }
        setLoading(false);
    }

    useEffect(() => {
        fetchAllEvents();
    }, []);

    const handleAsistenciaClick = async (evento) => {
        setSelectedEvent(evento);
        const { data, error } = await getEventUsers(evento.id_evento);
        if (!error && data) {
            setSelectedEventUsers(data);
            setOpenAsistencia(true);
        } else {
            alert("Error al cargar asistentes");
        }
    }

    const handleDeleteClick = async (evento) => {
        const confirmDelete = prompt(`Esta seguro que desea eliminar el evento "${evento.titulo}"?\nEscriba "Eliminar" si desea continuar`)
        if (confirmDelete === "Eliminar") {
            const { data: { session } } = await createClient().auth.getSession()
            const userProfileId = session?.user?.id;
            const { error } = await deleteEvento(evento.id_evento, userProfileId);
            if (!error) {
                alert("Evento Eliminado");
                fetchAllEvents();
            } else {
                alert("Error al eliminar");
            }
        }
    }

    return (
        <div className="main_container" style={{ padding: '20px', paddingBottom: 60 }}>
            {/* Create Modal */}
            <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
                <Box sx={style}>
                    <Typography variant="h5" mb={2}>Crear Evento</Typography>
                    <FormEvento handleClose={() => setOpenCreate(false)} onSuccess={fetchAllEvents} />
                </Box>
            </Modal>

            {/* Edit Modal */}
            <Modal open={openEdit} onClose={() => setOpenEdit(false)}>
                <Box sx={style}>
                    <Typography variant="h5" mb={2}>Editar Evento</Typography>
                    {selectedEvent && <FormEvento evento={selectedEvent} handleClose={() => setOpenEdit(false)} onSuccess={fetchAllEvents} />}
                </Box>
            </Modal>

            {/* Asistencia Modal */}
            <Modal open={openAsistencia} onClose={() => setOpenAsistencia(false)}>
                <Box sx={style}>
                    {selectedEvent && (
                        <>
                            <Typography variant="h5">{selectedEvent.titulo}</Typography>
                            <Typography variant="h6">{dayjs(selectedEvent.inicio).format('DD/MM/YYYY HH:mm')}</Typography>
                            <hr style={{ margin: '15px 0' }} />
                            <EventUsersList eventUsers={selectedEventUsers} />
                        </>
                    )}
                </Box>
            </Modal>

            {/* Header */}
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                <Typography variant="h4">Gestión de Eventos</Typography>
                <Button variant="contained" color="success" onClick={() => setOpenCreate(true)} startIcon={<MdAdd size={20} />}>
                    Crear Evento
                </Button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '40px 0' }}>
                    <CircularProgress />
                </div>
            ) : (
                <TableContainer component={Paper}>
                            <Table sx={{ minWidth: 650 }} aria-label="events table">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Título</TableCell>
                                        <TableCell>Descripción</TableCell>
                                        <TableCell>Lugar</TableCell>
                                        <TableCell>Inicio</TableCell>
                                        <TableCell>Final</TableCell>
                                        <TableCell align="center">Asistencia</TableCell>
                                        <TableCell align="center">Editar</TableCell>
                                        <TableCell align="center">Eliminar</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {events.map((row) => (
                                        <TableRow key={row.id_evento} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell component="th" scope="row">
                                                {row.titulo}
                                            </TableCell>
                                            <TableCell>{row.descripcion}</TableCell>
                                            <TableCell>{row.lugar}</TableCell>
                                            <TableCell>{dayjs(row.inicio).format('DD/MM/YY HH:mm')}</TableCell>
                                            <TableCell>{row.final ? dayjs(row.final).format('DD/MM/YY HH:mm') : ''}</TableCell>
                                            <TableCell align="center">
                                                <Button color="success" onClick={() => handleAsistenciaClick(row)}>
                                                    <MdRecentActors size={24} />
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button color="warning" onClick={() => {
                                                    setSelectedEvent(row);
                                                    setOpenEdit(true);
                                                }}>
                                                    <MdEdit size={24} />
                                                </Button>
                                            </TableCell>
                                            <TableCell align="center">
                                                <Button color="error" onClick={() => handleDeleteClick(row)}>
                                                    <MdDeleteForever size={24} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {events.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                                                No hay eventos activos.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
            )}
        </div>
    );
}
