import React, { useEffect, useState } from 'react';

type AutoCompleteTextAreaProps = {
  elementId: string;
  className: string;
  smallClassName: string;
  bigClassName: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  defaultValue?: string;
  name?: string;
};

const AutoCompleteTextArea: React.FC<AutoCompleteTextAreaProps> = ({
  elementId,
  className,
  smallClassName,
  bigClassName,
  onChange,
  placeholder,
  defaultValue,
  name,
}) => {
  const [doReload, setDoReload] = useState(false);
  const [isBig, setIsBig] = useState<boolean>();
  const [value, setValue] = useState<string>();

  const localChange = (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    let input = event.target.value;

    input = input.replaceAll('%3A', ':');
    input = input.replaceAll('%20', ' ');
    input = input.replaceAll('%0A', '\n');

    if (input.length > 17) {
      if (!isBig) {
        setIsBig(true);
        setDoReload(!doReload);
      }
    } else if (isBig) {
      setIsBig(false);
      setDoReload(!doReload);
    }

    setValue(input);

    if (input !== event.target.value) {
      const element = document.getElementById(elementId) as HTMLInputElement;
      element.value = input;
    }
    if (onChange) onChange(input);
  };

  const pasteListener = () => {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.addEventListener('paste', async (event) => {
      if (isBig) return;
      event.preventDefault();
      const text = await navigator.clipboard.readText();
      const element = document.getElementById(elementId) as HTMLInputElement;
      setTimeout(() => {
        const localValue = element.value + text;
        setValue(localValue);
        setIsBig(localValue.length > 17);
        setDoReload(!doReload);
      }, 10);
    });
  };

  useEffect(() => {
    if (value) {
      const element = document.getElementById(elementId) as HTMLInputElement;
      element.value = value;
      element.focus();
    }
    pasteListener();
  }, [doReload]);

  return isBig ? (
    <textarea
      id={elementId}
      className={`${className} ${bigClassName}`}
      onChange={localChange}
      name={name}
      placeholder={placeholder}
      defaultValue={defaultValue}
    />
  ) : (
    <input
      autoFocus
      id={elementId}
      className={`${className} ${smallClassName}`}
      onChange={localChange}
      name={name}
      type="text"
      placeholder={placeholder}
      defaultValue={defaultValue}
    />
  );
};

export default AutoCompleteTextArea;
