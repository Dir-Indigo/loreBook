import React from 'react';
import {
  Box,
  Tabs,
  Tab,
  Badge,
  Tooltip,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import { useWorkspaceView, WORKSPACE_VIEW_KEYS } from '../../context/WorkspaceViewContext';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useQuickNotes } from '../../context/QuickNotesContext';

export default function NavbarWorkspaceTabs() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const { activeView, setActiveView, views } = useWorkspaceView();
  const { characters = [], events = [] } = useWorkspace();
  const { totalCount: notesCount } = useQuickNotes();

  const getBadgeCount = (viewId) => {
    if (viewId === WORKSPACE_VIEW_KEYS.CHARACTERS) return characters.length;
    if (viewId === WORKSPACE_VIEW_KEYS.IDEAS) return notesCount;
    if (viewId === WORKSPACE_VIEW_KEYS.EVENTS) return events.length;
    return 0;
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.subtle',
        p: '3px',
        borderRadius: 2.5,
        border: 1,
        borderColor: 'divider',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
      }}
    >
      <Tabs
        value={activeView}
        onChange={(e, val) => setActiveView(val)}
        variant="standard"
        TabIndicatorProps={{
          sx: {
            display: 'none', // We style each tab directly as a floating pill
          },
        }}
        sx={{
          minHeight: 32,
          '& .MuiTabs-flexContainer': {
            gap: 0.5,
          },
        }}
      >
        {views.map((v) => {
          const IconComponent = v.icon;
          const isSelected = activeView === v.id;
          const count = getBadgeCount(v.id);

          return (
            <Tooltip key={v.id} title={isTablet ? v.label : v.description} arrow enterDelay={300}>
              <Tab
                value={v.id}
                icon={
                  <Badge
                    badgeContent={count > 0 ? count : null}
                    color={v.id === WORKSPACE_VIEW_KEYS.IDEAS ? 'secondary' : 'primary'}
                    max={99}
                    slotProps={{
                      badge: {
                        sx: {
                          fontSize: '0.62rem',
                          height: 15,
                          minWidth: 15,
                          px: '3px',
                        },
                      },
                    }}
                  >
                    <IconComponent
                      sx={{
                        fontSize: 17,
                        color: isSelected ? 'primary.main' : 'text.secondary',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </Badge>
                }
                iconPosition="start"
                label={
                  isTablet ? null : (
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: isSelected ? 800 : 600,
                        fontSize: '0.78rem',
                        textTransform: 'none',
                        color: isSelected ? 'text.primary' : 'text.secondary',
                      }}
                    >
                      {v.shortLabel}
                    </Typography>
                  )
                }
                sx={{
                  minHeight: 30,
                  minWidth: isTablet ? 38 : 96,
                  px: isTablet ? 1 : 1.6,
                  py: 0.3,
                  borderRadius: 2,
                  bgcolor: isSelected ? 'background.paper' : 'transparent',
                  boxShadow: isSelected ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  border: isSelected ? 1 : '1px solid transparent',
                  borderColor: isSelected ? 'divider' : 'transparent',
                  transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    bgcolor: isSelected ? 'background.paper' : 'action.hover',
                    '& .MuiSvgIcon-root': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              />
            </Tooltip>
          );
        })}
      </Tabs>
    </Box>
  );
}
