import React, { useState } from 'react';
import {
  Box,
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Divider,
} from '@mui/material';
import DriveFileMoveOutlinedIcon from '@mui/icons-material/DriveFileMoveOutlined';
import FolderIcon from '@mui/icons-material/Folder';
import FolderSpecialIcon from '@mui/icons-material/FolderSpecial';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

const EMPTY_ARRAY = [];

export default function MoveToFolderModal({
  open,
  onClose,
  charactersToMove = EMPTY_ARRAY,
  folders = EMPTY_ARRAY,
  onConfirmMove,
}) {
  const [selectedFolderId, setSelectedFolderId] = useState('');

  React.useEffect(() => {
    if (!open) return;

    // Default to the first folder or first character's folder
    if (charactersToMove.length === 1 && charactersToMove[0]?.folder_id) {
      setSelectedFolderId(charactersToMove[0].folder_id);
    } else if (folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [open, charactersToMove, folders]);

  const handleConfirm = async () => {
    if (!selectedFolderId || !onConfirmMove) return;
    await onConfirmMove(
      charactersToMove.map((c) => c.id),
      selectedFolderId
    );
    onClose();
  };

  // Helper to render folders with indentation based on tree depth
  const buildFolderOptions = (parentId = null, depth = 0) => {
    const list = folders.filter((f) => (f.parent_folder_id || null) === parentId);
    let result = [];
    list.forEach((f) => {
      result.push({ ...f, depth });
      result = result.concat(buildFolderOptions(f.id, depth + 1));
    });
    return result;
  };

  const folderOptions = buildFolderOptions(null, 0);

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Mover a Carpeta"
      subtitle={
        charactersToMove.length === 1
          ? `Mover a ${charactersToMove[0]?.name} a una nueva carpeta`
          : `Mover ${charactersToMove.length} personajes seleccionados a una carpeta`
      }
      icon={DriveFileMoveOutlinedIcon}
      maxWidth="xs"
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, width: '100%' }}>
          <CustomButton variant="outlined" color="inherit" onClick={onClose}>
            Cancelar
          </CustomButton>
          <CustomButton variant="contained" onClick={handleConfirm} disabled={!selectedFolderId}>
            Mover a esta Carpeta
          </CustomButton>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.7rem' }}>
          Selecciona la Carpeta de Destino:
        </Typography>

        <Box sx={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0.8 }}>
          {folderOptions.map((folder) => {
            const isSelected = selectedFolderId === folder.id;
            const isDefault = Boolean(folder.is_default || folder.name?.toLowerCase() === 'principal');

            return (
              <Box
                key={folder.id}
                onClick={() => setSelectedFolderId(folder.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  pl: `${12 + folder.depth * 16}px`,
                  pr: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: isSelected ? 'action.selected' : 'background.paper',
                  border: '1px solid',
                  borderColor: isSelected ? folder.color || 'primary.main' : 'divider',
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                {isDefault ? (
                  <FolderSpecialIcon sx={{ fontSize: 18, color: folder.color || 'primary.main' }} />
                ) : (
                  <FolderIcon sx={{ fontSize: 18, color: folder.color || 'primary.main' }} />
                )}

                <Typography variant="body2" sx={{ fontWeight: isSelected ? 700 : 500, flexGrow: 1 }}>
                  {folder.name}
                </Typography>

                <Radio
                  checked={isSelected}
                  onChange={() => setSelectedFolderId(folder.id)}
                  value={folder.id}
                  size="small"
                  sx={{ p: 0 }}
                />
              </Box>
            );
          })}
        </Box>
      </Box>
    </CustomModal>
  );
}
