import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Box, Typography, Paper, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import EventNode from './EventNode';
import CustomButton from '../common/CustomButton';
import { APP_CONFIG } from '../../constants/constants';
import { useLoreTheme } from '../../context/ThemeContext';

const nodeTypes = {
  eventNode: EventNode,
};

export default function TimelineCanvas({
  events = [],
  characters = [],
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenVersions,
  onCreateBackup,
  onNodeDragStop,
}) {
  const { currentThemeConfig } = useLoreTheme();
  const [zoomLevel, setZoomLevel] = useState(1);
  const isCompact = zoomLevel < APP_CONFIG.ZOOM_COMPACT_THRESHOLD;

  // Transform events into React Flow nodes
  const initialNodes = useMemo(() => {
    return events.map((ev, index) => {
      // Calculate character associations
      const eventChars = (ev.event_characters || [])
        .map((ec) => ec.character)
        .filter(Boolean);

      return {
        id: ev.id,
        type: 'eventNode',
        position: {
          x: ev.pos_x ?? 120 + (index % 4) * 360,
          y: ev.pos_y ?? 100 + Math.floor(index / 4) * 220,
        },
        data: {
          id: ev.id,
          title: ev.title,
          summary: ev.summary,
          details: ev.details,
          orderIndex: ev.order_index,
          colorTag: ev.color_tag,
          importanceLevel: ev.importance_level,
          characters: eventChars,
          versionsCount: ev.event_versions?.length || 1,
          isCompact: isCompact,
          onEdit: () => onOpenEditEvent(ev),
          onDelete: () => onDeleteEvent(ev.id),
          onOpenVersions: () => onOpenVersions(ev.id, ev.title),
          onCreateBackup: () => onCreateBackup(ev.id),
        },
      };
    });
  }, [events, isCompact, onOpenEditEvent, onDeleteEvent, onOpenVersions, onCreateBackup]);

  // Generate sequential timeline vector edges connecting events (RF-4.1)
  const initialEdges = useMemo(() => {
    if (events.length < 2) return [];

    const sorted = [...events].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const edgesList = [];

    for (let i = 0; i < sorted.length - 1; i++) {
      const source = sorted[i];
      const target = sorted[i + 1];
      edgesList.push({
        id: `e-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: currentThemeConfig.palette.primary.main,
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: currentThemeConfig.palette.primary.main,
          width: 16,
          height: 16,
        },
      });
    }
    return edgesList;
  }, [events, currentThemeConfig]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle Drag End to persist (X, Y) coordinates (RF-4.3)
  const handleNodeDragStop = useCallback(
    (event, node) => {
      if (onNodeDragStop) {
        onNodeDragStop(node.id, node.position.x, node.position.y);
      }
    },
    [onNodeDragStop]
  );

  // Multiscale zoom tracking (RNF-6)
  const handleMove = useCallback((evt, viewport) => {
    if (viewport?.zoom) {
      setZoomLevel(viewport.zoom);
    }
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        bgcolor: 'custom.canvas',
        overflow: 'hidden',
      }}
    >
      {/* Multiscale status HUD */}
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <Chip
          icon={isCompact ? <ZoomOutIcon fontSize="inherit" /> : <ZoomInIcon fontSize="inherit" />}
          label={isCompact ? 'Vista Compacta (Alejada)' : 'Vista Detallada (Cercana)'}
          size="small"
          color={isCompact ? 'secondary' : 'default'}
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: '0.75rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        />

        <Chip
          label={`${events.length} Eventos`}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      {/* Floating Add Event Button */}
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          right: 14,
          zIndex: 10,
        }}
      >
        <CustomButton
          startIcon={<AddIcon fontSize="small" />}
          onClick={onOpenCreateEvent}
          size="medium"
          sx={{ boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
        >
          Añadir Evento
        </CustomButton>
      </Box>

      {/* Empty State */}
      {events.length === 0 ? (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 5,
            p: 4,
            maxWidth: 420,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
          }}
        >
          <TimelineIcon sx={{ fontSize: 50, color: 'text.disabled', mb: 1.5 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Línea de Tiempo Vacía
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            Comienza agregando el primer evento narrativo de esta historia. Podrás arrastrarlo y organizarlo libremente en el lienzo.
          </Typography>
          <CustomButton
            startIcon={<AddIcon fontSize="small" />}
            onClick={onOpenCreateEvent}
          >
            Crear Primer Evento
          </CustomButton>
        </Box>
      ) : null}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={currentThemeConfig.mode === 'dark' ? '#333b4d' : '#d7cabb'}
        />
        <Controls
          showInteractive={false}
          style={{
            borderRadius: 8,
            overflow: 'hidden',
            border: `1px solid ${currentThemeConfig.palette.divider}`,
            backgroundColor: currentThemeConfig.palette.background.paper,
          }}
        />
        <MiniMap
          nodeColor={(node) => {
            return node.data?.colorTag || currentThemeConfig.palette.primary.main;
          }}
          nodeStrokeWidth={3}
          style={{
            borderRadius: 8,
            border: `1px solid ${currentThemeConfig.palette.divider}`,
            backgroundColor: currentThemeConfig.palette.background.paper,
          }}
        />
      </ReactFlow>
    </Box>
  );
}
