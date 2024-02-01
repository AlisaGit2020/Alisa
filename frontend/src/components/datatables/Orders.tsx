import * as React from 'react';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Title from '../../Title';
import ApiClient from '../../lib/api-client';
import { expenseContext } from '@alisa-lib/alisa-contexts';
import { Expense } from '@alisa-backend/accounting/expense/entities/expense.entity';


function preventDefault(event: React.MouseEvent) {
  event.preventDefault();
}

export default function Orders() {
  const [expenses, setData] = React.useState<Expense[]>([]);

  React.useEffect(async () => {
    const data = await ApiClient.search<Expense>(expenseContext.apiPath)
    setData(data)
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
