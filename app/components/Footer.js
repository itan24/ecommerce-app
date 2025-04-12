'use client';
export default function Footer() {
  const handleBack = () => {
    window.history.back();
  };

  return (
    <footer className="bg-white dark:bg-gray-800 shadow-md p-4 mt-auto">
      <div className="container mx-auto flex justify-between items-center">
        <p className="text-gray-600 dark:text-gray-400">© 2025 E-Commerce. All rights reserved.</p>
        <button
          onClick={handleBack}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back
        </button>
      </div>
    </footer>
  );
}