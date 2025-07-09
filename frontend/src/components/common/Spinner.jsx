import React from 'react';

/**
 * Un componente de spinner reutilizable.
 * @param {object} props
 * @param {string} [props.size='w-16 h-16'] - Clases de Tailwind para el tamaño del spinner.
 * @param {string} [props.text=null] - Texto opcional para mostrar debajo del spinner.
 * @param {string} [props.textColor='text-slate-200'] - Clases de Tailwind para el color del texto.
 */
const Spinner = ({ size = 'w-16 h-16', text = null, textColor = 'text-slate-200' }) => {
    return (
        <div className="flex flex-col items-center justify-center" aria-label="Cargando">
            {/* El elemento giratorio */}
            <div
                className={`${size} border-4 border-cyan-400 border-t-transparent rounded-full animate-spin`}
            ></div>

            {/* Texto opcional */}
            {text && (
                <p className={`mt-4 text-xl text-center ${textColor}`}>
                    {text}
                </p>
            )}
        </div>
    );
};

export default Spinner;