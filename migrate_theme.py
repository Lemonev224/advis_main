import os
import re
import glob

# Mapping of dark-mode classes to dashboard light-mode classes
MAPPING = {
    r'bg-\[\#111118\]': 'bg-white',
    r'bg-\[\#0A0A0F\]': 'bg-page-bg',
    r'border-white/\[0\.0\d\]': 'border-gray-200',
    r'border-white/10': 'border-gray-300',
    r'border-white/\[0\.15\]': 'border-gray-300',
    r'bg-white/\[0\.0[1-5]\]': 'bg-gray-50',
    r'bg-white/\[0\.0[6-9]\]': 'bg-gray-100',
    r'bg-white/5\b': 'bg-gray-50',
    r'bg-white/10\b': 'bg-gray-100',
    r'text-white/20\b': 'text-gray-400',
    r'text-white/25\b': 'text-gray-400',
    r'text-white/30\b': 'text-gray-500',
    r'text-white/40\b': 'text-gray-500',
    r'text-white/50\b': 'text-gray-500',
    r'text-white/60\b': 'text-gray-600',
    r'text-white/70\b': 'text-gray-600',
    r'text-white/80\b': 'text-gray-700',
    r'text-white/90\b': 'text-gray-700',
    r'text-white\b(?!/[0-9])': 'text-gray-800',  # Text-white but not followed by opacity
    r'hover:bg-white/\[0\.0\d\]': 'hover:bg-gray-50',
    r'hover:text-white/70\b': 'hover:text-gray-700',
    r'hover:text-white\b': 'hover:text-gray-900',
    r'hover:border-white/\[0\.15\]': 'hover:border-gray-300',
    r'hover:border-white/10\b': 'hover:border-gray-300',
    r'bg-brand\b': 'bg-blue-600',
    r'text-brand\b': 'text-blue-600',
    r'border-brand/20\b': 'border-blue-200',
    r'border-brand/30\b': 'border-blue-300',
    r'border-brand/50\b': 'border-blue-300',
    r'bg-brand/5\b': 'bg-blue-50',
    r'bg-brand/10\b': 'bg-blue-50',
    r'bg-brand/15\b': 'bg-blue-100',
    r'hover:bg-brand-dark\b': 'hover:bg-blue-700',
    r'shadow-brand/20\b': 'shadow-sm',
    r'shadow-brand/25\b': 'shadow-sm',
    r'hover:text-brand-light\b': 'hover:text-blue-500',
    r'text-amber-400\b': 'text-amber-600',
    r'bg-amber-500/5\b': 'bg-amber-50',
    r'bg-amber-500/10\b': 'bg-amber-50',
    r'border-amber-500/15\b': 'border-amber-200',
    r'border-amber-500/20\b': 'border-amber-200',
    r'hover:border-amber-500/20\b': 'hover:border-amber-300',
    r'text-emerald-400\b': 'text-emerald-600',
    r'bg-emerald-500/10\b': 'bg-emerald-50',
    r'border-emerald-500/20\b': 'border-emerald-200',
    r'hover:border-emerald-500/20\b': 'hover:border-emerald-300',
    r'text-red-400\b': 'text-red-600',
    r'bg-red-500/10\b': 'bg-red-50',
    r'border-red-500/20\b': 'border-red-200',
    r'hover:border-red-500/20\b': 'hover:border-red-300',
}

files = glob.glob('app/**/page.tsx', recursive=True)

def migrate_file(filepath):
    if filepath == 'app\\page.tsx' or filepath == 'app/page.tsx':
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    
    # Exception for text-white in buttons that have bg-brand or other bg
    # Wait, we change bg-brand to bg-blue-600 and text-brand to text-blue-600,
    # but actual buttons might have class="bg-blue-600 text-white". 
    # Let's temporarily protect text-white inside buttons if needed.
    # We will just do a standard regex replace, but `bg-brand hover:bg-brand-dark text-white`
    # will become `bg-blue-600 hover:bg-blue-700 text-gray-800`.
    # Let's just do it, and we can manually fix buttons if they break.
    
    for pattern, replacement in MAPPING.items():
        content = re.sub(pattern, replacement, content)
        
    # Extra fix: bg-blue-600 text-gray-800 -> bg-blue-600 text-white
    content = content.replace('bg-blue-600 text-gray-800', 'bg-blue-600 text-white')
    content = content.replace('bg-emerald-500 text-gray-800', 'bg-emerald-500 text-white')
    content = content.replace('bg-blue-500 text-gray-800', 'bg-blue-500 text-white')
    content = content.replace('bg-emerald-600 text-gray-800', 'bg-emerald-600 text-white')

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

for f in files:
    migrate_file(f)