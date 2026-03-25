"use client"
import { List, ListSubheader, ListItem, ListItemAvatar, Avatar, ListItemText, Typography } from "@mui/material"
import Paper from '@mui/material/Paper';

function UserListItem({ user }) {
    if (!user) return null;
    return (
        <ListItem>
            <ListItemAvatar>
                <Avatar src={user.avatar_url || ""} />
            </ListItemAvatar>
            <ListItemText primary={user.full_name || user.nombre || "Usuario Desconocido"} />
        </ListItem>
    )
}

export default function EventUsersList({ eventUsers }) {
    const confirmados = eventUsers?.confirmados || [];
    const justificados = eventUsers?.justificados || [];
    const nr = eventUsers?.nr || [];

    return (
        <div style={{ display: "flex", width: "100%", justifyContent: "space-evenly", marginTop: 20 }}>
            <div className="nextEventList" style={{ width: "30%", minWidth: 200, maxHeight: 400 }}>
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Confirmados: {confirmados.length}
                        </ListSubheader>
                    }
                >
                    <hr style={{margin:0}}/>
                    {confirmados.map((usuario) => (
                        <UserListItem key={usuario?.id} user={usuario} />
                    ))}
                </List>
            </div>
            <div className="nextEventList" style={{ width: "30%", minWidth: 200, maxHeight: 400 }}>
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Justificados: {justificados.length}
                        </ListSubheader>
                    }
                >
                    <hr style={{margin:0}} />
                    {justificados.map((usuario) => (
                        <UserListItem key={usuario?.id} user={usuario} />
                    ))}
                </List>
            </div>
            <div className="nextEventList" style={{ width: "30%", minWidth: 200, maxHeight: 400 }}>
                <List
                    sx={{ width: '100%', height: "100%", bgcolor: 'background.paper', overflow: "auto" }}
                    component={Paper}
                    aria-labelledby="nested-list-subheader"
                    subheader={
                        <ListSubheader component="div" id="nested-list-subheader">
                            Sin Respuesta: {nr.length}
                        </ListSubheader>
                    }
                >
                    <hr  style={{margin:0}} />
                    {nr.map((usuario) => (
                        <UserListItem key={usuario?.id} user={usuario} />
                    ))}
                </List>
            </div>
        </div>
    );
}
