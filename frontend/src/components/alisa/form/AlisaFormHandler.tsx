import React, { ReactNode } from "react";
import AlisaForm from "./AlisaForm";
import DataService from "../../../lib/data-service";
import AlisaLoadingProgress from "../AlisaLoadingProgress";

function AlisaFormHandler<T extends object>(props: {
  formComponents: JSX.Element;
  id?: number;
  data?: T;
  dataService: DataService<T>;
  translation: {
    submitButton: string;
    cancelButton: string;
    errorMessageTitle?: string;
    validationMessageTitle?: string;
  };
  submitButtonIcon?: ReactNode;
  onCancel: () => void;
  onAfterSubmit: () => void;
  onSetData: React.Dispatch<React.SetStateAction<T>>;
}) {
  const [errorMessage, setErrorMessage] = React.useState<string>();
  const [validationMessage, setValidationMessage] = React.useState<string[]>(
    [],
  );
  const [dataService] = React.useState<DataService<T>>(props.dataService);
  const [ready, setReady] = React.useState<boolean>(false);

  React.useEffect(() => {
    const fetchData = async (id: number) => {
      return await dataService.read(id);
    };

    if (props.id) {
      fetchData(props.id).then((data: T) => {
        props.onSetData(data);
        setReady(true);
      });
    } else {
      setReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    resetErrorMessages();

    if (props.data === undefined) {
      setErrorMessage("Cannot save when data is missing");
      return;
    }

    const validationErrors = await dataService.getStrValidationErrors(
      props.data,
    );
    if (validationErrors !== undefined && validationErrors.length > 0) {
      return setValidationMessage(validationErrors);
    }

    try {
      console.log("props.data", props.data);
      await dataService.save(props.data, props.id);
      props.onAfterSubmit();
    } catch (error: unknown) {
      setErrorMessage(JSON.stringify(error));
    }
  };

  const resetErrorMessages = () => {
    setValidationMessage([]);
    setErrorMessage("");
  };

  if (ready) {
    return (
      <AlisaForm
        submitButtonIcon={props.submitButtonIcon}
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
    );
  } else {
    return <AlisaLoadingProgress></AlisaLoadingProgress>;
  }
}

export default AlisaFormHandler;
