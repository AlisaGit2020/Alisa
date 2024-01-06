import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../Title';
import { Property } from '../../../../backend/src/real-estate/property/entities/property.entity'
import getApiUrl from '../../functions';

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function ApartmentsDataTable() {
  const [expenses, setData] = React.useState<Property[]>([]);

  React.useEffect(() => {
    fetch(getApiUrl('real-estate/property'))
      .then((response) => response.json())
      .then(setData)
  }, [])

  if (expenses.length > 0) {
    return (
      <React.Fragment>
        <Title>Apartments</Title>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </React.Fragment >
    );
  } else {
    return (
      <React.Fragment>
        <Title>No recent expenses</Title>
      </React.Fragment>
    )
  }
}
