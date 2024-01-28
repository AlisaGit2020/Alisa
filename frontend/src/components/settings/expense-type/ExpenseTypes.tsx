import { WithTranslation, withTranslation } from "react-i18next"
import { ExpenseType } from "../../../../../backend/src/accounting/expense/entities/expense-type.entity"
import AlisaDataTable from "../../alisa/AlisaDataTable"
import { expenseTypeContext } from "../../../alisa-contexts/alisa-contexts"

function ExpenseTypes({ t }: WithTranslation) {
    return (

        <AlisaDataTable<ExpenseType>
            title={t('expenseTypes')}
            t={t}
            alisaContext={expenseTypeContext}
            fields={[
                { name: 'name' },
                { name: 'description' },
                { name: 'isTaxDeductible' },
            ]} />

    )
}

export default withTranslation(expenseTypeContext.name)(ExpenseTypes)