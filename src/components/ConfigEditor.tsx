import React, { ChangeEvent, useState } from 'react';
import { Button, CollapsableSection, Collapse, Container, DataSourceHttpSettings, Form, InlineField, InlineFieldRow, InlineSwitch, Input, SecretInput, Switch, useTheme } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { MyDataSourceOptions, MySecureJsonData } from '../types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions, MySecureJsonData> { }


export function ConfigEditor(this: any, props: Props) {
  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [Show, setShow] = useState(false);
  const { onOptionsChange, options } = props;
  const [Auth, SetAuth] = useState(false);
  const [Cert, setCert] = useState(false);
  const [Value, setValue] = useState([]);

  const { jsonData, secureJsonFields, secureJsonData } = options;
  const onPathChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...jsonData,
        path: event.target.value,
      },
    });
  };

  const theme = useTheme();
  // Secure field (only sent to the backend)
  const onAPIKeyChange = (event: ChangeEvent<HTMLInputElement>) => {
    onOptionsChange({
      ...options,
      secureJsonData: {
        apiKey: event.target.value,
      },
    });
  };

  const onResetAPIKey = () => {
    onOptionsChange({
      ...options,
      secureJsonFields: {
        ...options.secureJsonFields,
        apiKey: false,
      },
      secureJsonData: {
        ...options.secureJsonData,
        apiKey: '',
      },
    });
  };
  const switchContainerStyle: React.CSSProperties = {
    padding: `0 ${theme.spacing.sm}`,
    height: `${theme.spacing.formInputHeight}px`,
    display: 'flex',
    alignItems: 'center',
  };

  function handleClick(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error('Function not implemented.');
  }

  function handleToggleForm(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    throw new Error('Function not implemented.');
  }

  function setPassword(value: string): void {
    throw new Error('Function not implemented.');
  }

  function handleShowHelp() {
    setShowHelp(!showHelp);
  }

  function ShowBasicAuth() {
    setShow(!Show)
  }

  function TLSClientAuth() {
    SetAuth(!Auth);
  }

  function ShowCert() {
    setCert(!Cert);
  }

  function handleAdd(): void {
    const abc = [...Value, []]
    // @ts-ignore
    setValue(abc)
  }
  function handleDelete(i: any) {
    const deleteval = [...Value]
    deleteval.splice(i, 1)
    setValue(deleteval)
  }

  return (
    <>
      <DataSourceHttpSettings
        defaultUrl="https://api.example.com"
        dataSourceConfig={options}
        onChange={onOptionsChange}
      />
    </>
  );
}

