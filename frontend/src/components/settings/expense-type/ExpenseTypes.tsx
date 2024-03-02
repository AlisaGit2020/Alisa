import { WithTranslation, withTranslation } from "react-i18next"

import AlisaDataTable from "../../alisa/AlisaDataTable"
import { expenseTypeContext } from "@alisa-lib/alisa-contexts"
import { ExpenseType } from "@alisa-backend/accounting/expense/entities/expense-type.entity"
import DataService from "@alisa-lib/data-service"
import { useNavigate } from "react-router-dom"
import AlisaContent from "../../alisa/AlisaContent"

function ExpenseTypes({ t }: WithTranslation) {
    const navigate = useNavigate()

    const handleEdit = (id: number) => {
        navigate(`${expenseTypeContext.routePath}/edit/${id}`)
    }
    return (
        <AlisaContent headerText={t('expenseTypes')}>
            <AlisaDataTable<ExpenseType>
                t={t}
                dataService={new DataService({ context: expenseTypeContext })}
                fields={[
                    { name: 'name' },
                    { name: 'description' },
                    { name: 'isTaxDeductible' },
                ]}
                onNewRow={() => navigate(`${expenseTypeContext.routePath}/add`)}
                onEdit={handleEdit}
                onOpen={() => { }}
                onDelete={() => {}}
            />
        </AlisaContent>
    )
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypes)