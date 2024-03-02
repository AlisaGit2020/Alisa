import { Stack } from '@mui/material';
import { useState } from 'react';
import { WithTranslation, withTranslation } from 'react-i18next';
import { expenseContext, expenseTypeContext, transactionContext } from '@alisa-lib/alisa-contexts';
import AlisaFormHandler from '../alisa/form/AlisaFormHandler';
import DataService from '@alisa-lib/data-service';
import { ExpenseInputDto } from '@alisa-backend/accounting/expense/dtos/expense-input.dto';
import AlisaSelect from '../alisa/AlisaSelect';
import { ExpenseType } from '@alisa-backend/accounting/expense/entities/expense-type.entity';
import React from 'react';
import AlisaLoadingProgress from '../alisa/AlisaLoadingProgress';
import TransactionFormFields from './components/TransactionFormFields';
import AlisaContent from '../alisa/AlisaContent';

interface ExpenseFormProps extends WithTranslation {
    id?: number,
    propertyId?: number,
    onAfterSubmit: () => void,
    onCancel: () => void
}

function ExpenseForm({ t, id, propertyId, onAfterSubmit, onCancel }: ExpenseFormProps) {

    const [data, setData] = useState<ExpenseInputDto>(new ExpenseInputDto());
    const [ready, setReady] = useState<boolean>(false)

    const dataService = new DataService<ExpenseInputDto>({
        context: expenseContext,
        relations: { transaction: true },
        dataValidateInstance: new ExpenseInputDto()
    })

    React.useEffect(() => {
        if (id === undefined) {
            const fetchData = async () => {
                const defaults = await dataService.getDefaults();
                if (propertyId) {
                    defaults.propertyId = propertyId
                }
                return defaults
            }

            fetchData()
                .then((data) => {
                    setData(data)
                    setReady(true)
                })
        } else {
            setReady(true)
        }
    }, [])

    const handleChange = async (
        name: string,
        value: unknown
    ) => {

        let newData = dataService.updateNestedData(data, name, value)

        if (name === 'transaction.totalAmount') {
            let amount = 0
            if (data.transaction.quantity > 0) {
                amount = Number(value) / data.transaction.quantity
            }
            newData = dataService.updateNestedData(newData, 'transaction.amount', amount);
        }
        if (name === 'transaction.quantity') {
            if (Number(value) == 0) {
                newData = dataService.updateNestedData(newData, 'transaction.quantity', 1);
            }

            const amount = data.transaction.totalAmount / Number(value)
            newData = dataService.updateNestedData(newData, 'transaction.amount', amount);
        }

        if (name === 'transaction.transactionDate') {
            newData = dataService.updateNestedData(newData, 'transaction.accountingDate', value);
        }

        if (name === 'expenseTypeId') {
            if (newData.transaction.description == '') {
                const dataServiceExpenseType = new DataService<ExpenseType>({ context: expenseTypeContext })
                const expenseType = await dataServiceExpenseType.read(Number(value));
                newData = dataService.updateNestedData(newData, 'transaction.description', expenseType.name);
            }
        }

        setData(newData);
    }

    const formComponents = () => {
        return (
            <Stack spacing={2} marginBottom={2}>

                <AlisaSelect<ExpenseInputDto, ExpenseType>
                    label={t('expenseType')}
                    dataService={new DataService<ExpenseType>({
                        context: expenseTypeContext,
                        fetchOptions: { order: { name: 'ASC' } }
                    })}
                    fieldName='expenseTypeId'
                    value={data.expenseTypeId}
                    onHandleChange={handleChange}
                >
                </AlisaSelect>

                <TransactionFormFields
                    data={data.transaction}
                    onHandleChange={handleChange}
                ></TransactionFormFields>

            </Stack>
        )
    }

    if (ready) {
        return (
            <AlisaContent headerText={t('expense')}>
                <AlisaFormHandler<ExpenseInputDto>
                    id={id}
                    dataService={dataService}
                    data={data}
                    formComponents={formComponents()}
                    onSetData={setData}
                    translation={{
                        cancelButton: t('cancel'),
                        submitButton: t('save'),
                        validationMessageTitle: t('validationErrorTitle'),
                    }}

                    onCancel={onCancel}
                    onAfterSubmit={onAfterSubmit}
                >
                </AlisaFormHandler>
            </AlisaContent>
        );
    } else {
        return (<AlisaLoadingProgress></AlisaLoadingProgress>)
    }
}

export default withTranslation(transactionContext.name)(ExpenseForm);
