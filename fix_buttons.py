import glob
import re

files = glob.glob('app/**/page.tsx', recursive=True)

def fix_buttons(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content

    # Fix instances where text-gray-800 is used alongside solid background colors
    # e.g., class="... text-gray-800 bg-blue-600 ..."
    
    # We will just replace `text-gray-800` with `text-white` when it is in the same class string as `bg-blue-500`, `bg-blue-600`, `bg-red-500`, `bg-emerald-500`.
    def replace_solid_button_text(match):
        classes = match.group(1)
        if any(c in classes for c in ['bg-blue-500', 'bg-blue-600', 'bg-red-500', 'bg-emerald-500', 'bg-red-600', 'bg-emerald-600']):
            classes = classes.replace('text-gray-800', 'text-white')
        return f'className="{classes}"'

    content = re.sub(r'className="([^"]+)"', replace_solid_button_text, content)
    
    # Also hover:bg-blue-600-dark -> hover:bg-blue-700
    content = content.replace('hover:bg-blue-600-dark', 'hover:bg-blue-700')
    
    # Also from settings: <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-lg font-bold text-gray-800 flex-shrink-0">
    def fix_gradient(match):
        classes = match.group(1)
        if 'bg-gradient-to-br' in classes and ('from-blue-500' in classes or member in classes): # Wait just generic
            classes = classes.replace('text-gray-800', 'text-white')
        return f'className="{classes}"'
    
    content = re.sub(r'className="([^"]+bg-gradient-to-br[^"]+)"', fix_gradient, content)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

for f in files:
    fix_buttons(f)