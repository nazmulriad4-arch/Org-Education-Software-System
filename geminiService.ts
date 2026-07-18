@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Caveat:wght@400;700&family=Kalam:wght@400;700&family=Architects+Daughter&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-handwriting: "Kalam", "Caveat", "Architects Daughter", cursive;
  --color-brand-blue: #002d5b;
  --color-sidebar-gray: #f1f3f5;
}

@layer base {
  body {
    @apply font-sans antialiased text-gray-900 bg-white;
  }
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
