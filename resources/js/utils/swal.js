import Swal from 'sweetalert2';

/**
 * Generic SweetAlert2 confirmation dialog.
 *
 * @param {object} options
 * @param {string} options.title - Dialog title
 * @param {string} options.text - Body text
 * @param {string} [options.confirmButtonText='Yes'] - Confirm button label
 * @param {string} [options.cancelButtonText='Cancel'] - Cancel button label
 * @param {string} [options.icon='warning'] - Icon type: warning|error|info|question|success
 * @param {string} [options.confirmColor='#dc2626'] - Confirm button color (default red)
 * @returns {Promise<boolean>} - Resolves true if confirmed, false if dismissed
 */
export async function confirmAction({
    title = 'Are you sure?',
    text = '',
    confirmButtonText = 'Yes',
    cancelButtonText = 'Cancel',
    icon = 'warning',
    confirmColor = '#dc2626',
} = {}) {
    const result = await Swal.fire({
        title,
        text,
        icon,
        showCancelButton: true,
        confirmButtonText,
        cancelButtonText,
        confirmButtonColor: confirmColor,
        cancelButtonColor: '#6b7280',
        reverseButtons: true,
    });

    return result.isConfirmed;
}

export default Swal;
