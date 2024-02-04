import { WithTranslation, withTranslation } from "react-i18next"

import AlisaDataTable from "../../alisa/AlisaDataTable"
import { expenseTypeContext } from "@alisa-lib/alisa-contexts"
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity"
import DataService from "@alisa-lib/data-service"
import { useNavigate } from "react-router-dom"

function ExpenseTypes({ t }: WithTranslation) {
    const navigate = useNavigate()

    return (

        <AlisaDataTable<ExpenseType>
            title={t('expenseTypes')}
            t={t}
            dataService={new DataService({context: expenseTypeContext})}                    
            fields={[
                { name: 'name' },
                { name: 'description' },
                { name: 'isTaxDeductible' },
            ]}
            onNewRow={() => navigate(`${expenseTypeContext.routePath}/add`)} 
            />

    )
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypes)