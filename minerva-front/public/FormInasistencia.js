import * as React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { CircularProgress, List, styled, TextField, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import Perfil from '../utils/perfil';
import { green } from '@mui/material/colors';
import { useRouter } from 'next/navigation';
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

export default function FormInasistencia({ eventId, handleClose }) {
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false)
  const [archivos, setArchivos] = React.useState([])
  const [motivo, setMotivo] = React.useState()
  const router = useRouter()

  const addfile = (e) => {
    const files = e.target.files;
    const newFiles = [];
    for (let i = 0; i < files.length; i++) {
      newFiles.push(files[i]);
    }
    setArchivos([...archivos, ...newFiles]);
    console.log(archivos)
  };


  const removeFile = (i) => {
    setArchivos([...archivos.filter((_, index) => index !== i)]);
  };

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
      <TextField
        id="outlined-multiline-flexible"
        label="Motivo de la inasistencia"
        multiline
        maxRows={4}
        value={motivo}
        onChange={(e) => { setMotivo(e.target.value) }}
      />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 30, minHeight: 70, justifyContent: "space-between", marginBottom: 30 }}>
        <Typography variant='body2'>
          Archivos (Licencia medica, contrato de trabajo etc...) (opcional)
        </Typography>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          startIcon={<CloudUpload />}
        >
          Subir Archivos
          <VisuallyHiddenInput
            type="file"
            onChange={(event) => { addfile(event) }}
            multiple
          />
        </Button>
        {archivos.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", marginTop: 10 }}>
            {archivos.map((val, index) => {
              return (
                <li style={{ marginBottom: 5 }} key={index}>
                  <span>{val.name}</span>
                  <Button
                    color='error'
                    onClick={() => {
                      removeFile(index);
                    }}
                  >
                    <CloseIcon />
                  </Button>
                </li>
              );
            })}
          </div>
        )}
      </div>

      <Button variant="text" onClick={() => {
        const data = new FormData()
        archivos.map((archivo, index) => {
          data.append("file_" + index, archivos[index])
        })
        data.append("id_usuario", Perfil().getToken().id_usuario)
        data.append("token", Perfil().getToken().token)
        data.append("motivo", motivo)
        data.append("id_evento", eventId)
        setIsLoading(true)
        fetch("https://www.sechstela.cl/public/api/sendJustificacion.php", {
          method: "POST",
          body: data
        }).then((rsp) => rsp.json())
          .then((data) => {
            setIsLoading(false)
            handleClose()
            if (data.codigo == 1) {
              alert("Justificacion Enviada")
              location.reload();
            } else {
              alert("Error al Enviar Justificacion")
            }
          })
      }}>Enviar</Button>

    </div>
  );
}