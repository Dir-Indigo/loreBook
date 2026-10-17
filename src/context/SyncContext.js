import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Box, Tooltip, Typography, CircularProgress } from '@mui/material';
import CloudDoneOutlinedIcon from '@mui/icons-material/CloudDoneOutlined';
import CloudOffOutlinedIcon from '@mui/icons-material/CloudOffOutlined';

const SyncContext = createContext({
  syncStatus: 'synced', // 'synced' | 'saving' | 'error'
  lastSaved: null,
  errorMessage: null,
  executeOptimistic: async () => {},
});

export function SyncProvider({ children }) {
  const [syncStatus, setSyncStatus] = useState('synced');
  const [lastSaved, setLastSaved] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const activeTasksCount = useRef(0);
  const finishTimeoutRef = useRef(null);

  const executeOptimistic = useCallback(async (asyncTask, { onRollback, errorMessage: customErrMsg } = {}) => {
    activeTasksCount.current += 1;
    setSyncStatus('saving');
    setErrorMessage(null);

    if (finishTimeoutRef.current) {
      clearTimeout(finishTimeoutRef.current);
    }

    try {
      const result = await asyncTask();
      
      // Check if API returned an error payload
      if (result && result.error) {
        throw result.error;
      }

      activeTasksCount.current = Math.max(0, activeTasksCount.current - 1);
      if (activeTasksCount.current === 0) {
        finishTimeoutRef.current = setTimeout(() => {
          setSyncStatus('synced');
          setLastSaved(new Date());
        }, 350);
      }
      return { data: result?.data || result, error: null };
    } catch (err) {
      console.error('[BackgroundSync Error]:', err);
      activeTasksCount.current = Math.max(0, activeTasksCount.current - 1);
      setSyncStatus('error');
      setErrorMessage(customErrMsg || err?.message || 'Error al guardar los cambios');
      if (onRollback) {
        try {
          onRollback(err);
        } catch (rollbackErr) {
          console.error('[BackgroundSync Rollback Error]:', rollbackErr);
        }
      }
      return { data: null, error: err };
    }
  }, []);

  return (
    <SyncContext.Provider value={{ syncStatus, lastSaved, errorMessage, executeOptimistic }}>
      {children}
    </SyncContext.Provider>
  );
}

export const useBackgroundSync = () => useContext(SyncContext);

/**
 * Visual indicator component for the Navbar (Word / Google Docs cloud style)
 */
export function SyncStatusIndicator() {
  const { syncStatus, lastSaved, errorMessage } = useBackgroundSync();

  let tooltipTitle = 'Todos los cambios están guardados en la nube';
  if (syncStatus === 'saving') {
    tooltipTitle = 'Guardando cambios en segundo plano...';
  } else if (syncStatus === 'error') {
    tooltipTitle = errorMessage || 'Error de conexión. Se intentará de nuevo.';
  } else if (lastSaved) {
    tooltipTitle = `Guardado automático (${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`;
  }

  return (
    <Tooltip title={tooltipTitle} arrow>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.8,
          px: 1,
          py: 0.4,
          borderRadius: 2,
          bgcolor: (theme) =>
            syncStatus === 'error'
              ? 'error.light'
              : syncStatus === 'saving'
              ? 'action.hover'
              : 'transparent',
          color: (theme) =>
            syncStatus === 'error'
              ? 'error.main'
              : syncStatus === 'saving'
              ? 'primary.main'
              : 'text.secondary',
          transition: 'all 0.25s ease',
          userSelect: 'none',
          cursor: 'default',
        }}
      >
        {syncStatus === 'saving' && (
          <CircularProgress size={14} color="inherit" thickness={5} />
        )}
        {syncStatus === 'synced' && (
          <CloudDoneOutlinedIcon sx={{ fontSize: 17, color: 'success.main' }} />
        )}
        {syncStatus === 'error' && (
          <CloudOffOutlinedIcon sx={{ fontSize: 17, color: 'error.main' }} />
        )}

        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            fontSize: '0.72rem',
            display: { xs: 'none', md: 'inline-block' },
            letterSpacing: '0.02em',
          }}
        >
          {syncStatus === 'saving' && 'Guardando...'}
          {syncStatus === 'synced' && 'Guardado'}
          {syncStatus === 'error' && 'Sin conexión'}
        </Typography>
      </Box>
    </Tooltip>
  );
}
