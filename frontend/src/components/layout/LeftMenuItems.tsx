import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { AccountBalanceRounded, AttachMoney, Apartment } from '@mui/icons-material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import React from 'react';
import List from '@mui/material/List';
import { WithTranslation, withTranslation } from 'react-i18next';
import { propertyContext, transactionContext } from '@alisa-lib/alisa-contexts';


function LeftMenuItems({ t }: WithTranslation) {
  return (
    <List component="nav">
      <React.Fragment>
        <ListItemButton component="a" href='/'>
          <ListItemIcon>
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText primary={t('dashboard')} />
        </ListItemButton>

        <ListItemButton component="a" href={propertyContext.routePath}>
          <ListItemIcon>
            <Apartment />
          </ListItemIcon>
          <ListItemText primary={t('properties')} />
        </ListItemButton>

        <ListItemButton component="a" href={transactionContext.routePath}>
          <ListItemIcon>
            <AccountBalanceRounded />
          </ListItemIcon>
          <ListItemText primary={t('transactions')} />
        </ListItemButton>

        <ListItemButton component="a">
          <ListItemIcon>
            <AttachMoney />
          </ListItemIcon>
          <ListItemText primary={t('taxes')} />
        </ListItemButton>
      </React.Fragment>
    </List>
  );
}

export default withTranslation('menu')(LeftMenuItems);


