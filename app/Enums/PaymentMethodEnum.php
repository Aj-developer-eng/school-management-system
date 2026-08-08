<?php

namespace App\Enums;

enum PaymentMethodEnum: string
{
    case Cash = 'cash';
    case Cheque = 'cheque';
    case BankTransfer = 'bank_transfer';
    case Card = 'card';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Cash',
            self::Cheque => 'Cheque',
            self::BankTransfer => 'Bank Transfer',
            self::Card => 'Card',
            self::Other => 'Other',
        };
    }
}
