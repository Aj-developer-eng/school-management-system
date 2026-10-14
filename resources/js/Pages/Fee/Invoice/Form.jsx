
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Card from '@/Components/Ui/Card';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import SearchableMultiSelect from '@/Components/Ui/SearchableMultiSelect';
import SearchableSelect from '@/Components/Ui/SearchableSelect';
import TextInput from '@/Components/TextInput';
import { useAuth } from '@/utils/authorization';
import { Head, useForm } from '@inertiajs/react';

const CONCESSION_TYPES = [
    'scholarship',
    'sibling_discount',
    'staff_child',
    'financial_aid',
];

export default function Form({ students, feeStructures, invoice }) {
    const isEdit = Boolean(invoice);
    const { can } = useAuth();

    const toDateInput = (value) => {
        if (!value) return '';
        return String(value).split('T')[0];
    };

    const { data, setData, transform, post, put, processing, errors } = useForm(
        isEdit
            ? {
                  total_amount: Number(invoice.total_amount),
                  concession_amount: Number(invoice.concession_amount),
                  paid_amount: Number(invoice.paid_amount),
                  issue_date: toDateInput(invoice.issue_date),
                  due_date: toDateInput(invoice.due_date),
              }
            : {
                  student_id: '',
                  fee_structure_ids: [],
                  issue_date: new Date().toISOString().split('T')[0],
                  due_date: '',
                  concession: {
                      concession_type: 'scholarship',
                      percentage: '',
                      flat_amount: '',
                      reason: '',
                      is_active: true,
                  },
              },
    );

    const [includeConcession, setIncludeConcession] = useState(false);
    const [discountMode, setDiscountMode] = useState('percentage');

    // Resolve all selected fee structures from the selected IDs.
    const selectedStructures = (data.fee_structure_ids ?? [])
        .map((id) =>
            (feeStructures ?? []).find(
                (structure) => String(structure.id) === String(id),
            ),
        )
        .filter(Boolean);

    // Calculate the total of the selected fee structures.
    const structureAmount = selectedStructures.reduce(
        (sum, structure) => sum + Number(structure.amount || 0),
        0,
    );

    const enteredPercentage = Number(data.concession?.percentage) || 0;
    const enteredFlatAmount = Number(data.concession?.flat_amount) || 0;

    const concessionPreview = Math.min(
        discountMode === 'percentage'
            ? (structureAmount * enteredPercentage) / 100
            : enteredFlatAmount,
        structureAmount,
    );

    const payablePreview = Math.max(
        structureAmount - concessionPreview,
        0,
    );

    const concessionTypeLabel = (
        data.concession?.concession_type ?? 'scholarship'
    )
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());

    const submit = (event) => {
        event.preventDefault();

        if (isEdit) {
            put(route('fee-invoices.update', invoice.id));
            return;
        }

        const { concession, ...invoiceData } = data;

        const payload = includeConcession
            ? {
                  ...invoiceData,
                  concession: {
                      ...concession,
                      percentage:
                          discountMode === 'percentage'
                              ? concession.percentage
                              : '',
                      flat_amount:
                          discountMode === 'flat'
                              ? concession.flat_amount
                              : '',
                  },
              }
            : invoiceData;

        // Inertia's useForm always submits its own `data`; extra keys passed
        // to post() are visit options, so `{ data: payload }` is ignored.
        // Shape the body with transform() instead — otherwise the
        // always-present, empty `concession` object reaches StoreRequest and
        // fails validation with "Either percentage or flat amount is required."
        transform(() => payload);

        post(route('fee-invoices.store'));
    };

    const balance = isEdit
        ? Number(data.total_amount) -
          Number(data.concession_amount) -
          Number(data.paid_amount)
        : null;

    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <AuthenticatedLayout
            title={isEdit ? 'Edit Invoice' : 'New Invoice'}
            breadcrumbs={[
                {
                    label: 'Fee Invoices',
                    href: route('fee-invoices.index'),
                },
                {
                    label: isEdit
                        ? `Edit ${invoice.invoice_number}`
                        : 'New',
                },
            ]}
        >
            <Head title={isEdit ? 'Edit Invoice' : 'New Invoice'} />

            <Card className="max-w-2xl">
                <form onSubmit={submit} className="space-y-6 p-6">
                    {isEdit ? (
                        <>
                            <div className="rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
                                <p className="font-medium text-gray-700 dark:text-gray-200">
                                    Invoice: {invoice.invoice_number}
                                </p>

                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Student: {invoice.student?.user?.name} ·{' '}
                                    {invoice.school_class?.name} ·{' '}
                                    {invoice.academic_session?.name}
                                </p>

                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Fee Structure:{' '}
                                    {invoice.fee_structure?.name ??
                                        invoice.fee_structures
                                            ?.map((s) => s.name)
                                            .join(', ') ??
                                        '—'}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <InputLabel
                                        htmlFor="total_amount"
                                        value="Total Amount"
                                    />
                                    <TextInput
                                        id="total_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.total_amount}
                                        onChange={(event) =>
                                            setData(
                                                'total_amount',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full"
                                    />
                                    <InputError
                                        message={errors.total_amount}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="concession_amount"
                                        value="Concession Amount"
                                    />
                                    <TextInput
                                        id="concession_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.concession_amount}
                                        onChange={(event) =>
                                            setData(
                                                'concession_amount',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full"
                                    />
                                    <InputError
                                        message={errors.concession_amount}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="paid_amount"
                                        value="Paid Amount"
                                    />
                                    <TextInput
                                        id="paid_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.paid_amount}
                                        onChange={(event) =>
                                            setData(
                                                'paid_amount',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-1 block w-full"
                                    />
                                    <InputError
                                        message={errors.paid_amount}
                                        className="mt-2"
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                                <p className="font-medium text-indigo-700 dark:text-indigo-300">
                                    Balance: Rs {formatAmount(balance)}
                                </p>
                                <p className="mt-1 text-gray-500 dark:text-gray-400">
                                    Balance = Total − Concession − Paid. Set
                                    to 0 when fully settled.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <InputLabel
                                    htmlFor="student_id"
                                    value="Student"
                                />
                                <SearchableSelect
                                    id="student_id"
                                    value={data.student_id}
                                    onChange={(value) =>
                                        setData('student_id', value)
                                    }
                                    options={students ?? []}
                                    placeholder="Search student by name or admission #…"
                                    emptyMessage="No students match your search"
                                />
                                <InputError
                                    message={errors.student_id}
                                    className="mt-2"
                                />
                            </div>

                            <div>
                                <InputLabel
                                    htmlFor="fee_structure_ids"
                                    value="Fee Structures"
                                />
                                <SearchableMultiSelect
                                    id="fee_structure_ids"
                                    values={data.fee_structure_ids}
                                    onChange={(values) =>
                                        setData('fee_structure_ids', values)
                                    }
                                    options={(feeStructures ?? []).map(
                                        (structure) => ({
                                            value: String(structure.id),
                                            label: `${
                                                structure.name
                                            } — ${
                                                structure.academic_session?.name ??
                                                ''
                                            } / ${
                                                structure.school_class?.name ??
                                                ''
                                            } (Rs ${Number(
                                                structure.amount,
                                            ).toLocaleString()})`,
                                            keywords: [
                                                structure.name,
                                                structure.academic_session?.name,
                                                structure.school_class?.name,
                                            ]
                                                .filter(Boolean)
                                                .join(' '),
                                        }),
                                    )}
                                    placeholder="Search and select one or more fee structures…"
                                    emptyMessage="No fee structures match your search"
                                />
                                <InputError
                                    message={errors.fee_structure_ids}
                                    className="mt-2"
                                />
                                <InputError
                                    message={errors['fee_structure_ids.0']}
                                    className="mt-2"
                                />
                            </div>

                            {selectedStructures.length > 0 && (
                                <div className="rounded-lg bg-indigo-50 p-4 text-sm dark:bg-indigo-500/10">
                                    <p className="font-medium text-indigo-700 dark:text-indigo-300">
                                        Invoice Summary
                                    </p>

                                    <ul className="mt-2 space-y-2">
                                        {selectedStructures.map((structure) => (
                                            <li
                                                key={structure.id}
                                                className="text-gray-600 dark:text-gray-400"
                                            >
                                                {structure.name} ·{' '}
                                                {structure.school_class?.name} ·{' '}
                                                {
                                                    structure.academic_session
                                                        ?.name
                                                }{' '}
                                                —{' '}
                                                <span className="font-semibold">
                                                    Rs{' '}
                                                    {Number(
                                                        structure.amount,
                                                    ).toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="mt-3 border-t border-indigo-200 pt-3 dark:border-indigo-500/30">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            Total:{' '}
                                            <span className="font-semibold">
                                                Rs{' '}
                                                {formatAmount(structureAmount)}
                                            </span>
                                        </p>

                                        {includeConcession && (
                                            <>
                                                <p className="mt-1 text-amber-600 dark:text-amber-400">
                                                    Concession (
                                                    {concessionTypeLabel}):{' '}
                                                    <span className="font-semibold">
                                                        - Rs{' '}
                                                        {formatAmount(
                                                            concessionPreview,
                                                        )}
                                                    </span>
                                                </p>

                                                <p className="mt-1 font-medium text-indigo-700 dark:text-indigo-300">
                                                    Payable: Rs{' '}
                                                    {formatAmount(payablePreview)}
                                                </p>
                                            </>
                                        )}
                                    </div>

                                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                        {selectedStructures.length > 1
                                            ? `All ${selectedStructures.length} selected fee structures will be combined into a single invoice.`
                                            : 'One invoice will be created.'}{' '}
                                        Any existing active student concessions
                                        may also be applied by the server.
                                    </p>
                                </div>
                            )}

                            {can('fee-concessions.create') && (
                                <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                                    <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                                        <input
                                            type="checkbox"
                                            checked={includeConcession}
                                            onChange={(event) =>
                                                setIncludeConcession(
                                                    event.target.checked,
                                                )
                                            }
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        Add fee concession
                                    </label>

                                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                        Optionally apply a scholarship, sibling
                                        discount, staff child, or financial aid
                                        concession to this invoice.
                                    </p>

                                    {includeConcession && (
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <InputLabel
                                                    htmlFor="concession_type"
                                                    value="Concession Type"
                                                />
                                                <select
                                                    id="concession_type"
                                                    value={
                                                        data.concession
                                                            .concession_type
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'concession.concession_type',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                                >
                                                    {CONCESSION_TYPES.map(
                                                        (type) => (
                                                            <option
                                                                key={type}
                                                                value={type}
                                                            >
                                                                {type
                                                                    .replace(
                                                                        /_/g,
                                                                        ' ',
                                                                    )
                                                                    .replace(
                                                                        /\b\w/g,
                                                                        (character) =>
                                                                            character.toUpperCase(),
                                                                    )}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <InputError
                                                    message={
                                                        errors[
                                                            'concession.concession_type'
                                                        ]
                                                    }
                                                    className="mt-2"
                                                />
                                            </div>

                                            <div>
                                                <InputLabel value="Discount Type" />
                                                <div className="mt-2 flex flex-wrap gap-4">
                                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <input
                                                            type="radio"
                                                            name="discount_mode"
                                                            checked={
                                                                discountMode ===
                                                                'percentage'
                                                            }
                                                            onChange={() =>
                                                                setDiscountMode(
                                                                    'percentage',
                                                                )
                                                            }
                                                            className="text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        Percentage (%)
                                                    </label>

                                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                        <input
                                                            type="radio"
                                                            name="discount_mode"
                                                            checked={
                                                                discountMode ===
                                                                'flat'
                                                            }
                                                            onChange={() =>
                                                                setDiscountMode(
                                                                    'flat',
                                                                )
                                                            }
                                                            className="text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        Flat Amount (Rs)
                                                    </label>
                                                </div>
                                            </div>

                                            {discountMode === 'percentage' ? (
                                                <div>
                                                    <InputLabel
                                                        htmlFor="concession_percentage"
                                                        value="Percentage (%)"
                                                    />
                                                    <TextInput
                                                        id="concession_percentage"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                        value={
                                                            data.concession
                                                                .percentage
                                                        }
                                                        onChange={(event) =>
                                                            setData(
                                                                'concession.percentage',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-1 block w-full"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                'concession.percentage'
                                                            ]
                                                        }
                                                        className="mt-2"
                                                    />
                                                </div>
                                            ) : (
                                                <div>
                                                    <InputLabel
                                                        htmlFor="concession_flat_amount"
                                                        value="Flat Amount (Rs)"
                                                    />
                                                    <TextInput
                                                        id="concession_flat_amount"
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={
                                                            data.concession
                                                                .flat_amount
                                                        }
                                                        onChange={(event) =>
                                                            setData(
                                                                'concession.flat_amount',
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        className="mt-1 block w-full"
                                                    />
                                                    <InputError
                                                        message={
                                                            errors[
                                                                'concession.flat_amount'
                                                            ]
                                                        }
                                                        className="mt-2"
                                                    />
                                                </div>
                                            )}

                                            <div>
                                                <InputLabel
                                                    htmlFor="concession_reason"
                                                    value="Reason"
                                                />
                                                <textarea
                                                    id="concession_reason"
                                                    value={
                                                        data.concession.reason
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'concession.reason',
                                                            event.target.value,
                                                        )
                                                    }
                                                    rows={2}
                                                    className="mt-1 block w-full rounded-md border-gray-300 bg-white text-sm text-gray-700 focus:border-indigo-500 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200"
                                                />
                                                <InputError
                                                    message={
                                                        errors[
                                                            'concession.reason'
                                                        ]
                                                    }
                                                    className="mt-2"
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        data.concession.is_active
                                                    }
                                                    onChange={(event) =>
                                                        setData(
                                                            'concession.is_active',
                                                            event.target.checked,
                                                        )
                                                    }
                                                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                                Active
                                            </label>

                                            <InputError
                                                message={errors.concession}
                                                className="mt-2"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                            <InputLabel
                                htmlFor="issue_date"
                                value="Issue Date"
                            />
                            <TextInput
                                id="issue_date"
                                type="date"
                                value={data.issue_date}
                                onChange={(event) =>
                                    setData('issue_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                            <InputError
                                message={errors.issue_date}
                                className="mt-2"
                            />
                        </div>

                        <div>
                            <InputLabel
                                htmlFor="due_date"
                                value="Due Date"
                            />
                            <TextInput
                                id="due_date"
                                type="date"
                                value={data.due_date}
                                onChange={(event) =>
                                    setData('due_date', event.target.value)
                                }
                                className="mt-1 block w-full"
                            />
                            <InputError
                                message={errors.due_date}
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <PrimaryButton
                            disabled={
                                processing ||
                                (!isEdit &&
                                    (!data.student_id ||
                                        selectedStructures.length === 0))
                            }
                        >
                            {isEdit
                                ? 'Update Invoice'
                                : 'Create Invoice'}
                        </PrimaryButton>
                    </div>
                </form>
            </Card>
        </AuthenticatedLayout>
    );
}
