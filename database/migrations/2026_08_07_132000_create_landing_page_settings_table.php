<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_page_settings', function (Blueprint $table): void {
            $table->id();

            // Hero / Banner
            $table->string('hero_badge_text')->nullable();
            $table->string('hero_title')->nullable();
            $table->string('hero_title_highlight')->nullable();
            $table->text('hero_subtitle')->nullable();
            $table->string('hero_button_text')->nullable();
            $table->string('hero_button_link')->nullable();
            $table->string('hero_secondary_button_text')->nullable();
            $table->string('hero_secondary_button_link')->nullable();
            $table->string('banner_image_url')->nullable();

            // About
            $table->string('about_label')->nullable();
            $table->string('about_title')->nullable();
            $table->text('about_description')->nullable();
            $table->json('about_features')->nullable();

            // Values
            $table->json('values')->nullable();

            // Teachers section
            $table->string('teachers_label')->nullable();
            $table->string('teachers_title')->nullable();
            $table->string('teachers_subtitle')->nullable();
            $table->string('founder_name')->nullable();
            $table->string('founder_qualification')->nullable();
            $table->text('founder_bio')->nullable();

            // Admissions CTA
            $table->string('admissions_title')->nullable();
            $table->text('admissions_description')->nullable();
            $table->string('admissions_button_text')->nullable();
            $table->string('admissions_button_link')->nullable();
            $table->string('admissions_secondary_button_text')->nullable();
            $table->string('admissions_secondary_button_link')->nullable();

            // Footer
            $table->text('footer_description')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_page_settings');
    }
};
