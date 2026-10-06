import { Fragment } from 'react';

export default function DataTable({ columns, rows, groups, emptyMessage = 'No records found.' }) {
    const hasRows = groups?.length
        ? groups.some((group) => group.rows?.length > 0)
        : Boolean(rows?.data?.length);

    if (!hasRows) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
            </div>
        );
    }

    const renderRow = (row, rowIndex) => (
        <tr
            key={row.id ?? rowIndex}
            className="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/50"
        >
            {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 whitespace-nowrap align-top">
                    {column.render ? column.render(row) : row[column.key]}
                </td>
            ))}
        </tr>
    );

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
                <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-4 py-3 whitespace-nowrap"
                                style={{ width: column.width }}
                            >
                                {column.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {groups?.length
                        ? groups.map((group) => (
                              <Fragment key={group.key}>
                                  <tr className="bg-gray-100 dark:bg-gray-700/40">
                                      <td
                                          colSpan={columns.length}
                                          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
                                      >
                                          {group.label}
                                      </td>
                                  </tr>
                                  {group.rows.map((row, rowIndex) => renderRow(row, rowIndex))}
                              </Fragment>
                          ))
                        : rows.data.map((row, rowIndex) => renderRow(row, rowIndex))}
                </tbody>
            </table>
        </div>
    );
}
