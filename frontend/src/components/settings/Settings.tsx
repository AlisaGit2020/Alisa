import { Box, Grid } from '@mui/material'
import { withTranslation } from 'react-i18next';
import ExpenseTypes from './expense-type/ExpenseTypes';
import SettingsMenu from './components/SettingsMenu';
import { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExpenseTypeForm from './expense-type/ExpenseTypeForm';
import IncomeTypes from './income-type/IncomeTypes';
import IncomeTypeForm from './income-type/IncomeTypeForm';
import LoanSettings from './loan-settings/LoanSettings';
import ThemeSettings from './theme/ThemeSettings';
import { FormPageTemplate } from '../templates';

function Settings() {
    const { page = 'expense-types', action = '', idParam } = useParams();
    const navigate = useNavigate();

    const handleMenuClick = (selectedItem: SettingsPage) => {
        navigate(`/app/settings/${selectedItem}`)
    }

    const getContent = (iPage: SettingsPage, iAction: Action, content: ReactNode) => {
        if (page === iPage && action === iAction) {
            return (
                <Box>{content}</Box>
            )
        }
        return ''
    }

    const parsedId = idParam ? Number(idParam) : undefined;

    return (
        <FormPageTemplate translationPrefix="settings">
            <Grid container>
                <Grid size={{ lg: 3 }} >
                    <SettingsMenu onClick={handleMenuClick} selectedItem={page as SettingsPage} ></SettingsMenu>
                </Grid>
                <Grid size={{ xs: 12, lg: 9 }}>
                    {getContent(SettingsPage.ExpenseTypes, Action.List,
                        <ExpenseTypes
                            onAdd={() => navigate('/app/settings/expense-types/add')}
                            onEdit={(id) => navigate(`/app/settings/expense-types/edit/${id}`)}
                        />
                    )}
                    {getContent(SettingsPage.ExpenseTypes, Action.Add,
                        <ExpenseTypeForm
                            onCancel={() => navigate('/app/settings/expense-types')}
                            onAfterSubmit={() => navigate('/app/settings/expense-types')}
                        />
                    )}
                    {getContent(SettingsPage.ExpenseTypes, Action.Edit,
                        <ExpenseTypeForm
                            id={parsedId}
                            onCancel={() => navigate('/app/settings/expense-types')}
                            onAfterSubmit={() => navigate('/app/settings/expense-types')}
                        />
                    )}

                    {getContent(SettingsPage.IncomeTypes, Action.List,
                        <IncomeTypes
                            onAdd={() => navigate('/app/settings/income-types/add')}
                            onEdit={(id) => navigate(`/app/settings/income-types/edit/${id}`)}
                        />
                    )}
                    {getContent(SettingsPage.IncomeTypes, Action.Add,
                        <IncomeTypeForm
                            onCancel={() => navigate('/app/settings/income-types')}
                            onAfterSubmit={() => navigate('/app/settings/income-types')}
                        />
                    )}
                    {getContent(SettingsPage.IncomeTypes, Action.Edit,
                        <IncomeTypeForm
                            id={parsedId}
                            onCancel={() => navigate('/app/settings/income-types')}
                            onAfterSubmit={() => navigate('/app/settings/income-types')}
                        />
                    )}

                    {getContent(SettingsPage.LoanSettings, Action.List, <LoanSettings></LoanSettings>)}

                    {getContent(SettingsPage.Theme, Action.List, <ThemeSettings></ThemeSettings>)}
                </Grid>
            </Grid>
        </FormPageTemplate>
    )
}

export enum SettingsPage {
    ExpenseTypes = 'expense-types',
    IncomeTypes = 'income-types',
    LoanSettings = 'loan-settings',
    Theme = 'theme'
}

export enum Action {
    Add = 'add',
    Edit = 'edit',
    List = ''
}

export default withTranslation('settings')(Settings)
