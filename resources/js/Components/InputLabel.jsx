export default function InputLabel({
    value,
    className = '',
    children,
    required = false,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-sm font-medium text-gray-700 ` +
                className
            }
        >
            {value ? value : children}
            {required && <span className="ml-0.5 text-red-500 dark:text-red-400">*</span>}
        </label>
    );
}
