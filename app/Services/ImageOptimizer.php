<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageOptimizer
{
    /**
     * Optimize an uploaded image to KB-sized output.
     * Resizes, converts to WebP, and iteratively lowers quality
     * until the file is under the target size (default 150KB).
     *
     * @param  int  $maxWidth   Max width in pixels (height auto-scales)
     * @param  int  $quality    Starting WebP quality (1-100)
     * @param  int  $targetKB   Target file size in KB — quality is reduced until met
     * @return string Path to the optimized temporary file
     */
    public static function optimize(
    UploadedFile $file,
    int $maxWidth = 600,
    int $quality = 60,
    int $targetKB = 150
): string {
    $manager = new ImageManager(new Driver());

    $image = $manager->decodePath($file->getRealPath());

    if ($image->width() > $maxWidth) {
        $image->scale(width: $maxWidth);
    }

    $tempPath = sys_get_temp_dir() . '/' . uniqid('optimized_') . '.webp';

    $currentQuality = $quality;

    while ($currentQuality >= 10) {
        //$image->toWebp(quality: $currentQuality)->save($tempPath);
        $image->encodeUsingFileExtension('webp', quality: $currentQuality)->save($tempPath);
        $fileSizeKB = (int) round(filesize($tempPath) / 1024);

        if ($fileSizeKB <= $targetKB) {
            break;
        }

        $currentQuality -= 10;
    }

    return $tempPath;
}
}
