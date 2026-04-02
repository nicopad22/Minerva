"use client"
import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CircularProgress, styled, TextField, Typography } from '@mui/material';
import { MdCloudUpload, MdClose } from "react-icons/md";
import { createClient } from '../utils/client';
import { green } from '@mui/material/colors';
import { enviarJustificacion } from '../utils/supa';

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

export default function FormInasistencia({ eventId, handleClose, onSuccess }) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [archivos, setArchivos] = React.useState([])
  const [motivo, setMotivo] = React.useState("")

  const addfile = (e) => {
    const files = e.target.files;
    const newFiles = Array.from(files);
    setArchivos([...archivos, ...newFiles]);
  };

  const removeFile = (i) => {
    setArchivos(archivos.filter((_, index) => index !== i));
  };

  const handleSubmit = async () => {
    const { data: { session } } = await createClient().auth.getSession()
    const userProfileId = session?.user?.id;
    if (!userProfileId) {
        alert("Usuario no autenticado");
        return;
    }

    setIsLoading(true);
    const { error } = await enviarJustificacion(eventId, userProfileId, motivo, archivos);
    setIsLoading(false);

    if (error) {
        console.error("Error al Enviar Justificacion", error);
        alert("Error al Enviar Justificacion");
    } else {
        alert("Justificacion Enviada");
        handleClose();
        if (onSuccess) onSuccess();
    }
  }

  return (
    <div className='formInasistencia_container' style={{ position: 'relative' }}>
      {isLoading && (
        <CircularProgress
          size={60}
          sx={{
            color: green[500],
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: '-30px',
            marginLeft: '-30px',
            zIndex: 10
          }}
        />
      )}
      <TextField
        id="outlined-multiline-flexible"
        label="Motivo de la inasistencia"
        multiline
        fullWidth
        rows={4}
        value={motivo}
        onChange={(e) => { setMotivo(e.target.value) }}
        disabled={isLoading}
      />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 30, minHeight: 70, justifyContent: "space-between", marginBottom: 30 }}>
        <Typography variant='body2' gutterBottom>
          Archivos (Licencia medica, contrato de trabajo etc...) (opcional)
        </Typography>
        <Button
          component="label"
          variant="contained"
          startIcon={<MdCloudUpload size={20} />}
          disabled={isLoading}
          style={{ width: 'fit-content' }}
        >
          Subir Archivos
          <VisuallyHiddenInput
            type="file"
            onChange={addfile}
            multiple
          />
        </Button>
        {archivos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", marginTop: 10 }}>
            {archivos.map((val, index) => {
              return (
                <div style={{ marginBottom: 5, display: 'flex', alignItems: 'center' }} key={index}>
                  <span style={{ marginRight: 10 }}>{val.name}</span>
                  <Button
                    color='error'
                    size="small"
                    onClick={() => removeFile(index)}
                    disabled={isLoading}
                  >
                    <MdClose size={20} />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button variant="contained" color="primary" onClick={handleSubmit} disabled={isLoading || !motivo.trim()}>
        Enviar Justificación
      </Button>
    </div>
  );
}
