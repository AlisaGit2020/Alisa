import { TransactionInputDto } from "@alisa-backend/accounting/transaction/dtos/transaction-input.dto"
import { transactionContext } from "@alisa-lib/alisa-contexts"
import { Stack } from "@mui/material"
import { WithTranslation, withTranslation } from "react-i18next"
import AlisaDatePicker from "../../alisa/form/AlisaDatePicker"
import AlisaNumberField from "../../alisa/form/AlisaNumberField"
import AlisaTextField from "../../alisa/form/AlisaTextField"

interface ExpenseFormProps extends WithTranslation {    
    data: TransactionInputDto
    onHandleChange: (name: string, value: unknown) => void
}

function TransactionFormFields({ t, data, onHandleChange }: ExpenseFormProps) {

    const handleChange = (name: keyof TransactionInputDto, value: unknown) =>  {
        onHandleChange(`transaction.${name}`, value )
    }

    return (
        <>
            <Stack direction={'row'} spacing={2}>
                <AlisaTextField
                    label={t('sender', { ns: 'transaction' })}
                    value={data.sender}
                    autoComplete='off'
                    autoFocus={true}
                    onChange={(e) => handleChange('sender', e.target.value)}
                />

                <AlisaTextField
                    label={t('receiver', { ns: 'transaction' })}
                    value={data.receiver}
                    autoComplete='off'
                    autoFocus={true}
                    onChange={(e) => handleChange('receiver', e.target.value)}
                />
            </Stack>

            <AlisaTextField
                label={t('description', { ns: 'transaction' })}
                value={data.description}
                autoComplete='off'
                autoFocus={true}
                onChange={(e) => handleChange('description', e.target.value)}
            />

            <Stack direction={'row'} spacing={2}>
                <AlisaDatePicker
                    label={t('transactionDate', { ns: 'transaction' })}
                    value={data.transactionDate}
                    onChange={(newValue) => handleChange('transactionDate', newValue)}
                />
                <AlisaDatePicker
                    label={t('accountingDate', { ns: 'transaction' })}
                    value={data.accountingDate}
                    onChange={(newValue) => handleChange('accountingDate', newValue)}
                />

            </Stack>

            <Stack direction={'row'} spacing={2}>
                <AlisaNumberField
                    disabled={true}
                    label={t('amount', { ns: 'transaction' })}
                    value={data.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    adornment='€'
                />
                <AlisaNumberField
                    label={t('quantity', { ns: 'transaction' })}
                    value={data.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                />
                <AlisaNumberField
                    label={t('totalAmount', { ns: 'transaction' })}
                    value={data.totalAmount}
                    autoComplete='off'
                    onChange={(e) => handleChange('totalAmount', e.target.value)}
                    adornment='€'
                />
            </Stack>
        </>
    )
}
export default withTranslation(transactionContext.name)(TransactionFormFields);