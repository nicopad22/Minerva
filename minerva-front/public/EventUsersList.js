"use client"
import { List, ListSubheader, Typography } from "@mui/material"
import Paper from '@mui/material/Paper';
import UserListItem from "./userListItem";


export default function EventUsersList({ eventUsers }) {
    const renderConfirm = () => eventUsers.confirmados.map((usuario) => {
        return (
            <UserListItem key={usuario.id_usuario} user={usuario} />
        )
    })

    const renderJusti = () => eventUsers.justificados.map((usuario) => {
        return (
            <UserListItem key={usuario.id_usuario} user={usuario} />
        )
    })


    const renderNr = () => eventUsers.nr.map((usuario) => {
        return (
            <UserListItem key={usuario.id_usuario} user={usuario} />
        )
    })
    return (

        <div style={{ display: "flex", width: "100%", justifyContent: "space-evenly" }}>
            <div className="nextEventList">
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Confirmados: {eventUsers.confirmados.length}
                        </ListSubheader>
                    }
                >
                    <hr style={{margin:0}}/>
                    {renderConfirm()}
                </List>
            </div>
            <div className="nextEventList">
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            No Asisten: {eventUsers.justificados.length}
                        </ListSubheader>
                    }
                >
                    <hr style={{margin:0}} />
                    {renderJusti()}
                </List>
            </div>
            <div className="nextEventList">
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Sin Respuesta: {eventUsers.nr.length}
                        </ListSubheader>
                    }
                >
                    <hr  style={{margin:0}} />
                    {renderNr()}
                </List>
            </div>
        </div>
    );
}

