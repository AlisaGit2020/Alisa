import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from './Title';
import { Expense } from '../../backend/src/accounting/expense/entities/expense.entity'

// Generate Order Data
function createData(
  id: number,
  date: string,
  name: string,
  shipTo: string,
  paymentMethod: string,
  amount: number,
) {
  return { id, date, name, shipTo, paymentMethod, amount };
}

const rows = [
  createData(
    0,
    '16 Mar, 2019',
    'Elvis Presley',
    'Tupelo, MS',
    'VISA ⠀•••• 3719',
    312.44,
  ),
  createData(
    1,
    '16 Mar, 2019',
    'Paul McCartney',
    'London, UK',
    'VISA ⠀•••• 2574',
    866.99,
  ),
  createData(2, '16 Mar, 2019', 'Tom Scholz', 'Boston, MA', 'MC ⠀•••• 1253', 100.81),
  createData(
    3,
    '16 Mar, 2019',
    'Michael Jackson',
    'Gary, IN',
    'AMEX ⠀•••• 2000',
    654.39,
  ),
  createData(
    4,
    '15 Mar, 2019',
    'Bruce Springsteen',
    'Long Branch, NJ',
    'VISA ⠀•••• 5919',
    212.79,
  ),
];

function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}


export default function Orders() {
  const [expenses, setData] = React.useState<Expense[]>([]);

  React.useEffect(() => {
    fetch('http://localhost:3000/accounting/expense')
      .then((response) => response.json())
      .then(setData)
  }, [])

  if (expenses.length > 0) {
    return (
      <React.Fragment>
        <Title>Recent Expenses</Title>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align='right'>Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.transaction.transactionDate}</TableCell>
                <TableCell>{row.expenseType.name}</TableCell>
                <TableCell>{row.transaction.description}</TableCell>
                <TableCell>{row.transaction.quantity}</TableCell>
                <TableCell>{row.transaction.amount}</TableCell>
                <TableCell align='right' >{row.transaction.totalAmount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Link color="primary" href="#" onClick={preventDefault} sx={{ mt: 3 }}>
          See more orders
        </Link>
      </React.Fragment>
    );
  } else {
    return (
      <React.Fragment>
        <Title>No recent expenses</Title>
      </React.Fragment>
    )
  }
}
