import { Box, Button, ButtonGroup } from "@mui/material"

import AlisaAlert from "../dialog/AlisaAlert"
import React, { ReactNode } from "react"

function AlisaForm(props: {
    formComponents: React.JSX.Element
    submitButtonText: string
    submitButtonIcon?: ReactNode
    submitDisabled?: boolean
    cancelButtonText: string
    errorMessage?: string | string[]
    errorMessageTitle?: string
    validationMessage: string | string[]
    validationMessageTitle?: string
    onSubmit: () => void
    onCancel: () => void
}) {
    return (
        <Box>
            {props.formComponents}

            <Box marginTop={3} >
                <ButtonGroup>
                    <Button variant="contained" color="primary"
                        onClick={props.onSubmit}
                        disabled={props.submitDisabled}
                        startIcon={props.submitButtonIcon}>
                        {props.submitButtonText}
                    </Button>
                    <Button variant="outlined"
                        onClick={props.onCancel}>
                        {props.cancelButtonText}
                    </Button>
                </ButtonGroup>
            </Box>

            {(props.errorMessage || props.validationMessage) && (

                <Box marginTop={3}>
                    <AlisaAlert
                        title={props.errorMessageTitle}
                        severity='error'
                        content={props.errorMessage}>
                    </AlisaAlert>
                    <AlisaAlert
                        title={props.validationMessageTitle}
                        severity='warning'
                        content={props.validationMessage}>
                    </AlisaAlert>
                </Box>
            )}
        </Box>
    )
}

export default AlisaForm