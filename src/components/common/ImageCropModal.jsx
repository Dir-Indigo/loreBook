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
  aspectRatio = '1:1',
  shape = 'circle',
  title = null,
}) {
  const [loadedImg, setLoadedImg] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const isPanoramic = aspectRatio === 'panoramic' || aspectRatio === '16:9' || aspectRatio === '2:1';
  const cropBoxWidth = isPanoramic ? 380 : 260;
  const cropBoxHeight = isPanoramic ? 190 : 260;
  const targetOutputWidth = isPanoramic ? 1200 : 280;
  const targetOutputHeight = isPanoramic ? 600 : 280;
  const modalTitle = title || (isPanoramic ? 'Recortar Portada Panorámica' : 'Recortar y Encuadrar Avatar');
  const frameBorderRadius = isPanoramic ? '16px' : shape === 'circle' ? '50%' : '16px';

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
        cropBoxWidth / loadedImg.naturalWidth,
        cropBoxHeight / loadedImg.naturalHeight
      );
      const currentScale = minDisplayScale * zoom;

      const displayedWidth = loadedImg.naturalWidth * currentScale;
      const displayedHeight = loadedImg.naturalHeight * currentScale;

      // Center offset
      const imageLeft = (cropBoxWidth - displayedWidth) / 2 + position.x;
      const imageTop = (cropBoxHeight - displayedHeight) / 2 + position.y;

      // Convert crop box coordinates back to natural image pixels
      const cropX = Math.max(0, (0 - imageLeft) / currentScale);
      const cropY = Math.max(0, (0 - imageTop) / currentScale);
      const cropW = Math.min(
        loadedImg.naturalWidth - cropX,
        cropBoxWidth / currentScale
      );
      const cropH = Math.min(
        loadedImg.naturalHeight - cropY,
        cropBoxHeight / currentScale
      );

      const optimizedBlob = await cropAndOptimizeImage(
        loadedImg,
        {
          x: cropX,
          y: cropY,
          width: Math.max(10, cropW),
          height: Math.max(10, cropH),
        },
        targetOutputWidth,
        targetOutputHeight,
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
        cropBoxWidth / loadedImg.naturalWidth,
        cropBoxHeight / loadedImg.naturalHeight
      )
    : 1;

  const currentDisplayWidth = loadedImg ? loadedImg.naturalWidth * baseScale * zoom : cropBoxWidth;
  const currentDisplayHeight = loadedImg ? loadedImg.naturalHeight * baseScale * zoom : cropBoxHeight;

  return (
    <Dialog
      open={open}
      onClose={processing ? undefined : onClose}
      maxWidth={isPanoramic ? 'sm' : 'xs'}
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
            {modalTitle}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} disabled={processing}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontSize: '0.85rem' }}>
          Arrastra la imagen para posicionarla en el encuadre y ajusta el zoom.
        </Typography>

        {/* Viewport Frame with Mask */}
        <Box
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleMouseUp}
          sx={{
            width: { xs: '100%', sm: cropBoxWidth },
            maxWidth: cropBoxWidth,
            height: cropBoxHeight,
            borderRadius: frameBorderRadius,
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
                left: `${(cropBoxWidth - currentDisplayWidth) / 2 + position.x}px`,
                top: `${(cropBoxHeight - currentDisplayHeight) / 2 + position.y}px`,
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
          label={
            isPanoramic
              ? 'Auto-optimización WebP: ~50-80 KB (Panorámica HD ultrarrápida)'
              : 'Auto-optimización WebP: ~25-40 KB (Carga ultrarrápida)'
          }
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
          {processing ? 'Optimizando y Subiendo…' : 'Aplicar Portada'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
