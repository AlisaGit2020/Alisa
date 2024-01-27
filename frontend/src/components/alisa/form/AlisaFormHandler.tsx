import React from "react"
import AlisaForm from "./AlisaForm"


function AlisaFormHandler(props: {
    submitButtonText: string
    cancelButtonText: string
    formComponents: JSX.Element
    onCancel: () => void
}) {
    const [errorMessage, setErrorMessage] = React.useState<string>()
    const [validationMessage, setValidationMessage] = React.useState<string[]>([])

    const handleSave = () {

    }

    return (
        <AlisaForm
            submitButtonText={props.submitButtonText}
            cancelButtonText={props.cancelButtonText}
            formComponents={props.formComponents}
            errorMessage={errorMessage}
            validationMessage={validationMessage}
            onSubmit={handleSave}
            onCancel={props.onCancel}

        ></AlisaForm>
    )
}

export default AlisaFormHandler