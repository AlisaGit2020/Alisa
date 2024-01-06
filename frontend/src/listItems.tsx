import * as React from 'react';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { AccountBalanceRounded, AttachMoney, Apartment } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';


export const mainListItems = (
  <React.Fragment>
    <ListItemButton>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <Apartment />
      </ListItemIcon>
      <ListItemText primary="Apartments" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AccountBalanceRounded />
      </ListItemIcon>
      <ListItemText primary="Transactions" />
    </ListItemButton>
    <ListItemButton>
      <ListItemIcon>
        <AttachMoney />
      </ListItemIcon>
      <ListItemText primary="Taxes" />
    </ListItemButton>
  </React.Fragment>
);