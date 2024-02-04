import { Divider, Grid, ListItemIcon, ListItemText, Menu, MenuItem, MenuList, Paper } from '@mui/material'
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { transactionContext } from '@alisa-lib/alisa-contexts';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import DataService from '@alisa-lib/data-service';
import { TypeOrmFetchOptions } from '@alisa-lib/types';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function Transactions({ t }: WithTranslation) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const navigate = useNavigate()

    const handleOpenAddMenu = (event?: React.MouseEvent<HTMLButtonElement>): void => {
        if (event !== undefined) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleCloseAddMenu = () => {
        setAnchorEl(null);
    };

    const fetchOptions = {
        relations: {
            expense: true
        },
        order: {
            transactionDate: 'ASC'
        }
    } as TypeOrmFetchOptions<Transaction>

    return (

        <Grid container>

            <Grid item xs={12} lg={12}>
                <AlisaDataTable<Transaction>
                    title={t('transactions')}
                    t={t}
                    dataService={new DataService({ context: transactionContext, fetchOptions })}
                    fields={[
                        { name: 'transactionDate', format: 'date' },
                        { name: 'description' },
                        { name: 'amount', format: 'currency' },
                        { name: 'quantity', format: 'number' },
                        { name: 'totalAmount', format: 'currency' },
                    ]}
                    onNewRow={handleOpenAddMenu}
                />
            </Grid>

            <Paper sx={{ width: 320, minWidth: 220, maxWidth: '100%' }}>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleCloseAddMenu}
                >
                    <MenuList>
                        <MenuItem >
                            <ListItemText>Lisää uusi tapahtuma</ListItemText>
                        </MenuItem>
                        <Divider></Divider>
                        <MenuItem onClick={() => navigate(`${transactionContext.routePath}/add/expense`)}>
                            <ListItemIcon>
                                <PaymentIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>{t('expense')}</ListItemText>
                        </MenuItem>
                        <MenuItem>
                            <ListItemIcon>
                                <MonetizationOnIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>{t('income')}</ListItemText>
                        </MenuItem>
                    </MenuList>
                </Menu>
            </Paper>
        </Grid>

    )
}

export default withTranslation(transactionContext.name)(Transactions)
