import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { useEventOrder } from '../../hooks/useEventOrder';
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
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
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
  onDuplicateEvents,
  onInlineUpdateEvent,
  onUpdateEventCharacters,
  onQuickCreateEventAtPosition,
  onQuickCreateConnectedEvent,
  hasStory = true,
  onOpenStorySelector,
}) {
  const { currentThemeConfig } = useLoreTheme();
  const reactFlowInstanceRef = useRef(null);

  // Compact mode: manual Switch OR auto-trigger at extreme zoom (text unreadable)
  const AUTO_COMPACT_THRESHOLD = 0.62;
  const [zoomLevel, setZoomLevel] = useState(1);
  const [manualCompact, setManualCompact] = useState(false);
  const autoCompact = zoomLevel < AUTO_COMPACT_THRESHOLD;
  const isCompact = manualCompact || autoCompact;

  // Selected node and clipboard state for Ctrl+C and Ctrl+V
  const selectedNodeIdsRef = useRef([]);
  const copiedEventsRef = useRef([]);
  const [snackbarInfo, setSnackbarInfo] = useState(null);

  // Compute sequence rank / order index for each node based on DAG connections (Topological BFS)
  const computedOrderMap = useEventOrder(events, eventConnections);

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
          allCharacters: characters,
          versionsCount: ev.event_versions?.length || 1,
          isCompact: isCompact,
          onEdit: () => onOpenEditEvent(ev),
          onDelete: () => onDeleteEvent(ev.id),
          onOpenVersions: () => onOpenVersions(ev.id, ev.title),
          onCreateBackup: () => onCreateBackup(ev.id),
          onDuplicate: () => onDuplicateEvent(ev),
          onInlineUpdate: (eventId, patchData) => onInlineUpdateEvent && onInlineUpdateEvent(eventId, patchData),
          onUpdateCharacters: (eventId, charIds) => onUpdateEventCharacters && onUpdateEventCharacters(eventId, charIds),
          onQuickCreateConnected: (sourcePosition) => onQuickCreateConnectedEvent && onQuickCreateConnectedEvent({ sourceEventId: ev.id, sourcePosition }),
        },
      };
    });
  }, [
    events,
    characters,
    computedOrderMap,
    isCompact,
    onOpenEditEvent,
    onDeleteEvent,
    onOpenVersions,
    onCreateBackup,
    onDuplicateEvent,
    onInlineUpdateEvent,
    onUpdateEventCharacters,
    onQuickCreateConnectedEvent,
  ]);

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

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes.filter((change) => change.type !== 'select'));
  }, [onNodesChange]);

  // Sync state when props change
  useEffect(() => {
    if (!isDraggingRef.current) {
      setNodes((currentNodes) => {
        return initialNodes.map((newNode) => {
          const currentNode = currentNodes.find((n) => n.id === newNode.id);
          return {
            ...newNode,
            // Preserve current position if available to prevent snap-back during state updates
            position: currentNode?.position || newNode.position,
            selected: selectedNodeIdsRef.current.includes(newNode.id),
          };
        });
      });
    }
  }, [initialNodes]);

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

  const commitSelection = useCallback((nextIds) => {
    const uniqueIds = [...new Set(nextIds)];
    selectedNodeIdsRef.current = uniqueIds;
    setNodes((currentNodes) => currentNodes.map((currentNode) => ({
      ...currentNode,
      selected: uniqueIds.includes(currentNode.id),
    })));
  }, [setNodes]);

  const handleNodeClick = useCallback((event, node) => {
    if (!event.ctrlKey && !event.metaKey) {
      commitSelection([node.id]);
      return;
    }

    const currentIds = selectedNodeIdsRef.current;
    const nextIds = currentIds.includes(node.id)
      ? currentIds.filter((id) => id !== node.id)
      : [...currentIds, node.id];
    commitSelection(nextIds);
  }, [commitSelection]);

  const handlePaneClick = useCallback(() => {
    if (selectedNodeIdsRef.current.length > 0) {
      commitSelection([]);
    }
  }, [commitSelection]);

  const handlePaneDoubleClick = useCallback((event) => {
    // onPaneDoubleClick no existe en @xyflow/react v12 — se usa onDoubleClick
    // guardado en el propio componente ReactFlow (ver abajo)
  }, []);

  const handleCanvasDoubleClick = useCallback((event) => {
    // Solo actuar si el click fue directamente sobre el pane (fondo vacío)
    const target = event.target;
    const isPaneClick =
      target?.classList?.contains('react-flow__pane') ||
      target?.classList?.contains('react-flow__background');
    if (!isPaneClick) return;

    if (onQuickCreateEventAtPosition && reactFlowInstanceRef.current) {
      const position = reactFlowInstanceRef.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      onQuickCreateEventAtPosition({
        x: Math.round(position.x),
        y: Math.round(position.y),
      });
    }
  }, [onQuickCreateEventAtPosition]);

  // Handle Ctrl+C and Ctrl+V keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select' || document.activeElement?.isContentEditable) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && (e.key === 'c' || e.key === 'C')) {
        const committedIds = selectedNodeIdsRef.current;
        if (committedIds.length > 0) {
          const targetEvents = events.filter((ev) => committedIds.includes(ev.id));
          if (targetEvents.length > 0) {
            copiedEventsRef.current = targetEvents;
            setSnackbarInfo({
              severity: 'info',
              message: `${targetEvents.length} evento(s) copiado(s). Presiona Ctrl+V para pegar.`,
              icon: <ContentCopyIcon fontSize="small" />,
            });
          }
        }
      }

      if (isCtrlOrCmd && (e.key === 'v' || e.key === 'V')) {
        if (copiedEventsRef.current.length > 0 && (onDuplicateEvents || onDuplicateEvent)) {
          const copiedEvents = [...copiedEventsRef.current];
          const duplicatePromise = onDuplicateEvents
            ? onDuplicateEvents(copiedEvents)
            : Promise.all(copiedEvents.map((ev, index) =>
                onDuplicateEvent(ev, { x: 50 + (index * 20), y: 40 + (index * 20) })
              ));

          Promise.resolve(duplicatePromise).then((createdIds) => {
            if (Array.isArray(createdIds) && createdIds.length > 0) {
              commitSelection(createdIds);
            }
            setSnackbarInfo({
              severity: 'success',
              message: `${copiedEvents.length} copia(s) generada(s).`,
              icon: <ContentPasteIcon fontSize="small" />,
            });
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [events, onDuplicateEvent, onDuplicateEvents, commitSelection]);

  const isDraggingRef = useRef(false);

  // Handle Drag Start
  const handleNodeDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // Handle Drag End to persist (X, Y) coordinates
  const handleNodeDragStop = useCallback(
    (event, node, draggedNodes = [node]) => {
      isDraggingRef.current = false;
      // Update local ReactFlow state optimistically to prevent snap-back
      setNodes((nds) =>
        nds.map((currentNode) => {
          const draggedNode = draggedNodes.find((item) => item.id === currentNode.id);
          return draggedNode ? { ...currentNode, position: draggedNode.position } : currentNode;
        })
      );

      if (onNodeDragStop) {
        onNodeDragStop(draggedNodes);
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
      className="timeline-canvas"
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

        {hasStory && (
          <Tooltip title="Haz doble click en cualquier lugar vacío del canvas para crear un evento nuevo al instante">
            <Chip
              label="2× click → Nuevo evento"
              size="small"
              variant="outlined"
              icon={<AddIcon sx={{ fontSize: '13px !important' }} />}
              sx={{
                bgcolor: 'background.paper',
                borderColor: 'primary.main',
                color: 'primary.main',
                fontWeight: 700,
                fontSize: '0.72rem',
                cursor: 'default',
                opacity: 0.75,
                '&:hover': { opacity: 1 },
                transition: 'opacity 0.15s ease',
              }}
            />
          </Tooltip>
        )}
      </Box>


      {/* Empty State */}
      {!hasStory ? (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 5,
            p: { xs: 2.5, sm: 4 },
            width: { xs: 'calc(100vw - 48px)', sm: 'auto' },
            maxWidth: 440,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            boxSizing: 'border-box',
          }}
        >
          <AutoStoriesIcon sx={{ fontSize: { xs: 40, sm: 54 }, color: 'primary.main', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.8, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Comienza creando tu Historia
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.5 }}>
            Para agregar eventos a la línea de tiempo primero necesitas crear o seleccionar una historia desde el selector de historias.
          </Typography>
          <CustomButton
            startIcon={<AutoStoriesIcon fontSize="small" />}
            onClick={onOpenStorySelector}
          >
            Seleccionar Historia
          </CustomButton>
        </Box>
      ) : events.length === 0 ? (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            zIndex: 5,
            p: { xs: 2.5, sm: 4 },
            width: { xs: 'calc(100vw - 48px)', sm: 'auto' },
            maxWidth: 420,
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: 1,
            borderColor: 'divider',
            boxSizing: 'border-box',
          }}
        >
          <TimelineIcon sx={{ fontSize: { xs: 36, sm: 50 }, color: 'text.disabled', mb: 1 }} />
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.8, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Línea de Tiempo Vacía
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.8rem', sm: '0.875rem' }, lineHeight: 1.4 }}>
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
        onNodesChange={handleNodesChange}
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
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onDoubleClick={handleCanvasDoubleClick}
        onInit={(instance) => {
          reactFlowInstanceRef.current = instance;
        }}
        onMove={handleMove}
        onlyRenderVisibleElements
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.8}
        zoomOnDoubleClick={false}
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
          pannable
          zoomable
          nodeColor={(node) => {
            return node.data?.colorTag || currentThemeConfig.palette.primary.main;
          }}
          nodeStrokeWidth={2}
          nodeBorderRadius={4}
          maskColor={
            currentThemeConfig.mode === 'dark'
              ? 'rgba(15, 23, 42, 0.65)'
              : 'rgba(226, 232, 240, 0.65)'
          }
          maskStrokeColor={currentThemeConfig.palette.primary.main}
          maskStrokeWidth={2}
          style={{
            borderRadius: 10,
            border: `1px solid ${currentThemeConfig.palette.divider}`,
            backgroundColor: currentThemeConfig.palette.background.paper,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            cursor: 'grab',
            touchAction: 'none',
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
