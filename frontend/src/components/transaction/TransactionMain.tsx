import { transactionContext } from "@alisa-lib/alisa-contexts"
import Transactions from "./Transactions"
import { WithTranslation, withTranslation } from "react-i18next"
import { Paper } from "@mui/material"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import TransactionListFilter, { TransactionFilter } from "./components/TransactionListFilter"
import DataService from "@alisa-lib/data-service"

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

    const navigate = useNavigate()

    const handleChange = (fieldName: string, selectedValue: number) => {
        if (fieldName === 'propertyId') {
            navigate(`${transactionContext.routePath}/${selectedValue}`)
                        
        }
        const newFilter = dataService.updateNestedData(filter, fieldName, selectedValue)
        setFilter(newFilter)
    }

    return (
        <>
            <Paper sx={{ p: 2, marginBottom: 3, display: 'flex', flexDirection: 'column' }}>
                <TransactionListFilter
                    filter={filter}
                    onChange={handleChange}
                ></TransactionListFilter>
            </Paper>
            <Transactions
                filter={filter}
            ></Transactions>
        </>
    )

}

export default withTranslation(transactionContext.name)(TransactionMain)