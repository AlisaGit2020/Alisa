import { Stack, Box } from "@mui/material";
import PaymentIcon from '@mui/icons-material/Payment';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import { WithTranslation, withTranslation } from "react-i18next";
import { transactionContext } from "@asset-lib/asset-contexts";
import { AssetButton, AssetContent } from "../../asset";

function TransactionChooseType({ t }: WithTranslation) {
    return (
        <AssetContent
            headerText={t('add')}
        >
            <Stack spacing={2}>
                <Box>{t('chooseTransactionType')}</Box>
                <Stack direction={'row'} spacing={2}>
                    <AssetButton
                        label={t('expense')}
                        variant="outlined"
                        size="large"
                        startIcon={<PaymentIcon />}
                        href={`${transactionContext.routePath}/add/expense`}
                    />
                    <AssetButton
                        label={t('income')}
                        variant="outlined"
                        size="large"
                        startIcon={<MonetizationOnIcon />}
                        href={`${transactionContext.routePath}/add/income`}
                    />
                </Stack>
            </Stack>
        </AssetContent>
    )
}

export default withTranslation(transactionContext.name)(TransactionChooseType);