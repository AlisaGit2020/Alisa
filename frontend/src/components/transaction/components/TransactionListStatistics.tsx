
import { WithTranslation, withTranslation } from "react-i18next";
import DataService from "@alisa-lib/data-service";
import { Box, Paper, Stack } from "@mui/material";
import { TransactionStatisticsDto } from "@alisa-backend/accounting/transaction/dtos/transaction-statistics.dto";
import React from "react";
import { Transaction } from "@alisa-backend/accounting/transaction/entities/transaction.entity";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { TypeOrmRelationOption } from "@alisa-lib/types";

interface TransactionListStatisticsProps extends WithTranslation {
    relations?: TypeOrmRelationOption
    where?: Partial<Transaction>
}


function TransactionListStatistics({ t, where, relations }: TransactionListStatisticsProps) {
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
            const newData: TransactionStatisticsDto = await dataService.statistics<TransactionStatisticsDto>();
            console.log(newData)
            setData(newData);
        };

        fetchData()
    }, [relations, where])

    const infoBox = (headerText: string, contentText: string, backgroundColor: string, fontColor: string) => {
        return (
            <Paper sx={{ 
                width: '100%', 
                padding: 2, 
                display: 'flex', 
                justifyContent: 'space-between', 
                bgcolor: backgroundColor,
                color:fontColor 
                }}>
                <Box>{headerText}</Box>
                <Box sx={{ fontSize: '30px' }} >{contentText}</Box>
            </Paper>
        )
    }


    return (
        <Stack direction={'row'} spacing={2} marginBottom={2}>
            {infoBox(t('rowCount'), data.rowCount.toString(), 'info.main', 'white')}
            {infoBox(t('totalIncomes'), t('format.currency.euro', { val: data.totalIncomes }), 'success.main', 'white')}
            {infoBox(t('totalExpenses'), t('format.currency.euro', { val: data.totalExpenses }), 'error.main', 'white')}
            {infoBox(t('total'), t('format.currency.euro', { val: data.total }), 'white', 'black')}
        </Stack>
    )
}

export default withTranslation(transactionContext.name)(TransactionListStatistics);