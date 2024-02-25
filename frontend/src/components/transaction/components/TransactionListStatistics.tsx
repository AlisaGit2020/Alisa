
import { WithTranslation, withTranslation } from "react-i18next";


import DataService from "@alisa-lib/data-service";

import { Box, IconButton, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography } from "@mui/material";

import { TransactionStatisticsDto } from "@alisa-backend/accounting/transaction/dtos/transaction-statistics.dto";
import React from "react";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { TypeOrmRelationOption } from "@alisa-lib/types";

interface TransactionListFilterProps extends WithTranslation {
    relations?: TypeOrmRelationOption
    where?: Partial<Transaction>
}


function TransactionListStatistics({ t, where, relations }: TransactionListFilterProps) {
    const [data, setData] = React.useState<TransactionStatisticsDto>(new TransactionStatisticsDto())

    React.useEffect(() => {
        const dataService = new DataService<Transaction>({
            context: transactionContext,
            fetchOptions: {
                relations: relations,
                where: where
            }
        })
        const fetchData = async () => {
            const data: TransactionStatisticsDto = await dataService.statistics();
            console.log(data)
            setData(data);
        };

        fetchData()
    }, [where])

    const infoBox = (headerText: string, contentText: string, backgroundColor: string) => {
        return (
            <Paper sx={{ width: '100%', padding: 2,  display: 'flex', justifyContent: 'space-between', backgroundColor: backgroundColor }}>
                <Box>{headerText}</Box>
                <Box sx={{ fontSize: '30px' }} >{contentText}</Box>
            </Paper>
        )
    }


    return (
        <Stack direction={'row'} spacing={2} marginBottom={2}>
            {infoBox(t('rowCount'), data.rowCount.toString(), 'lightblue')}            
            {infoBox(t('totalIncomes'), t('format.currency.euro', { val: data.totalIncomes }), 'lightgray')}
            {infoBox(t('totalExpenses'), t('format.currency.euro', { val: data.totalExpenses }), 'pink')}
            {infoBox(t('total'), t('format.currency.euro', { val: data.total }), 'white')}
        </Stack>
    )
}

export default withTranslation(transactionContext.name)(TransactionListStatistics);