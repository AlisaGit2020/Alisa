import { Stack, Box } from "@mui/material";
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@alisa-lib/alisa-contexts";
import { AlisaButton, AlisaContent } from "../../alisa";

function TransactionChooseType({ t }: WithTranslation) {
    return (
        <AlisaContent
            headerText={t('add')}
        >
            <Stack spacing={2}>
                <Box>{t('chooseTransactionType')}</Box>
                <Stack direction={'row'} spacing={2}>
                    <AlisaButton
                        label={t('expense')}
                        variant="outlined"
                        size="large"
                        startIcon={<PaymentIcon />}
                        href={`${transactionContext.routePath}/add/expense`}
                    />
                    <AlisaButton
                        label={t('income')}
                        variant="outlined"
                        size="large"
                        startIcon={<MonetizationOnIcon />}
                        href={`${transactionContext.routePath}/add/income`}
                    />
                </Stack>
            </Stack>
        </AlisaContent>
    )
}

export default withTranslation(transactionContext.name)(TransactionChooseType);