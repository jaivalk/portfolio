import re

with open('D:/Antigravity/jaival/resume/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print_css = """    @media print {
      html, body {
        background-color: #ffffff;
        padding: 0 !important;
        margin: 0 !important;
        width: 100%;
        height: 100%;
      }
      .resume-wrapper {
        transform: none !important;
        width: 100% !important;
        height: 100% !important;
        display: block !important;
      }
      .a4-paper {
        width: 100% !important;
        height: 100% !important;
        box-shadow: none !important;
        padding: 10mm 12mm !important;
        margin: 0 !important;
      }
      .no-print {
        display: none !important;
      }
      @page {
        size: A4;
        margin: 0;
      }
    }"""

# Replace the old @media print block
content = re.sub(r'@media print\s*\{[^}]*\}', print_css, content, flags=re.MULTILINE|re.DOTALL)
# The previous regex wouldn't work if there are nested braces in @media print (like .a4-paper { ... }).
# Let's replace manually.
