import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  TextField,
} from '@mui/material';

/**
 * Feedback unificado: reemplaza window.confirm / window.alert.
 *  - useConfirm()  -> confirm({ title, description, confirmText, tone, requireText }) => Promise<boolean>
 *  - useNotify()   -> notify.success|error|info|warning(message)
 */
const FeedbackContext = createContext(null);

const NOTIFY_DURATION = { success: 4000, info: 4000, warning: 6000, error: 7000 };

export const FeedbackProvider = ({ children }) => {
  const [dialog, setDialog] = useState(null);
  const [typedText, setTypedText] = useState('');
  const [toast, setToast] = useState(null);
  const resolverRef = useRef(null);

  const closeDialog = useCallback((result) => {
    if (resolverRef.current) resolverRef.current(result);
    resolverRef.current = null;
    setDialog((prev) => (prev ? { ...prev, open: false } : prev));
  }, []);

  const confirm = useCallback((options = {}) => new Promise((resolve) => {
    // Si ya había una confirmación abierta, se cancela antes de abrir la nueva
    if (resolverRef.current) resolverRef.current(false);
    resolverRef.current = resolve;
    setTypedText('');
    setDialog({
      open: true,
      title: options.title || '¿Confirmar acción?',
      description: options.description || '',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
      tone: options.tone || 'default',
      requireText: options.requireText || '',
    });
  }), []);

  const showToast = useCallback((severity, message) => {
    setToast({ key: Date.now(), severity, message, open: true });
  }, []);

  const notify = useMemo(() => ({
    success: (message) => showToast('success', message),
    error: (message) => showToast('error', message),
    info: (message) => showToast('info', message),
    warning: (message) => showToast('warning', message),
  }), [showToast]);

  const value = useMemo(() => ({ confirm, notify }), [confirm, notify]);

  const isDanger = dialog?.tone === 'danger';
  const confirmBlocked = Boolean(dialog?.requireText) && typedText.trim() !== dialog.requireText;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <Dialog
        open={Boolean(dialog?.open)}
        onClose={() => closeDialog(false)}
        maxWidth="xs"
        fullWidth
        aria-labelledby="feedback-dialog-title"
        aria-describedby="feedback-dialog-description"
      >
        <DialogTitle id="feedback-dialog-title">{dialog?.title}</DialogTitle>
        <DialogContent>
          {dialog?.description && (
            <DialogContentText id="feedback-dialog-description" sx={{ whiteSpace: 'pre-line' }}>
              {dialog.description}
            </DialogContentText>
          )}
          {dialog?.requireText && (
            <TextField
              autoFocus
              fullWidth
              margin="normal"
              label={`Escribe "${dialog.requireText}" para confirmar`}
              value={typedText}
              onChange={(event) => setTypedText(event.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          {/* En acciones destructivas el foco inicial va al botón seguro (Cancelar) */}
          <Button color="inherit" autoFocus={isDanger && !dialog?.requireText} onClick={() => closeDialog(false)}>
            {dialog?.cancelText}
          </Button>
          <Button
            variant="contained"
            color={isDanger ? 'error' : 'primary'}
            disabled={confirmBlocked}
            onClick={() => closeDialog(true)}
          >
            {dialog?.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        key={toast?.key}
        open={Boolean(toast?.open)}
        autoHideDuration={toast ? NOTIFY_DURATION[toast.severity] : 4000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return;
          setToast((prev) => (prev ? { ...prev, open: false } : prev));
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast?.severity || 'info'}
          variant="filled"
          onClose={() => setToast((prev) => (prev ? { ...prev, open: false } : prev))}
          sx={{ width: '100%' }}
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </FeedbackContext.Provider>
  );
};

const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useConfirm/useNotify must be used within a FeedbackProvider');
  }
  return context;
};

export const useConfirm = () => useFeedback().confirm;
export const useNotify = () => useFeedback().notify;
