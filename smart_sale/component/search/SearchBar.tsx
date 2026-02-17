import React from 'react';
import { InputGroup } from '@chakra-ui/react';
import { CapitalizedInput } from '../form/CapitalizedInput';
import { FiSearch, FiX } from 'react-icons/fi';
import { useTheme } from '@/context/theme/themeContext';

interface SearchBarProps<T = any> {
    searchTerm: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onClear?: () => void;
    disabled?: boolean;
    autoFocus?: boolean;
    size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg';
    rounded?: string;
    maxWidth?: string;
    minWidth?: string;
    width?: string;
    field?: keyof T;
    allowSpecial?: boolean;
    className?: string;
}

const SearchBar = <T,>({
    searchTerm,
    onChange,
    placeholder = 'Search...',
    onClear,
    disabled = false,
    autoFocus = false,
    size = 'md',
    rounded = 'full',
    maxWidth,
    minWidth,
    width = '100%',
    field = 'search' as keyof T,
    allowSpecial = true,
    className = '',
}: SearchBarProps<T>) => {
    const { theme } = useTheme();

    const handleClear = () => {
        onChange('');
        if (onClear) onClear();
    };

    const handleChange = (field: keyof T, value: any) => {
        onChange(value);
    };

    return (
        <InputGroup
            className={className}
            startElement={<FiSearch color={theme?.colors?.accient || '#011f4b' } />}
            endElement={
                searchTerm && !disabled ? (
                    <FiX
                        style={{ cursor: 'pointer' }}
                        onClick={handleClear}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#bd0808';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = theme?.colors?.greyColor || '#718096';
                        }}
                    />
                ) : undefined
            }
            maxWidth={maxWidth}
            minWidth={minWidth}
            width={width}
        >
            <CapitalizedInput<T>
                value={searchTerm}
                field={field}
                onChange={handleChange}
                placeholder={placeholder}
                type="text"
                size={size}
                disabled={disabled}
                autoFocus={autoFocus}
                rounded={rounded}
                maxWidth="100%"
                minWidth="0"
                icon={true}
                allowSpecial={allowSpecial}
            
            />
        </InputGroup>
    );
};

export default SearchBar;