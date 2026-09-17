import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Avatar,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
} from '@mui/material';
import BookmarkAddOutlinedIcon from '@mui/icons-material/BookmarkAddOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PersonIcon from '@mui/icons-material/Person';

export default function CopyGlobalConfirmModal({
  open,
  onClose,
  onConfirm,
  charactersToCopy = [],
  currentStoryId,
  currentStoryTitle = 'esta historia',
}) {
  if (!open || !charactersToCopy.length) return null;

  // Detect which characters were originally created in this same story
  const sameStoryCharacters = charactersToCopy.filter(
    (c) => c.story_id && c.story_id === currentStoryId
  );
  const isRedundant = sameStoryCharacters.length > 0;
  const isMultiple = charactersToCopy.length > 1;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', alignItems: 'center', gap: 1.2 }}>
        <BookmarkAddOutlinedIcon color="primary" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
            {isMultiple ? 'Copiar Personajes a Historia' : 'Crear Copia Local'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Historia destino: <strong>{currentStoryTitle}</strong>
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 1.8 }}>
        {/* List of characters to be copied */}
        <Box
          sx={{
            maxHeight: 180,
            overflowY: 'auto',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2.5,
            bgcolor: 'background.subtle',
            p: 0.5,
          }}
        >
          <List dense disablePadding>
            {charactersToCopy.map((char) => {
              const charIsRedundant = char.story_id && char.story_id === currentStoryId;
              return (
                <ListItem
                  key={char.id}
                  sx={{
                    borderRadius: 2,
                    mb: 0.5,
                    bgcolor: charIsRedundant ? 'action.hover' : 'transparent',
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      src={char.avatar_url}
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: char.color_tag || 'primary.main',
                        fontSize: '0.85rem',
                      }}
                    >
                      {char.name ? char.name.charAt(0).toUpperCase() : <PersonIcon />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, flexWrap: 'wrap' }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {char.name}
                        </Typography>
                        {charIsRedundant && (
                          <Chip
                            label="Creado en esta historia"
                            size="small"
                            color="warning"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.62rem', fontWeight: 600 }}
                          />
                        )}
                      </Box>
                    }
                    secondary={char.role_archetype || 'Sin rol'}
                  />
                </ListItem>
              );
            })}
          </List>
        </Box>

        {/* Warning if redundant, otherwise informational alert */}
        {isRedundant ? (
          <Alert
            severity="warning"
            icon={<WarningAmberOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 2.5, fontSize: '0.82rem', '& .MuiAlert-message': { py: 0.2 } }}
          >
            {isMultiple ? (
              <>
                <strong>Aviso de redundancia:</strong> {sameStoryCharacters.length} de los personajes seleccionados ya nacieron y pertenecen a esta historia. Crear una copia local generará duplicados en la misma historia, pero puedes continuar si así lo deseas.
              </>
            ) : (
              <>
                <strong>Aviso de redundancia:</strong> Este personaje global ya nació y pertenece originalmente a esta historia.
              </>
            )}
          </Alert>
        ) : (
          <Alert
            severity="info"
            icon={<InfoOutlinedIcon fontSize="small" />}
            sx={{ borderRadius: 2.5, fontSize: '0.82rem', '& .MuiAlert-message': { py: 0.2 } }}
          >
            Se creará una ficha local independiente exclusiva para esta historia. El personaje global original seguirá existiendo intacto en el workspace.
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 1.5, justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color={isRedundant ? 'warning' : 'primary'}
          onClick={handleConfirm}
          startIcon={<BookmarkAddOutlinedIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2 }}
        >
          {isRedundant ? 'Crear Copia de Todas Formas' : isMultiple ? 'Confirmar Copias' : 'Crear Copia Local'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
