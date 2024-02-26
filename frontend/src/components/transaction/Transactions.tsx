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
import { TransactionFilter } from './components/TransactionListFilter';
import TransactionListStatistics from './components/TransactionListStatistics';
import TransactionDetails from './components/TransactionDetails';

interface TransactionsProps extends WithTranslation {
    filter: TransactionFilter
}

function Transactions({ t, filter }: TransactionsProps) {
    const [anchorElAdd, setAnchorElAdd] = React.useState<null | HTMLElement>(null);    
    const [detailId, setDetailId] = React.useState<number>(0);
    const [importOpen, setImportOpen] = React.useState<boolean>(false);
    const navigate = useNavigate()

    const handleOpenAddMenu = (event?: React.MouseEvent<HTMLButtonElement>): void => {
        if (event !== undefined) {
            setAnchorElAdd(event.currentTarget);
        }
    };

    const handleCloseAddMenu = () => {
        setAnchorElAdd(null);
    };

    const handleEdit = (id: number) => {
        navigate(`${transactionContext.routePath}/edit/${id}`)
    }

    const handleOpenImport = () => {
        setImportOpen(true);
        handleCloseAddMenu()
    }

    const handleOpenDetails = (id: number) => {
        setDetailId(id)
    }

    const transactionDateFilter = (): object => {
        const startDate = new Date(filter.year, filter.month - 1, 1); 
        const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59); 
        return {
            transactionDate: {
                $between: [startDate, endDate]
            } 
        }
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
            { expense: { propertyId: filter.propertyId }, ...transactionDateFilter() },
            { income: { propertyId: filter.propertyId }, ...transactionDateFilter() }            
        ],
        
    } as TypeOrmFetchOptions<Transaction>

    return (

        <Box>
            <TransactionListStatistics
                relations={fetchOptions.relations}
                where={fetchOptions.where}
            ></TransactionListStatistics>
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
                onOpen={handleOpenDetails}
            />

            <TransactionDetails              
              id={detailId}
              onClose={() => setDetailId(0)}  
            ></TransactionDetails>
            
            <TransactionAddMenu
                t={t}
                anchorEl={anchorElAdd}
                onClose={handleCloseAddMenu}
                onAddExpense={() => navigate(`${transactionContext.routePath}/add/expense/${filter.propertyId}`)}
                onAddIncome={() => navigate(`${transactionContext.routePath}/add/income/${filter.propertyId}`)}
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
