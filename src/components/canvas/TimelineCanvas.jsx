import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
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
import {
  Box,
  Typography,
  Chip,
  Snackbar,
  Alert,
  Switch,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import TimelineIcon from '@mui/icons-material/Timeline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ViewAgendaOutlinedIcon from '@mui/icons-material/ViewAgendaOutlined';
import ViewHeadlineIcon from '@mui/icons-material/ViewHeadline';
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
  eventConnections = [],
  activeBoardName = null,
  onCreateConnection,
  onDeleteConnection,
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenVersions,
  onCreateBackup,
  onNodeDragStop,
  onDuplicateEvent,
}) {
  const { currentThemeConfig } = useLoreTheme();

  // Compact mode: manual Switch OR auto-trigger at extreme zoom (text unreadable)
  const AUTO_COMPACT_THRESHOLD = 0.62;
  const [zoomLevel, setZoomLevel] = useState(1);
  const [manualCompact, setManualCompact] = useState(false);
  const autoCompact = zoomLevel < AUTO_COMPACT_THRESHOLD;
  const isCompact = manualCompact || autoCompact;

  // Selected node and clipboard state for Ctrl+C and Ctrl+V
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const copiedEventRef = useRef(null);
  const [snackbarInfo, setSnackbarInfo] = useState(null);

  // Compute sequence rank / order index for each node based on DAG connections (Topological BFS)
  const computedOrderMap = useMemo(() => {
    const map = new Map();
    if (events.length === 0) return map;

    const inDegree = new Map();
    const adj = new Map();

    events.forEach((ev) => {
      inDegree.set(ev.id, 0);
      adj.set(ev.id, []);
    });

    eventConnections.forEach((conn) => {
      if (inDegree.has(conn.target_event_id)) {
        inDegree.set(conn.target_event_id, (inDegree.get(conn.target_event_id) || 0) + 1);
      }
      if (adj.has(conn.source_event_id)) {
        adj.get(conn.source_event_id).push(conn.target_event_id);
      }
    });

    const queue = [];
    events.forEach((ev) => {
      if ((inDegree.get(ev.id) || 0) === 0) {
        queue.push({ id: ev.id, level: 1 });
      }
    });

    while (queue.length > 0) {
      const { id, level } = queue.shift();
      const currentMax = map.get(id) || 1;
      const newLevel = Math.max(currentMax, level);
      map.set(id, newLevel);

      const neighbors = adj.get(id) || [];
      for (const targetId of neighbors) {
        const targetLevel = newLevel + 1;
        if (!map.has(targetId) || map.get(targetId) < targetLevel) {
          map.set(targetId, targetLevel);
          queue.push({ id: targetId, level: targetLevel });
        }
      }
    }

    // Fallback for unvisited nodes
    events.forEach((ev, idx) => {
      if (!map.has(ev.id)) {
        map.set(ev.id, ev.order_index || (idx + 1));
      }
    });

    return map;
  }, [events, eventConnections]);

  // Transform events into React Flow nodes
  const initialNodes = useMemo(() => {
    return events.map((ev, index) => {
      const eventChars = (ev.event_characters || [])
        .map((ec) => ec.character)
        .filter(Boolean);

      const calcOrder = computedOrderMap.get(ev.id) || (index + 1);

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
          orderIndex: calcOrder,
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
  }, [events, computedOrderMap, isCompact, onOpenEditEvent, onDeleteEvent, onOpenVersions, onCreateBackup]);

  // Generate DAG cable vector edges from eventConnections
  const initialEdges = useMemo(() => {
    return eventConnections.map((conn) => ({
      id: `e-${conn.source_event_id}-${conn.target_event_id}`,
      source: conn.source_event_id,
      target: conn.target_event_id,
      type: 'smoothstep',
      animated: true,
      interactionWidth: 25,
      style: {
        stroke: currentThemeConfig.palette.primary.main,
        strokeWidth: 2.5,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: currentThemeConfig.palette.primary.main,
        width: 16,
        height: 16,
      },
    }));
  }, [eventConnections, currentThemeConfig]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when props change
  useEffect(() => {
    // Only update if not currently dragging to avoid overwriting user changes
    if (!isDraggingRef.current) {
        setNodes(initialNodes);
    }
  }, [initialNodes]); // Removed setNodes from dependency array as it is stable

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle connecting a cable (source node -> target node)
  const handleConnect = useCallback(
    (params) => {
      if (params.source && params.target && params.source !== params.target) {
        if (onCreateConnection) {
          onCreateConnection(params.source, params.target);
          setSnackbarInfo({
            severity: 'success',
            message: 'Cable de evento conectado exitosamente.',
          });
        }
      }
    },
    [onCreateConnection]
  );

  // Reconnection and Detachment (pulling cable away from node to disconnect)
  const edgeReconnectSuccessful = useRef(true);

  const handleReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const handleReconnect = useCallback(
    (oldEdge, newConnection) => {
      edgeReconnectSuccessful.current = true;
      if (newConnection.source && newConnection.target && newConnection.source !== newConnection.target) {
        if (onDeleteConnection) onDeleteConnection(oldEdge.source, oldEdge.target);
        if (onCreateConnection) onCreateConnection(newConnection.source, newConnection.target);
        setSnackbarInfo({
          severity: 'success',
          message: 'Cable reconectado exitosamente.',
        });
      }
    },
    [onCreateConnection, onDeleteConnection]
  );

  const handleReconnectEnd = useCallback(
    (event, edge) => {
      if (!edgeReconnectSuccessful.current) {
        if (onDeleteConnection && edge?.source && edge?.target) {
          onDeleteConnection(edge.source, edge.target);
          setSnackbarInfo({
            severity: 'info',
            message: 'Cable desconectado.',
          });
        }
      }
      edgeReconnectSuccessful.current = true;
    },
    [onDeleteConnection]
  );

  // Handle disconnecting cables (deleting edges)
  const handleEdgesDelete = useCallback(
    (deletedEdges) => {
      if (onDeleteConnection && deletedEdges.length > 0) {
        deletedEdges.forEach((edge) => {
          onDeleteConnection(edge.source, edge.target);
        });
        setSnackbarInfo({
          severity: 'info',
          message: 'Cable desconectado.',
        });
      }
    },
    [onDeleteConnection]
  );

  // Track selection changes
  const onSelectionChange = useCallback(({ nodes }) => {
    if (nodes && nodes.length > 0) {
      setSelectedNodeId(nodes[0].id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  // Handle Ctrl+C and Ctrl+V keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || document.activeElement?.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        if (selectedNodeId) {
          const targetEvent = events.find((ev) => ev.id === selectedNodeId);
          if (targetEvent) {
            copiedEventRef.current = targetEvent;
            setSnackbarInfo({
              severity: 'info',
              message: `Evento "${targetEvent.title}" copiado. Presiona Ctrl+V para pegar una copia.`,
              icon: <ContentCopyIcon fontSize="small" />,
            });
          }
        }
      }

      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        if (copiedEventRef.current && onDuplicateEvent) {
          onDuplicateEvent(copiedEventRef.current, { x: 50, y: 40 });
          setSnackbarInfo({
            severity: 'success',
            message: `Copia generada en el lienzo para: "${copiedEventRef.current.title}"`,
            icon: <ContentPasteIcon fontSize="small" />,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, events, onDuplicateEvent]);

  const isDraggingRef = useRef(false);

  // Handle Drag Start
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle Drag End to persist (X, Y) coordinates
  const handleNodeDragStop = useCallback(
    (event, node) => {
      isDraggingRef.current = false;
      // Update local ReactFlow state optimistically to prevent snap-back
      setNodes((nds) => 
        nds.map((n) => (n.id === node.id ? { ...n, position: node.position } : n))
      );

      if (onNodeDragStop) {
        onNodeDragStop(node.id, node.position.x, node.position.y);
      }
    },
    [onNodeDragStop, setNodes]
  );

  const handleMove = useCallback((evt, viewport) => {
    if (viewport?.zoom !== undefined) {
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
      {/* Top HUD toolbar */}
      <Box
        sx={{
          position: 'absolute',
          top: 14,
          left: 14,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        {/* Compact Mode Switch */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            borderRadius: 2,
            px: 1.2,
            py: 0.3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            gap: 0.5,
          }}
        >
          <Tooltip title={isCompact ? 'Cambiar a vista detallada' : 'Cambiar a vista resumen'}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {isCompact
                ? <ViewHeadlineIcon sx={{ fontSize: 16, color: autoCompact ? 'warning.main' : 'secondary.main' }} />
                : <ViewAgendaOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />}
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.73rem', color: isCompact ? (autoCompact ? 'warning.main' : 'secondary.main') : 'text.secondary', whiteSpace: 'nowrap' }}>
                {autoCompact ? 'Resumen (Auto)' : isCompact ? 'Vista Resumen' : 'Vista Detallada'}
              </Typography>
              <Switch
                size="small"
                checked={manualCompact}
                onChange={(e) => setManualCompact(e.target.checked)}
                color={autoCompact ? 'warning' : 'secondary'}
                sx={{ ml: 0.5 }}
              />
            </Box>
          </Tooltip>
        </Box>

        <Chip
          label={`${events.length} Eventos`}
          size="small"
          sx={{
            bgcolor: 'background.paper',
            border: 1,
            borderColor: 'divider',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        />

        {activeBoardName && (
          <Chip
            label={activeBoardName}
            size="small"
            color="secondary"
            variant="outlined"
            icon={<TimelineIcon sx={{ fontSize: '14px !important' }} />}
            sx={{
              bgcolor: 'background.paper',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          />
        )}

        <Chip
          label={`${eventConnections.length} Conexiones`}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            bgcolor: 'background.paper',
            fontWeight: 600,
            fontSize: '0.85rem',
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
            Comienza agregando el primer evento narrativo de esta historia. Conecta eventos arrastrando cables entre sus conectores laterales.
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
        onConnect={handleConnect}
        onReconnectStart={handleReconnectStart}
        onReconnect={handleReconnect}
        onReconnectEnd={handleReconnectEnd}
        edgesReconnectable={true}
        reconnectRadius={30}
        onEdgesDelete={handleEdgesDelete}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onSelectionChange={onSelectionChange}
        onMove={handleMove}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        connectionLineStyle={{
          stroke: currentThemeConfig.palette.primary.main,
          strokeWidth: 3,
          strokeDasharray: '5,5',
        }}
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

      {/* Snackbar feedback */}
      <Snackbar
        open={Boolean(snackbarInfo)}
        autoHideDuration={2800}
        onClose={() => setSnackbarInfo(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbarInfo ? (
          <Alert
            severity={snackbarInfo.severity || 'info'}
            icon={snackbarInfo.icon}
            onClose={() => setSnackbarInfo(null)}
            sx={{
              borderRadius: 2,
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              fontWeight: 600,
            }}
          >
            {snackbarInfo.message}
          </Alert>
        ) : null}
      </Snackbar>
    </Box>
  );
}
