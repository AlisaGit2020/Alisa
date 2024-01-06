import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { AccountBalanceRounded, AttachMoney, Apartment } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import React from 'react';
import List from '@mui/material/List';

export default function LeftMenu() {
  return (
    <List component="nav">
      <React.Fragment>
        <ListItemButton component="a" href='/'>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItemButton>

        <ListItemButton component="a" href='/apartments'>
          <ListItemIcon>
            <Apartment />
          </ListItemIcon>
          <ListItemText primary="Apartments" />
        </ListItemButton>

        <ListItemButton component="a">
          <ListItemIcon>
            <AccountBalanceRounded />
          </ListItemIcon>
          <ListItemText primary="Transactions" />
        </ListItemButton>

        <ListItemButton component="a">
          <ListItemIcon>
            <AttachMoney />
          </ListItemIcon>
          <ListItemText primary="Taxes" />
        </ListItemButton>
      </React.Fragment>
    </List>
  );
}
