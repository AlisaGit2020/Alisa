import React from "react"
import AlisaForm from "./AlisaForm"
import DataService from "../../../lib/data-service"

function AlisaFormHandler<T extends { id: number }>(props: {
    formComponents: JSX.Element
    id?: number
    data?: T 
    dataService: DataService<T>    
    translation: {
        submitButton: string,
        cancelButton: string,
        errorMessageTitle?: string,
        validationMessageTitle?: string
    }
    onCancel: () => void
    onAfterSubmit: () => void
    onSetData: React.Dispatch<React.SetStateAction<T>>;
}) {
    const [errorMessage, setErrorMessage] = React.useState<string>()
    const [validationMessage, setValidationMessage] = React.useState<string[]>([])
    const [dataService] = React.useState<DataService<T>>(props.dataService)

    React.useEffect(() => {
        const fetchData = async (id: number) => {
            const data = await dataService.read(id);            
            return data
        }

        if (props.id) {
            fetchData((props.id))
                .then(props.onSetData)
        }    
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSubmit = async () => {

        if (props.data === undefined) {
            throw new Error('Cannot save when data is missing');
        }

        const validationErrors = await dataService.getStrValidationErrors(props.data)
        if (validationErrors.length > 0) {
            return setValidationMessage(validationErrors)
        }

        try{
            await dataService.save(props.data, props.id)            
            props.onAfterSubmit()
        } catch (error: unknown) {
            setErrorMessage(JSON.stringify(error))
        }        
                
    }

    return (
        <AlisaForm
            submitButtonText={props.translation.submitButton}
            cancelButtonText={props.translation.cancelButton}
            errorMessageTitle={props.translation.errorMessageTitle}
            validationMessageTitle={props.translation.validationMessageTitle}
            formComponents={props.formComponents}
            errorMessage={errorMessage}
            validationMessage={validationMessage}
            onSubmit={handleSubmit}
            onCancel={props.onCancel}
        ></AlisaForm>
    )
}

export default AlisaFormHandler