import { transactionContext } from "@alisa-lib/alisa-contexts"
import Transactions from "./Transactions"
import { WithTranslation, withTranslation } from "react-i18next"
import { Box, Button, Drawer, Paper } from "@mui/material"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import TransactionListFilter, { TransactionFilter, getMonthList } from "./components/TransactionListFilter"
import DataService from "@alisa-lib/data-service"
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import AlisaContent from "../alisa/AlisaContent"
import CheckIcon from '@mui/icons-material/Check';

function TransactionMain({ t }: WithTranslation) {
    let { propertyId } = useParams();
    propertyId = propertyId ?? '0';

    const dataService = new DataService<TransactionFilter>({
        context: transactionContext
    })
    const date = new Date()

    const [filter, setFilter] = useState<TransactionFilter>({
        propertyId: Number(propertyId),
        year: date.getFullYear(),
        month: date.getMonth() + 1
    } as TransactionFilter)

    const [filterOpen, setFilterOpen] = useState<boolean>(false)

    const navigate = useNavigate()

    const handleChange = (fieldName: string, selectedValue: number) => {
        if (fieldName === 'propertyId') {
            navigate(`${transactionContext.routePath}/${selectedValue}`)
        }
        const newFilter = dataService.updateNestedData(filter, fieldName, selectedValue)
        setFilter(newFilter)
    }


    const getMonthText = (month: number): string => {
        const monthList = getMonthList(t)
        return monthList[month - 1].name
    }

    return (
        <AlisaContent headerText={t('transactions')}>
            <Box marginBottom={2}>
                <Button
                    variant="outlined"
                    onClick={() => setFilterOpen(true)}
                    startIcon={<FilterAltOutlinedIcon></FilterAltOutlinedIcon>}
                >{filter.propertyId}, {getMonthText(filter.month)} {filter.year}
                </Button>
            </Box>

            <Drawer open={filterOpen} onClose={() => setFilterOpen(false)}>
                <TransactionListFilter
                    filter={filter}
                    onChange={handleChange}
                ></TransactionListFilter>
                <Box sx={{
                    alignItems: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                }}>
                    <Button
                        startIcon={<CheckIcon></CheckIcon>}
                        sx={{ width: 75 }}
                        variant={'contained'}
                        onClick={() => setFilterOpen(false)}
                    >{t('ok')}</Button>
                </Box>
            </Drawer>
            <Transactions
                filter={filter}
            ></Transactions>
        </AlisaContent>
    )

}

export default withTranslation(transactionContext.name)(TransactionMain)