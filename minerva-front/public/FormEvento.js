"use client"
import { Autocomplete, Button, Chip, CircularProgress, FormControlLabel, ListItemText, MenuItem, OutlinedInput, TextField, Typography, styled } from "@mui/material";
import { useEffect, useState } from "react";
import Perfil from "@/app/utils/perfil";
import { DateTimePicker, DesktopDateTimePicker } from "@mui/x-date-pickers";
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import Checkbox from '@mui/material/Checkbox';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc);
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

export default function FormEvento({ evento, handleClose }) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedUsuariosDisplay, setSelectedUsuariosDisplay] = useState([])
    const [selectedUsuarios, setSelectedUsuarios] = useState([])
    const [archivos, setArchivos] = useState([])
    const [obligatorio, setObligatorio] = useState(false)
    const [notificar, setNotificar] = useState(false)
    const [checkedAll, setCheckedAll] = useState(false)
    const [checkedOficiales, setCheckedOficiales] = useState(false)
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [title, setTitle] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [lugar, setLugar] = useState("")
    const [usuarios, setUsuarios] = useState([])

    const [oficiales, setOficiales] = useState([])

    useEffect(() => {
        getUsers()
        if (evento) {
            setTitle(evento.titulo)
            setStartDate(dayjs.unix(evento.inicio).tz("America/Santiago"))
            setEndDate(evento.final ? dayjs(evento.final) : null)
            setDescripcion(evento.descripcion ? evento.descripcion : "")
            setLugar(evento.lugar)
            setObligatorio(evento.obligatorio == 1 ? true : false)
            console.log(evento)

            setNotificar(evento.notificar == 1 ? true : false)
            fetch("https://www.sechstela.cl/public/api/getEventUsers.php", {
                method: "POST",
                body: JSON.stringify({
                    token: Perfil().getToken().token,
                    id_usuario: Perfil().getToken().id_usuario,
                    id_evento: evento.id_evento
                }),
            }).then((res) => res.json()).then((data) => {
                if (data.codigo == 1) {
                    const users = data.data.confirmados.concat(data.data.justificados.concat(data.data.nr))
                    setSelectedUsuarios(users)
                }
            })


        }
    }, [])

    function getUsers() {
        fetch("https://www.sechstela.cl/public/api/getUsersData.php", {
            method: "POST",
            headers: { 'Content-Type': 'application/json', },
            body: JSON.stringify({
                token: Perfil().getToken().token,
                id_usuario: Perfil().getToken().id_usuario,
            })
        }).then((res) => res.json()).then((data) => {
            if (data.codigo == 1) {
                const sortedArray = data.data.sort((a, b) => (a.clave - b.clave))
                setUsuarios(sortedArray)
            }
            const newOficiales = data.data.filter((user) => {
                if (user.cargo != "" && user.cargo != "Maquinista" && user.cargo != "Superintendente" && user.cargo != "Comandante") {
                    return true
                } else {
                    return false
                }
            })
            setOficiales(newOficiales)
        })
    }

    return (
        <div className='formInasistencia_container'>

            {isLoading && (
                <CircularProgress
                    size={60}
                    sx={{
                        color: green[500],
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-40px',
                        marginLeft: '-40px',
                    }}
                />
            )}
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30 }}>
                <TextField
                    sx={{ width: 250 }}
                    id="outlined-multiline-flexible"
                    label="Titulo"
                    multiline
                    required
                    maxRows={4}
                    value={title}
                    onChange={(e) => { setTitle(e.target.value) }}
                />
                <DesktopDateTimePicker
                    sx={{ width: 250 }}
                    label="Fecha y Hora de Inicio"
                    required
                    value={startDate}
                    onChange={(newStartDate) => setStartDate(newStartDate)}
                />
                <DesktopDateTimePicker
                    sx={{ width: 250 }}
                    label="Fecha y Hora de Termino"
                    value={endDate}

                    onChange={(newEndDate) => setEndDate(newEndDate)}
                />

            </div>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30 }}>
                <TextField
                    sx={{ width: 400 }}
                    label="Descripcion"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                />
                <TextField
                    sx={{ width: 400 }}
                    label="Lugar"
                    required
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                />

            </div>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30, alignItems: "center" }}>
                <Autocomplete
                    multiple
                    sx={{ width: 600 }}
                    id="tags-outlined"
                    options={usuarios}
                    getOptionLabel={(option) => option.clave + " - " + option.nombre + " " + option.apellido_p + " " + option.apellido_m}
                    value={selectedUsuarios}
                    onChange={(e, value) => {
                        setSelectedUsuarios(value)
                        if (value.length == usuarios.length) {
                            setCheckedAll(true)
                        } else {
                            setCheckedAll(false)
                        }

                        let number = 0
                        for (let user of oficiales) {
                            if (value.includes(user)) {
                                number++
                            } else {
                                setCheckedOficiales(false)
                                break
                            }
                        }
                        if (number == oficiales.length) {
                            setCheckedOficiales(true)
                        }
                    }}
                    disableCloseOnSelect
                    disableClearable
                    limitTags={4}
                    renderTags={(value, getTagProps) => {
                        const numTags = value.length;

                        const tags = value.slice(0, 5).map((option, index) => {
                            return (
                                <Chip label={option.clave} {...getTagProps({ index })} key={index} />
                            )
                        })
                        return (
                            <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
                                {tags}
                                {numTags - 5 > 0 && <Typography >  +{numTags - 5}</Typography>}
                            </div>
                        )

                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Usuarios"
                            placeholder="Agregar Usuarios"
                        />
                    )}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <FormControlLabel control={<Checkbox
                        checked={checkedAll}
                        onChange={() => {
                            setCheckedAll(!checkedAll)
                            if (checkedAll) {
                                setCheckedOficiales(false)
                                setSelectedUsuarios([])
                            } else {
                                setCheckedOficiales(true)
                                setSelectedUsuarios(usuarios)
                            }
                        }}
                        inputProps={{ 'aria-label': 'controlled' }}

                    />} label="Seleccionar Todos" />

                    <FormControlLabel control={<Checkbox
                        checked={checkedOficiales}
                        onChange={() => {
                            setCheckedOficiales(!checkedOficiales)
                            if (checkedOficiales) {
                                setSelectedUsuarios(selectedUsuarios.filter((user) => {
                                    return user.cargo == ""
                                }))
                                setCheckedAll(false)
                            } else {
                                setSelectedUsuarios(oficiales)
                            }
                        }}
                        inputProps={{ 'aria-label': 'controlled' }}
                    />} label="Seleccionar Oficiales" />

                </div>

            </div>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30, alignItems: "center" }}>
                <FormControlLabel control={<Checkbox
                    checked={obligatorio}
                    onChange={() => {
                        setObligatorio(!obligatorio)
                    }}
                    inputProps={{ 'aria-label': 'controlled' }}

                />} label="Obligatorio" />

                <FormControlLabel control={<Checkbox
                    checked={notificar}
                    onChange={() => {
                        setNotificar(!notificar)
                    }}
                    inputProps={{ 'aria-label': 'controlled' }}
                />} label="Notificar al correo 48Hrs antes" />

            </div>


            <Button variant="text" onClick={() => {
                if (evento) {
                    fetch("https://www.sechstela.cl/public/api/editEvento.php", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_usuario: Perfil().getToken().id_usuario,
                            token: Perfil().getToken().token,
                            id_evento: evento.id_evento,
                            titulo: title,
                            descripcion: descripcion,
                            inicio: startDate.unix(),
                            final: endDate ? endDate.unix() : null,
                            lugar: lugar,
                            obligatorio: obligatorio,
                            notificar: notificar,
                            usuarios: selectedUsuarios.map(user => user.id_usuario)
                        })
                    }).then(res => res.json())
                        .then(data => {
                            if (data.codigo === 1) {
                                handleClose();
                                location.reload();
                            }
                        });

                } else {

                    fetch("https://www.sechstela.cl/public/api/createEvent.php", {
                        method: "POST",
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id_usuario: Perfil().getToken().id_usuario,
                            token: Perfil().getToken().token,
                            titulo: title,
                            descripcion: descripcion,
                            inicio: startDate.unix(),
                            final: endDate ? endDate.unix() : null,
                            lugar: lugar,
                            obligatorio: obligatorio,
                            notificar: notificar,
                            usuarios: selectedUsuarios.map(user => user.id_usuario)
                        })
                    }).then(res => res.json())
                        .then(data => {
                            if (data.codigo === 1) {
                                handleClose();
                                location.reload();
                            }
                        });
                }
            }}>{evento ? "Editar" : "Crear"}</Button>

        </div>
    );
}