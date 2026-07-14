import glob
import re
import os

front_files = glob.glob('fe/src/**/*.*', recursive=True)
back_files = glob.glob('be/src/**/*.js', recursive=True)
front_urls = set()
back_paths = set()
api_regex = re.compile(r"['\"]http://localhost:5000(/api[^'\"`\s]*)['\"]")
relative_api_regex = re.compile(r"['\"](/api/[^'\"`\s]*)['\"]")
for file in front_files:
    if not file.endswith(('.js', '.jsx', '.ts', '.tsx')):
        continue
    with open(file, 'r', encoding='utf8', errors='ignore') as f:
        content = f.read()
    for m in api_regex.finditer(content):
        front_urls.add(m.group(1))
    for m in relative_api_regex.finditer(content):
        front_urls.add(m.group(1))
api_prefix = re.compile(r"app\.(?:use|get|post|put|delete|patch)\(['\"](/api[^'\"]*)['\"]")
for file in back_files:
    with open(file, 'r', encoding='utf8', errors='ignore') as f:
        content = f.read()
    for m in api_prefix.finditer(content):
        back_paths.add(m.group(1))

print('FRONT URLS', len(front_urls))
for url in sorted(front_urls):
    print(url)
print('---')
print('BACK PATHS', len(back_paths))
for path in sorted(back_paths):
    print(path)
