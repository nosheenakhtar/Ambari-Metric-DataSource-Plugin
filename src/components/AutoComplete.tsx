import React, { useState, useRef, useEffect } from 'react';
import { InlineField, Input } from '@grafana/ui';
import './AutoComplete.css';

const AutocompleteInput = ({ value, placeholder, suggestions, onChange }: { value: string, placeholder: string, suggestions: string[], onChange: (input: string) => void }) => {
    const [inputValue, setInputValue] = useState(value);
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
    const wrapperRef = useRef(null);

    const onInputChange = (e: any) => {
        const userInput = e.target.value;
        setInputValue(userInput);

        const filtered = suggestions.filter(
            (suggestion) =>
                suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
        );

        setFilteredSuggestions(filtered);
        setShowSuggestions(true);
        setActiveSuggestionIndex(0);
        onChange(userInput);
    };

    // const onInputBlue = () => {
    //     setTimeout(() => {
    //         setShowSuggestions(false);
    //         setTimeout(() => {
    //             onChange(value);
    //         }, 100);
    //     }, 100);
    // };

    const onClick = (e: any) => {
        setFilteredSuggestions([]);
        setInputValue(e.target.innerText);
        setShowSuggestions(false);
        onChange(e.target.innerText);
    };

    const onFocus = () => {
        if (inputValue === '') {
            setFilteredSuggestions(suggestions.slice(0, 15));
        } else {
            const filtered = suggestions.filter(
                (suggestion) =>
                    suggestion.toLowerCase().indexOf(inputValue.toLowerCase()) > -1
            );
            setFilteredSuggestions(filtered.slice(0, 15));
        }
        setShowSuggestions(true);
        setActiveSuggestionIndex(0);
    };

    const onKeyDown = (e: any) => {
        if (e.keyCode === 13) { // Enter key
            setInputValue(filteredSuggestions[activeSuggestionIndex]);
            setShowSuggestions(false);
        } else if (e.keyCode === 38) { // Up arrow
            if (activeSuggestionIndex === 0) {
                return;
            }
            setActiveSuggestionIndex(activeSuggestionIndex - 1);
        } else if (e.keyCode === 40) { // Down arrow
            if (activeSuggestionIndex - 1 === filteredSuggestions.length) {
                return;
            }
            setActiveSuggestionIndex(activeSuggestionIndex + 1);
        }
    };

    const handleClickOutside = (event: any) => {
        // @ts-ignore
        if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
            setShowSuggestions(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const SuggestionsListComponent = () => {
        return filteredSuggestions.length ? (
            <ul className="custom-dropdown">
                {filteredSuggestions.map((suggestion, index) => {
                    let className = "custom-dropdown-item";
                    if (index === activeSuggestionIndex) {
                        className += " custom-dropdown-item-active";
                    }
                    return (
                        <li className={className} key={suggestion} onClick={onClick}>
                            {suggestion}
                        </li>
                    );
                })}
            </ul>
        ) : (
            <ul className="custom-dropdown">
                <li className="custom-no-suggestions">
                    <em>No option found</em>
                </li>
            </ul>
        );
    };

    return (
        <div className="input-wrapper" ref={wrapperRef}>
            <Input
                value={inputValue}
                placeholder={placeholder}
                onChange={onInputChange}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                className='custom-input'
            // onBlur={onInputBlue}
            />
            {showSuggestions && <SuggestionsListComponent />}
        </div>
    );
};

export default AutocompleteInput;
