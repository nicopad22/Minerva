"use client"
import { Autocomplete, Button, Chip, CircularProgress, FormControlLabel, TextField, Typography, styled } from "@mui/material";
import { useEffect, useState } from "react";
import Perfil from "@/app/utils/perfil";
import { DesktopDateTimePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import Checkbox from '@mui/material/Checkbox';
import utc from 'dayjs/plugin/utc';
import dayjs from 'dayjs';
import { getAllProfiles, createEvento, updateEvento, getEventUsers } from "@/app/utils/supa";

dayjs.extend(customParseFormat)
dayjs.extend(timezone)
dayjs.extend(utc);

export default function FormEvento({ evento, handleClose, onSuccess }) {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedUsuarios, setSelectedUsuarios] = useState([])
    const [obligatorio, setObligatorio] = useState(false)
    const [notificar, setNotificar] = useState(false)
    const [checkedAll, setCheckedAll] = useState(false)
    const [startDate, setStartDate] = useState(null)
    const [endDate, setEndDate] = useState(null)
    const [title, setTitle] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [lugar, setLugar] = useState("")
    
    // Lista total de usuarios obtenida de supabase
    const [usuarios, setUsuarios] = useState([])

    useEffect(() => {
        getUsers()
        if (evento) {
            setTitle(evento.titulo)
            setStartDate(dayjs(evento.inicio))
            setEndDate(evento.final ? dayjs(evento.final) : null)
            setDescripcion(evento.descripcion || "")
            setLugar(evento.lugar || "")
            setObligatorio(evento.obligatorio)
            setNotificar(evento.notificar)

            // Obtener los usuarios asignados al evento
            getEventUsers(evento.id_evento).then(({ data, error }) => {
                if (data && !error) {
                    const allAssigned = [
                        ...(data.confirmados || []),
                        ...(data.justificados || []),
                        ...(data.nr || [])
                    ]
                    // Mantener el arreglo de perfiles completos
                    setSelectedUsuarios(allAssigned)
                }
            })
        }
    }, [evento])

    async function getUsers() {
        const { profiles, error } = await getAllProfiles()
        if (!error && profiles) {
            // Ordenar alfabeticamente o por otra logica (antigua era clave)
            // Asumimos que profiles tiene clave o full_name
            const sortedArray = profiles.sort((a, b) => {
                const nameA = a.full_name || a.username || "";
                const nameB = b.full_name || b.username || "";
                return nameA.localeCompare(nameB)
            })
            setUsuarios(sortedArray)
        }
    }

    const handleSubmit = async () => {
        setIsLoading(true)
        const userProfileId = Perfil()?.getToken()?.id_usuario;

        const eventoData = {
            titulo: title,
            descripcion: descripcion,
            inicio: startDate ? startDate.toISOString() : new Date().toISOString(),
            final: endDate ? endDate.toISOString() : null,
            lugar: lugar,
            obligatorio: obligatorio,
            notificar: notificar,
        }

        const selectedIds = selectedUsuarios.map(u => u.id)

        if (evento) {
            // Edit
            const { error } = await updateEvento(evento.id_evento, eventoData, selectedIds)
            setIsLoading(false)
            if (!error) {
                handleClose()
                if (onSuccess) onSuccess()
            } else {
                console.error("Error actualizando evento", error)
                alert("Error al editar")
            }
        } else {
            // Create
            eventoData.created_by = userProfileId
            const { error } = await createEvento(eventoData, selectedIds)
            setIsLoading(false)
            if (!error) {
                handleClose()
                if (onSuccess) onSuccess()
            } else {
                console.error("Error creando evento", error)
                alert("Error al crear")
            }
        }
    }

    return (
        <div className='formInasistencia_container' style={{ position: 'relative' }}>
            {isLoading && (
                <CircularProgress
                    size={60}
                    sx={{
                        color: 'primary.main',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginTop: '-30px',
                        marginLeft: '-30px',
                        zIndex: 10
                    }}
                />
            )}
            
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30, gap: 10 }}>
                <TextField
                    sx={{ width: 250 }}
                    label="Titulo"
                    multiline
                    required
                    maxRows={4}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                />
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DesktopDateTimePicker
                        sx={{ width: 250 }}
                        label="Fecha y Hora de Inicio"
                        value={startDate}
                        onChange={(newStartDate) => setStartDate(newStartDate)}
                        disabled={isLoading}
                    />
                    <DesktopDateTimePicker
                        sx={{ width: 250 }}
                        label="Fecha y Hora de Termino"
                        value={endDate}
                        onChange={(newEndDate) => setEndDate(newEndDate)}
                        disabled={isLoading}
                    />
                </LocalizationProvider>
            </div>
            
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30, gap: 10 }}>
                <TextField
                    sx={{ width: 400 }}
                    label="Descripcion"
                    multiline
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    disabled={isLoading}
                />
                <TextField
                    sx={{ width: 400 }}
                    label="Lugar"
                    required
                    value={lugar}
                    onChange={(e) => setLugar(e.target.value)}
                    disabled={isLoading}
                />
            </div>
            
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-evenly", marginBottom: 30, alignItems: "center", gap: 10 }}>
                <Autocomplete
                    multiple
                    sx={{ width: 600 }}
                    options={usuarios}
                    getOptionLabel={(option) => {
                        return option.full_name || option.username || option.nombre || "Usuario Desconocido"
                    }}
                    value={selectedUsuarios}
                    // isOptionEqualToValue allows proper matching with fetched selected users
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(e, value) => {
                        setSelectedUsuarios(value)
                        if (value.length === usuarios.length && usuarios.length > 0) {
                            setCheckedAll(true)
                        } else {
                            setCheckedAll(false)
                        }
                    }}
                    disableCloseOnSelect
                    disableClearable
                    limitTags={4}
                    renderTags={(value, getTagProps) => {
                        const numTags = value.length;
                        const tags = value.slice(0, 5).map((option, index) => {
                            const label = option.full_name || option.username || option.nombre || "User"
                            return (
                                <Chip label={label} {...getTagProps({ index })} key={index} size="small" />
                            )
                        })
                        if (numTags > 5) {
                            tags.push(
                                <Typography key="counter" variant="body2" sx={{ ml: 1, alignSelf: "center" }}>
                                    +{numTags - 5}
                                </Typography>
                            )
                        }
                        return tags;
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Usuarios"
                            placeholder="Agregar Usuarios"
                        />
                    )}
                    disabled={isLoading}
                />
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <FormControlLabel control={
                        <Checkbox
                            checked={checkedAll}
                            onChange={() => {
                                setCheckedAll(!checkedAll)
                                if (!checkedAll) {
                                    setSelectedUsuarios(usuarios)
                                } else {
                                    setSelectedUsuarios([])
                                }
                            }}
                            disabled={isLoading}
                        />
                    } label="Seleccionar Todos" />
                </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "flex-start", marginBottom: 30, alignItems: "center", paddingLeft: 30, gap: 20 }}>
                <FormControlLabel control={
                    <Checkbox
                        checked={obligatorio}
                        onChange={() => setObligatorio(!obligatorio)}
                        disabled={isLoading}
                    />
                } label="Obligatorio" />

                <FormControlLabel control={
                    <Checkbox
                        checked={notificar}
                        onChange={() => setNotificar(!notificar)}
                        disabled={isLoading}
                    />
                } label="Notificar al correo 48Hrs antes" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 30 }}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmit}
                    disabled={isLoading || !title}
                >
                    {evento ? "Guardar Cambios" : "Crear Evento"}
                </Button>
            </div>
        </div>
    );
}
