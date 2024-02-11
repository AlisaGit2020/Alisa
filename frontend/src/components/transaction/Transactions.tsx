import { Box } from '@mui/material'
import { WithTranslation, withTranslation } from 'react-i18next';
import AlisaDataTable from '../alisa/AlisaDataTable';
import { transactionContext } from '@alisa-lib/alisa-contexts';
import { Transaction } from '@alisa-backend/accounting/transaction/entities/transaction.entity';
import DataService from '@alisa-lib/data-service';
import { TypeOrmFetchOptions } from '@alisa-lib/types';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionAddMenu from './components/TransactionAddMenu';
import TransactionImport from './components/TransactionImport';

interface TransactionsProps extends WithTranslation {
    filter: {
        propertyId?: number
    }
}

function Transactions({ t, filter }: TransactionsProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [importOpen, setImportOpen] = React.useState<boolean>(false);
    const navigate = useNavigate()

    const handleOpenAddMenu = (event?: React.MouseEvent<HTMLButtonElement>): void => {
        if (event !== undefined) {
            setAnchorEl(event.currentTarget);
        }
    };

    const handleCloseAddMenu = () => {
        setAnchorEl(null);
    };

    const handleEdit = (id: number) => {
        navigate(`${transactionContext.routePath}/edit/${id}`)
    }

    const handleOpenImport = () => {
        setImportOpen(true);
        handleCloseAddMenu()
    }

    const fetchOptions = {
        select: {
            id: true,
            transactionDate: true,
            sender: true,
            receiver: true,
            description: true,
            totalAmount: true
        },
        relations: {
            expense: true,
            income: true
        },
        order: {
            transactionDate: 'DESC'
        },
        where: [
            { expense: { propertyId: filter.propertyId } },
            { income: { propertyId: filter.propertyId } }
        ]
    } as TypeOrmFetchOptions<Transaction>

    return (

        <Box>
            <AlisaDataTable<Transaction>
                title={t('transactions')}
                t={t}
                dataService={new DataService({ context: transactionContext, fetchOptions })}
                fields={[
                    { name: 'transactionDate', format: 'date' },
                    { name: 'sender', maxLength: 30 },
                    { name: 'receiver', maxLength: 30 },
                    { name: 'description', maxLength: 40 },
                    { name: 'totalAmount', format: 'currency' },
                ]}
                onNewRow={handleOpenAddMenu}
                onEdit={handleEdit}
            />

            <TransactionAddMenu
                t={t}
                anchorEl={anchorEl}
                onClose={handleCloseAddMenu}
                onAddExpense={() => navigate(`${transactionContext.routePath}/add/expense/${filter.propertyId}`)}
                onImport={handleOpenImport}
            ></TransactionAddMenu>

            <TransactionImport
                open={importOpen}
                propertyId={Number(filter.propertyId)}
                onClose={() => setImportOpen(false)}
                t={t}
            ></TransactionImport>
        </Box>

    )
}

export default withTranslation(transactionContext.name)(Transactions)
