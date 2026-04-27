import re
import os

def extract():
    file_path = 'index.html'
    
    # 1. التأكد من وجود الملف الأصلي
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found!")
        return

    # 2. إنشاء المجلدات إذا لم تكن موجودة
    os.makedirs('assets/css', exist_ok=True)
    os.makedirs('assets/js', exist_ok=True)

    with open(file_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 3. استخراج الـ CSS
    style_blocks = []
    def style_repl(match):
        style_blocks.append(match.group(1).strip())
        return ''
    
    html = re.sub(r'<style[^>]*>(.*?)</style>', style_repl, html, flags=re.DOTALL)
    
    if style_blocks:
        with open('assets/css/style.css', 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(style_blocks))
        
    # 4. استخراج الـ JS
    script_blocks = []
    def script_repl(match):
        attrs = match.group(1)
        content = match.group(2)
        if 'src=' not in attrs and content.strip():
            script_blocks.append(content.strip())
            return ''
        return match.group(0)
        
    html = re.sub(r'<script([^>]*)>(.*?)</script>', script_repl, html, flags=re.DOTALL)
    
    if script_blocks:
        with open('assets/js/main.js', 'w', encoding='utf-8') as f:
            f.write('\n\n'.join(script_blocks))
        
    # 5. تحديث الروابط (مع فحص لمنع التكرار)
    css_link = '    <link rel="stylesheet" href="assets/css/style.css">'
    js_script = '    <script src="assets/js/main.js"></script>'

    if 'assets/css/style.css' not in html:
        html = html.replace('</head>', f'{css_link}\n</head>')
    
    if 'assets/js/main.js' not in html:
        html = html.replace('</body>', f'{js_script}\n</body>')
    
    # 6. تنظيف الفراغات الزائدة الناتجة عن الحذف
    html = re.sub(r'\n\s*\n', '\n', html)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(html)
        
    print(f"Done! Extracted {len(style_blocks)} CSS blocks and {len(script_blocks)} JS blocks.")

if __name__ == '__main__':
    extract()