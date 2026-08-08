<?php

namespace App\Enums;

enum ConcessionTypeEnum: string
{
    case Scholarship = 'scholarship';
    case SiblingDiscount = 'sibling_discount';
    case StaffChild = 'staff_child';
    case FinancialAid = 'financial_aid';

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
            self::Scholarship => 'Scholarship',
            self::SiblingDiscount => 'Sibling Discount',
            self::StaffChild => 'Staff Child',
            self::FinancialAid => 'Financial Aid',
        };
    }
}
