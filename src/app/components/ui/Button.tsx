import React from 'react';


type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'danger';
};


export default function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
    const base = 'px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2';

    const variants: Record<string, string> = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-300',
    ghost: 'bg-transparent text-gray-700 border border-gray-200 hover:bg-gray-50 focus:ring-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-300',
    };
    
    return <button className={`${base} ${variants[variant]} ${className}`} {...rest} />;
}