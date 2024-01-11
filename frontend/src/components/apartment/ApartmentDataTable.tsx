import * as React from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../Title';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity'
import getApiUrl from '../../functions';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface InputProps {
  title: string
}

const ApartmentsDataTable: React.FC<InputProps> = ({ title }) => {
  const [expenses, setData] = React.useState<Property[]>([]);
  const [open, setOpen] = React.useState(false);
  const [apartmentIdToDelete, setApartmentIdToDelete] = React.useState(0);

  const navigate = useNavigate();

  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const response = await fetch(getApiUrl('real-estate/property'));
    const data = await response.json();
    setData(data);
  };

  const handleClickOpen = (apartmentId: number) => {
    setApartmentIdToDelete(apartmentId);
    setOpen(true);
  };

  const handleClose = () => {
    setApartmentIdToDelete(0);
    setOpen(false);
  };

  const handleDelete = async () => {
    await axios.delete(getApiUrl(`real-estate/property/${apartmentIdToDelete}`));
    fetchData();
    handleClose();
  };


  if (expenses.length > 0) {
    return (
      <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
        <Title>{title}</Title>
        <Table size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Size</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((property) => (
              <TableRow key={property.id}>
                <TableCell>{property.name}</TableCell>
                <TableCell>{property.size}</TableCell>
                <TableCell align='right'>
                  <IconButton onClick={() => navigate(`edit/${property.id}`)}><EditIcon></EditIcon></IconButton>
                  <IconButton onClick={() => handleClickOpen(property.id)}><DeleteIcon></DeleteIcon></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={open} onClose={handleClose}>
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <p>Are you sure you want to delete this apartment?</p>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleDelete} color="primary">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  } else {
    return (
      <React.Fragment>
        <Title>No apartments</Title>
      </React.Fragment>
    )
  }
}

export default ApartmentsDataTable
