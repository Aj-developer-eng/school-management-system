<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SchoolSetting extends Model implements HasMedia
{
    use HasAuditFields;
    use InteractsWithMedia;

    public const LOGO_COLLECTION = 'logo';
    public const CACHE_KEY = 'school_settings';

    protected $fillable = [
        'school_name',
        'school_prefix',
        'registration_number',
        'affiliation',
        'email',
        'phone',
        'secondary_phone',
        'address',
        'city',
        'postal_code',
        'country',
        'footer_text',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::LOGO_COLLECTION)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(128)
            ->height(128)
            ->sharpen(10)
            ->nonQueued();
    }

    public function logoUrl(): ?string
    {
        $media = $this->getFirstMedia(self::LOGO_COLLECTION);

        return $media?->getUrl('thumb');
    }
}
