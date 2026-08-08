<?php

namespace App\Enums;

enum FeeTypeEnum: string
{
    case Admission = 'admission';
    case Monthly = 'monthly';
    case Exam = 'exam';
    case Transport = 'transport';
    case Miscellaneous = 'miscellaneous';

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
            self::Admission => 'Admission Fee',
            self::Monthly => 'Monthly Fee',
            self::Exam => 'Examination Fee',
            self::Transport => 'Transport Fee',
            self::Miscellaneous => 'Miscellaneous',
        };
    }
}
