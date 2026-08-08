<?php

namespace App\Models;

use App\Traits\HasAuditFields;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Teacher extends Model implements HasMedia
{
    use HasAuditFields;
    use HasFactory;
    use InteractsWithMedia;
    use SoftDeletes;

    public const PROFILE_IMAGE_COLLECTION = 'profile_image';

    protected $fillable = [
        'user_id',
        'employee_code',
        'qualification',
        'joining_date',
        'bio',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'joining_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TeacherSubjectAssignment::class);
    }

    protected static function booted(): void
    {
        // MediaLibrary only removes media files when a model is force-deleted,
        // so for a normal (soft) delete we must clean up the profile image
        // ourselves. Hard deletes are still handled by InteractsWithMedia.
        static::deleting(function (Teacher $teacher): void {
            if ($teacher->isForceDeleting()) {
                return;
            }

            $teacher->deleteAllMedia();
        });
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection(self::PROFILE_IMAGE_COLLECTION)
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(200)
            ->height(200)
            ->sharpen(10)
            ->nonQueued();
    }

    public function profileImageUrl(): ?string
    {
        $media = $this->getFirstMedia(self::PROFILE_IMAGE_COLLECTION);

        return $media?->getUrl('thumb');
    }
}
