#!/usr/bin/env python3
"""
Fix all tenant insert statements to include emailVerified: true
"""
import re
import glob

def fix_tenant_insert(content):
    """Add emailVerified to tenant inserts that don't have it"""
    
    # Pattern to match .insert(tenants).values({ ... });
    # This captures the entire insert statement including nested braces
    pattern = r'(\.insert\(tenants\)\.values\(\{)((?:[^{}]|\{[^{}]*\})*?)(\}\);)'
    
    def add_email_verified(match):
        prefix = match.group(1)
        body = match.group(2)
        suffix = match.group(3)
        
        # Skip if already has emailVerified
        if 'emailVerified' in body:
            return match.group(0)
        
        # Remove trailing comma and whitespace from body
        body = body.rstrip().rstrip(',')
        
        # Add emailVerified fields
        new_body = body + ',\n      emailVerified: true,\n      emailVerifiedAt: new Date(),'
        
        return prefix + new_body + '\n    ' + suffix
    
    return re.sub(pattern, add_email_verified, content, flags=re.DOTALL)

# Get all test files
test_files = glob.glob('/home/ubuntu/barbertime/server/**/*.test.ts', recursive=True)

fixed_count = 0
error_count = 0

for filepath in sorted(test_files):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        fixed = fix_tenant_insert(original)
        
        if fixed != original:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed)
            print(f"✓ {filepath.split('/')[-1]}")
            fixed_count += 1
            
    except Exception as e:
        print(f"✗ {filepath.split('/')[-1]}: {e}")
        error_count += 1

print(f"\n{'='*60}")
print(f"Fixed: {fixed_count} files")
print(f"Errors: {error_count} files")
print(f"Total: {len(test_files)} files")
print(f"{'='*60}")
