import re

with open(r'client\src\features\auth\pages\login-page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'import \{ AuthDivider \} from \"@/features/auth/components/auth-divider\"\n?', '', content)
content = re.sub(r'import \{ OauthProviderButtons \} from \"@/features/auth/components/oauth-provider-buttons\"\n?', '', content)
content = re.sub(r'\s*<AuthDivider label=\{t\(\"login\.or_continue_with\"\)\} />', '', content)
content = re.sub(r'\s*<OauthProviderButtons />', '', content)

with open(r'client\src\features\auth\pages\login-page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
