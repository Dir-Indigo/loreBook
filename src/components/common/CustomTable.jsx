import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Box,
  Typography,
  TextField,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

/**
 * CustomTable (RF-5.4, Phase 2.2)
 * Clean matte data table with built-in search and pagination.
 */
export default function CustomTable({
  columns = [],
  data = [],
  searchable = true,
  searchPlaceholder = 'Buscar registros...',
  searchKeys = [],
  rowsPerPageOptions = [5, 10, 25],
  defaultRowsPerPage = 10,
  emptyMessage = 'No se encontraron datos registrados',
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [searchQuery, setSearchQuery] = useState('');

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery || !searchable) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) => {
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = row[key];
          return val && String(val).toLowerCase().includes(q);
        });
      }
      return Object.values(row).some((val) =>
        val && String(val).toLowerCase().includes(q)
      );
    });
  }, [data, searchQuery, searchable, searchKeys]);

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        overflow: 'hidden',
        border: 1,
        borderColor: 'divider',
        borderRadius: 2.5,
      }}
    >
      {searchable && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <TextField
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      )}

      <TableContainer sx={{ maxHeight: 560 }}>
        <Table stickyHeader aria-label="custom data table">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth, width: col.width }}
                >
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id || index}
                  sx={{
                    transition: 'background-color 0.15s ease',
                    '&:last-child td, &:last-child th': { border: 0 },
                  }}
                >
                  {columns.map((col) => {
                    const value = row[col.id];
                    return (
                      <TableCell key={col.id} align={col.align || 'left'}>
                        {col.render ? col.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <InboxOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
                    <Typography variant="body2" color="text.secondary">
                      {emptyMessage}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
        sx={{ borderTop: 1, borderColor: 'divider' }}
      />
    </Paper>
  );
}
