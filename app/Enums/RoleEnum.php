<?php

namespace App\Enums;

enum RoleEnum: string
{
    case SuperAdmin = 'Super Admin';
    case Principal = 'Principal';
    case VicePrincipal = 'Vice Principal';
    case Teacher = 'Teacher';
    case Accountant = 'Accountant';
    case Receptionist = 'Receptionist';
    case Student = 'Student';
    case Parent = 'Parent';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Roles that represent school staff (non Student/Parent).
     *
     * @return list<string>
     */
    public static function staffRoles(): array
    {
        return [
            self::SuperAdmin->value,
            self::Principal->value,
            self::VicePrincipal->value,
            self::Teacher->value,
            self::Accountant->value,
            self::Receptionist->value,
        ];
    }
}
