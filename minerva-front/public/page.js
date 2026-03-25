"use client"
import { Autocomplete, Button, Chip, CircularProgress, FormControlLabel, ListItemText, MenuItem, OutlinedInput, TextField, Typography, styled } from "@mui/material";
import { useEffect, useState } from "react";
import Perfil from "@/app/utils/perfil";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import NextEventList from "@/app/components/EventUsersList";
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import EventUsersList from "@/app/components/EventUsersList";
import { DateTimePicker, DesktopDateTimePicker } from "@mui/x-date-pickers";
import CloseIcon from '@mui/icons-material/Close';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import FormEvento from "@/app/components/FormEvento";
import es from "dayjs/locale/es";
dayjs.extend(utc);

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 1200,
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};
const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
            width: 250,
        },
    },
};

const names = [
    'Oliver Hansen',
    'Van Henry',
    'April Tucker',
    'Ralph Hubbard',
    'Omar Alexander',
    'Carlos Abbott',
    'Miriam Wagner',
    'Bradley Wilkerson',
    'Virginia Andrews',
    'Kelly Snyder',
];

export default function eventos() {
    const [openCreateModal, setOpenCreateModal] = useState(false)
    const [openEditModal, setOpenEditModal] = useState(false)
    const [openDeleteModal, setOpenDeleteModal] = useState(false)
    const [openAsistenciaModal, setOpenAsistenciaModal] = useState(false)
    const [nextEventUsers, setNextEventUsers] = useState({
        confirmados: [],
        justificados: [],
        nr: []
    })
    const [selectedEventUsers, setSelectedEventUsers] = useState({
        confirmados: [],
        justificados: [],
        nr: []
    })
    const [selectedEvent, setSelectedEvent] = useState({
        id_evento: 0,
        titulo: "",
        descripcion: "",
        lugar: "",
        inicio: "",
        final: "",
        obligatorio: 0,
        notificar: 0,
        createdAt: 0,
        confirmados: 0,
        justificados: 0,
        nr: 0
    })
    const [nextEvent, setNextEvent] = useState({
        id_evento: 0,
        titulo: "",
        descripcion: "",
        lugar: "",
        inicio: "",
        final: "",
        obligatorio: 0,
        notificar: 0,
        createdAt: 0,
        confirmados: [],
        justificados: [],
        nr: []
    })
    const [originalEventsList, setOriginalEventsList] = useState([{
        id_evento: 0,
        titulo: "",
        descripcion: "",
        lugar: "",
        inicio: "",
        final: "",
        obligatorio: 0,
        notificar: 0,
        createdAt: 0,
        confirmados: 0,
        justificados: 0,
        nr: 0
    }])
    const [displayedEvents, setDisplayedEvents] = useState([{
        id_evento: 0,
        titulo: "",
        descripcion: "",
        lugar: "",
        inicio: "",
        final: "",
        obligatorio: 0,
        notificar: 0,
        createdAt: 0,
        confirmados: 0,
        justificados: 0,
        nr: 0
    }])
    const [personName, setPersonName] = useState([]);

    const handleCreateClose = () => {
        setOpenCreateModal(false)
    }
    const handleEditClose = () => {
        setOpenEditModal(false)
    }


    useEffect(() => {
        fetch("https://www.sechstela.cl/public/api/getEventUsers.php", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                token: Perfil().getToken().token,
                id_usuario: Perfil().getToken().id_usuario,
                id_evento: "next"
            })
        }).then((res) => res.json()).then((data) => {
            if (data.codigo == 1) {
                setNextEventUsers(data.data)
            } else if (data.codigo == 2) {
                setNextEventUsers(false)
            }
            fetch("https://www.sechstela.cl/public/api/getAllEvents.php", {
                method: "POST",
                headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify({
                    token: Perfil().getToken().token,
                    id_usuario: Perfil().getToken().id_usuario,
                })
            }).then((response) => response.json()).then((dataEvents) => {

                setOriginalEventsList(dataEvents.data.reverse())
                setDisplayedEvents(dataEvents.data)
                const nextEventVar = dataEvents.data.find((event) => {
                    return event.id_evento == data.data.id_evento
                })
                setNextEvent(nextEventVar)

            })
        })
    }, [])


    return (
        <div className="main_container" style={{ paddingBottom: 60 }}>
            <Modal
                open={openCreateModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                onClose={() => { setOpenCreateModal(false) }}
            >
                <Box sx={style}>
                    <FormEvento handleClose={handleCreateClose} />
                </Box>
            </Modal>
            <Modal
                open={openEditModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                onClose={() => { setOpenEditModal(false) }}
            >
                <Box sx={style}>
                    <FormEvento handleClose={handleEditClose} evento={selectedEvent} />
                </Box>
            </Modal>
            <Modal
                open={openAsistenciaModal}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
                onClose={() => { setOpenAsistenciaModal(false) }}
            >
                <Box sx={style}>
                    <Typography variant="h5">{selectedEvent.titulo} </Typography>
                    <Typography variant="h6" suppressHydrationWarning>{new Date(selectedEvent.inicio * 1000).toLocaleString()}</Typography>
                    <hr />
                    <EventUsersList eventUsers={selectedEventUsers} />
                </Box>
            </Modal>
            {nextEventUsers &&
                <div>
                    <Typography variant="h4">Proximo Evento</Typography>
                    <Typography variant="h5">{nextEvent.titulo} </Typography>
                    <Typography variant="h6" suppressHydrationWarning >{new Date(nextEvent.inicio * 1000).toLocaleString()}</Typography>
                    <hr />
                    <EventUsersList eventUsers={nextEventUsers} />
                </div>
            }
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
                <Typography variant="h4">Eventos</Typography>
                <Button color="success" onClick={() => {
                    setOpenCreateModal(true)
                }}>
                    Crear Evento
                    <AddIcon />
                </Button>
            </div>
            <hr style={{ marginBottom: 10 }} />
            <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="simple table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Titulo</TableCell>
                            <TableCell>Descripcion</TableCell>
                            <TableCell>Lugar</TableCell>
                            <TableCell>Inicio</TableCell>
                            <TableCell>Final</TableCell>
                            <TableCell align="right">Confirmados</TableCell>
                            <TableCell align="right">Justificados</TableCell>
                            <TableCell align="right">NR</TableCell>
                            <TableCell align="center">Asistencia</TableCell>
                            <TableCell align="center">Editar</TableCell>
                            <TableCell align="center">Eliminar</TableCell>

                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayedEvents.map((row) => (
                            <TableRow
                                key={row.id_evento}
                                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            >
                                <TableCell component="th" scope="row">
                                    {row.titulo}
                                </TableCell>
                                <TableCell>{row.descripcion}</TableCell>
                                <TableCell>{row.lugar}</TableCell>
                                <TableCell suppressHydrationWarning>{new Date(row.inicio * 1000).toLocaleString()}</TableCell>
                                <TableCell suppressHydrationWarning>{row.final && new Date(row.final * 1000).toLocaleString()}</TableCell>
                                <TableCell align="right">{row.confirmados}</TableCell>
                                <TableCell align="right">{row.justificados}</TableCell>
                                <TableCell align="right">{row.nr}</TableCell>
                                <TableCell>
                                    <Button color="success" onClick={() => {
                                        fetch("https://www.sechstela.cl/public/api/getEventUsers.php", {
                                            method: "POST",
                                            headers: { 'Content-Type': 'application/json', },
                                            body: JSON.stringify({
                                                token: Perfil().getToken().token,
                                                id_usuario: Perfil().getToken().id_usuario,
                                                id_evento: row.id_evento
                                            })
                                        }).then((res) => res.json()).then((data) => {
                                            if (data.codigo == 1) {
                                                setSelectedEventUsers(data.data)
                                                setSelectedEvent(row)
                                                console.log(data.data)
                                                setOpenAsistenciaModal(true)
                                            }
                                        })
                                    }}>
                                        <RecentActorsIcon />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button color="warning" onClick={() => {
                                        setOpenEditModal(true)
                                        setSelectedEvent(row)
                                    }}>
                                        <EditIcon />
                                    </Button>
                                </TableCell>
                                <TableCell>
                                    <Button color="error" onClick={() => {
                                        const deleteEvent = prompt("Esta seguro que desea eliminar el evento " + row.titulo + '?\nEsta accion no se puede deshacer\nEscriba "Eliminar" si desea continuar')
                                        setSelectedEvent(row)
                                        if (deleteEvent == "Eliminar") {
                                            fetch("https://www.sechstela.cl/public/api/deleteEvent.php", {
                                                method: "POST",
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    id_usuario: Perfil().getToken().id_usuario,
                                                    token: Perfil().getToken().token,
                                                    id_evento: row.id_evento,
                                                })
                                            }).then(res => res.json())
                                                .then(data => {
                                                    if (data.codigo === 1) {
                                                        alert("Evento Eliminado")
                                                        location.reload();
                                                    }
                                                });

                                        } else {
                                            alert("Evento No Eliminado")
                                        }
                                    }}>
                                        <DeleteForeverIcon />
                                    </Button>
                                </TableCell>

                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </div >
    );
}
