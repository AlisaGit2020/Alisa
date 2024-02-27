import { Box, Grid } from '@mui/material'
import { withTranslation } from 'react-i18next';
import ExpenseTypes from './expense-type/ExpenseTypes';
import SettingsMenu from './components/SettingsMenu';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpenseTypeForm from './expense-type/ExpenseTypeForm';
import IncomeTypes from './income-type/IncomeTypes';
import IncomeTypeForm from './income-type/IncomeTypeForm';

function Settings() {
    const { page = 'expense-types', action = ''} = useParams();
    const navigate = useNavigate();

    const handleMenuClick = (selectedItem: SettingsPage) => {
        navigate(`/settings/${selectedItem}`)
    }


    const getContent = (iPage: SettingsPage, iAction: Action, content: ReactNode) => {
        if (page === iPage && action === iAction) {
            return (
                <Box>{content}</Box>
            )
        }
        return ''
    }

    return (

        <Grid container>
            <Grid item lg={3} >
                <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
            </Grid>
            <Grid item xs={12} lg={9}>
                {getContent(SettingsPage.ExpenseTypes, Action.List, <ExpenseTypes></ExpenseTypes>)}
                {getContent(SettingsPage.ExpenseTypes, Action.Add, <ExpenseTypeForm></ExpenseTypeForm>)}
                {getContent(SettingsPage.ExpenseTypes, Action.Edit, <ExpenseTypeForm></ExpenseTypeForm>)}

                {getContent(SettingsPage.IncomeTypes, Action.List, <IncomeTypes></IncomeTypes>)}
                {getContent(SettingsPage.IncomeTypes, Action.Add, <IncomeTypeForm></IncomeTypeForm>)}
                {getContent(SettingsPage.IncomeTypes, Action.Edit, <IncomeTypeForm></IncomeTypeForm>)}
            </Grid>
        </Grid>

    )
}

export enum SettingsPage {
    ExpenseTypes = 'expense-types',
    IncomeTypes = 'income-types'
}

export enum Action {
    Add = 'add',
    Edit = 'edit',
    List = ''
}

export default withTranslation('settings')(Settings)
