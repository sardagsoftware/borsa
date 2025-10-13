/**
 * Story Header Component
 * Displays game title, tagline, and version
 *
 * A11y: Semantic HTML with proper heading hierarchy
 */

export default function StoryHeader() {
  return (
    <header className="text-center space-y-4 pb-8 border-b border-gray-200 dark:border-gray-700">
      <div className="inline-block px-4 py-1 bg-lydian-gold/10 rounded-full">
        <span className="text-sm font-medium text-lydian-gold">Echo of Sardis</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
        Story Bible v1.0
      </h1>

      <p className="text-xl text-gray-600 dark:text-gray-400 italic">
        "Bazı taşlar yalnız ışığı değil, hatırayı da yutar."
      </p>

      <p className="text-sm text-gray-500 dark:text-gray-500">
        Some stones swallow not just light, but memory itself.
      </p>

      <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 pt-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Genre:</span>
          <span>Archaeological Adventure, Mystery, Sci-Fi</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Setting:</span>
          <span>Modern Sardis, Turkey (2040s)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">Duration:</span>
          <span>~32 hours</span>
        </div>
      </div>
    </header>
  );
}
