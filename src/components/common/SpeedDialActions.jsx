import React from 'react';
import { SpeedDial, SpeedDialAction } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

export default function SpeedDialActions({ onOpenCreateEvent, onOpenCreateCharacter }) {
  const actions = [
    { icon: <EventIcon />, name: 'Añadir evento', onClick: onOpenCreateEvent },
    { icon: <PersonAddIcon />, name: 'Crear personaje', onClick: onOpenCreateCharacter },
  ];

  return (
    <SpeedDial
      ariaLabel="SpeedDial acciones rápidas"
      sx={{
        position: 'absolute',
        bottom: { xs: 80, sm: 145 }, // Encima del FAB de notas de ideas
        right: { xs: 16, sm: 20 },
        zIndex: 10,
        '& .MuiSpeedDial-fab': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          transition: 'transform 0.15s ease',
          '&:hover': { transform: 'scale(1.08)' },
        },
      }}
      icon={<AddIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.onClick}
        />
      ))}
    </SpeedDial>
  );
}
