import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Slider,
  Button,
  IconButton,
  CircularProgress,
  Chip,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import CropIcon from '@mui/icons-material/Crop';
import CloseIcon from '@mui/icons-material/Close';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { loadImage, cropAndOptimizeImage } from '../../utils/imageOptimizer';

const CROP_BOX_SIZE = 260; // Dimensions of the visual crop frame in px

export default function ImageCropModal({
  open,
  imageSrc,
  onClose,
  onCropComplete,
}) {
  const [loadedImg, setLoadedImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  // Load HTMLImageElement when imageSrc changes
  useEffect(() => {
    if (open && imageSrc) {
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setProcessing(false);
      loadImage(imageSrc)
        .then((img) => {
          setLoadedImg(img);
        })
        .catch((err) => {
          console.error(err);
        });
    } else {
      setLoadedImg(null);
    }
  }, [open, imageSrc]);

  // Handle Dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  // Perform the crop calculation and compression
  const handleApplyCrop = async () => {
    if (!loadedImg) return;
    try {
      setProcessing(true);

      // Compute display dimensions
      const minDisplayScale = Math.max(
        CROP_BOX_SIZE / loadedImg.naturalWidth,
        CROP_BOX_SIZE / loadedImg.naturalHeight
      );
      const currentScale = minDisplayScale * zoom;

      const displayedWidth = loadedImg.naturalWidth * currentScale;
      const displayedHeight = loadedImg.naturalHeight * currentScale;

      // Center offset
      const imageLeft = (CROP_BOX_SIZE - displayedWidth) / 2 + position.x;
      const imageTop = (CROP_BOX_SIZE - displayedHeight) / 2 + position.y;

      // Convert crop box coordinates back to natural image pixels
      const cropX = Math.max(0, (0 - imageLeft) / currentScale);
      const cropY = Math.max(0, (0 - imageTop) / currentScale);
      const cropSize = Math.min(
        loadedImg.naturalWidth - cropX,
        loadedImg.naturalHeight - cropY,
        CROP_BOX_SIZE / currentScale
      );

      const optimizedBlob = await cropAndOptimizeImage(
        loadedImg,
        {
          x: cropX,
          y: cropY,
          width: Math.max(10, cropSize),
          height: Math.max(10, cropSize),
        },
        280, // High-res avatar 280x280
        0.85
      );

      const previewUrl = URL.createObjectURL(optimizedBlob);
      await onCropComplete(optimizedBlob, previewUrl);
      onClose();
    } catch (err) {
      console.error('Error cropping image:', err);
    } finally {
      setProcessing(false);
    }
  };

  if (!open) return null;

  // Base scale calculation to fit the image
  const baseScale = loadedImg
    ? Math.max(
        CROP_BOX_SIZE / loadedImg.naturalWidth,
        CROP_BOX_SIZE / loadedImg.naturalHeight
      )
    : 1;

  const currentDisplayWidth = loadedImg ? loadedImg.naturalWidth * baseScale * zoom : CROP_BOX_SIZE;
  const currentDisplayHeight = loadedImg ? loadedImg.naturalHeight * baseScale * zoom : CROP_BOX_SIZE;

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.8,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CropIcon color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.05rem' }}>
            Recortar y Encuadrar Avatar
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={processing}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
          Arrastra la foto para posicionarla y usa la barra para hacer zoom.
        </Typography>

        {/* Viewport Frame with Circular / Rounded Mask */}
        <Box
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          sx={{
            width: CROP_BOX_SIZE,
            height: CROP_BOX_SIZE,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            bgcolor: '#1a1a1a',
            border: '3px solid',
            borderColor: 'primary.main',
            boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {loadedImg ? (
            <img
              src={imageSrc}
              alt="Crop target"
              draggable={false}
              style={{
                position: 'absolute',
                width: `${currentDisplayWidth}px`,
                height: `${currentDisplayHeight}px`,
                left: `${(CROP_BOX_SIZE - currentDisplayWidth) / 2 + position.x}px`,
                top: `${(CROP_BOX_SIZE - currentDisplayHeight) / 2 + position.y}px`,
                maxWidth: 'none',
                pointerEvents: 'none',
              }}
            />
          ) : (
            <CircularProgress size={32} />
          )}
        </Box>

        {/* Zoom Controls */}
        <Box sx={{ width: '100%', px: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            size="small"
            onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
            disabled={zoom <= 1}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Slider
            value={zoom}
            min={1}
            max={3.5}
            step={0.05}
            onChange={(e, val) => setZoom(val)}
            sx={{ flex: 1 }}
          />
          <IconButton
            size="small"
            onClick={() => setZoom((z) => Math.min(3.5, z + 0.2))}
            disabled={zoom >= 3.5}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Optimization Info Badge */}
        <Chip
          icon={<AutoFixHighIcon sx={{ fontSize: '15px !important' }} />}
          label="Auto-optimización WebP: ~25-40 KB (Carga ultrarrápida)"
          size="small"
          color="success"
          variant="outlined"
          sx={{ fontSize: '0.74rem', fontWeight: 600, bgcolor: 'action.hover' }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.8, borderTop: 1, borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          disabled={processing}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          Cancelar
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleApplyCrop}
          disabled={!loadedImg || processing}
          startIcon={processing ? <CircularProgress size={18} color="inherit" /> : <CropIcon />}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 2.5 }}
        >
          {processing ? 'Optimizando y Subiendo…' : 'Aplicar Recorte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
