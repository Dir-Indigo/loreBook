import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CustomModal from '../common/CustomModal';
import CustomButton from '../common/CustomButton';

export default function BatchTagAssignModal({
  open,
  onClose,
  selectedCharacters = [],
  tags = [],
  onApplyTags,
}) {
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [initialTagIds, setInitialTagIds] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (selectedCharacters.length > 0) {
      // Find tags that are common or present in selected characters
      const allSelectedTags = new Set();
      selectedCharacters.forEach((c) => {
        if (Array.isArray(c.custom_tag_ids)) {
          c.custom_tag_ids.forEach((tid) => allSelectedTags.add(tid));
        }
      });
      const initialArr = Array.from(allSelectedTags);
      setSelectedTagIds(initialArr);
      setInitialTagIds(initialArr);
    } else {
      setSelectedTagIds([]);
      setInitialTagIds([]);
    }
  }, [open, selectedCharacters]);

  const handleToggleTag = (tagId) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId]
    );
  };

  const handleSave = async () => {
    const addTagIds = selectedTagIds.filter((id) => !initialTagIds.includes(id));
    const removeTagIds = initialTagIds.filter((id) => !selectedTagIds.includes(id));

    if (onApplyTags) {
      await onApplyTags({
        addTagIds,
        removeTagIds,
        finalTagIds: selectedTagIds,
        characterIds: selectedCharacters.map((c) => c.id),
      });
    }
    onClose();
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Asignar Etiquetas en Lote"
      subtitle={`Selecciona las etiquetas que deseas aplicar a los ${selectedCharacters.length} personajes seleccionados`}
      icon={LocalOfferOutlinedIcon}
      maxWidth="xs"
      actions={
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, width: '100%' }}>
          <CustomButton variant="outlined" color="inherit" onClick={onClose}>
            Cancelar
          </CustomButton>
          <CustomButton variant="contained" onClick={handleSave}>
            Aplicar a {selectedCharacters.length} Personajes
          </CustomButton>
        </Box>
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tags.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body2" color="text.secondary">
              No tienes etiquetas creadas en esta historia. Primero crea etiquetas desde el Gestor de Etiquetas.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflowY: 'auto' }}>
            {tags.map((tag) => {
              const isChecked = selectedTagIds.includes(tag.id);
              return (
                <Box
                  key={tag.id}
                  onClick={() => handleToggleTag(tag.id)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    p: 1.2,
                    borderRadius: 2,
                    bgcolor: isChecked ? 'action.selected' : 'background.paper',
                    border: '1px solid',
                    borderColor: isChecked ? tag.color || 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                    <Box
                      sx={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        bgcolor: tag.color || '#8c6d53',
                      }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {tag.name}
                    </Typography>
                  </Box>

                  <Checkbox
                    checked={isChecked}
                    onChange={() => handleToggleTag(tag.id)}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    sx={{ p: 0.2 }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </CustomModal>
  );
}
