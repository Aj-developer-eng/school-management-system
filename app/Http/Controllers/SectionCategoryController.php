<?php

namespace App\Http\Controllers;

use App\Models\SectionCategory;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SectionCategoryController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(SectionCategory::class, 'section_category');
    }

    /**
     * JSON list of categories used to populate the dropdown on the section form.
     */
    public function index(): JsonResponse
    {
        $categories = SectionCategory::query()
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'description', 'is_active']);

        return response()->json($categories);
    }

    /**
     * Create a category inline from the section form ("+" next to the dropdown).
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:section_categories,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        $category = SectionCategory::create([
            ...$data,
            'is_active' => true,
        ]);

        ActivityLogService::created('Section Categories', $category, "Created section category: {$category->name}");

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'description' => $category->description,
            'is_active' => $category->is_active,
        ], 201);
    }

    public function edit(SectionCategory $section_category): JsonResponse
    {
        return response()->json($section_category);
    }

    public function update(Request $request, SectionCategory $section_category): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:50', 'unique:section_categories,name,'.$section_category->id],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $section_category->update([
            ...$data,
            'is_active' => $request->boolean('is_active'),
        ]);

        return redirect()->route('sections.index')
            ->with('success', 'Section category updated successfully.');
    }

    public function destroy(Request $request, SectionCategory $section_category): JsonResponse|RedirectResponse
    {
        // Sections keep working without a category, so null the reference instead of
        // refusing the delete.
        $inUse = $section_category->sections()->count();

        $section_category->sections()->update(['section_category_id' => null]);
        $section_category->delete();

        // Inline deletes from the section form go through axios, which expects JSON.
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Category deleted successfully.',
                'released_sections' => $inUse,
            ]);
        }

        return redirect()->route('sections.index')
            ->with('success', 'Section category deleted successfully.');
    }
}