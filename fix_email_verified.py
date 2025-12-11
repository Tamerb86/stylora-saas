#!/usr/bin/env python3
"""
Script to add emailVerified: true and emailVerifiedAt: new Date() 
to all tenant insert statements in test files
"""
import os
import re
import glob

def fix_test_file(filepath):
    """Add emailVerified to tenant inserts that don't have it"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # Pattern 1: Match .insert(tenants).values({ ... })
        # This handles multi-line inserts with proper formatting
        def add_email_verified_to_insert(match):
            nonlocal modified
            full_match = match.group(0)
            
            # Skip if already has emailVerified
            if 'emailVerified' in full_match:
                return full_match
            
            # Find the closing brace before });
            # Insert emailVerified fields before the last }
            result = re.sub(
                r'(\s*)(}\);)$',
                r',\n\1  emailVerified: true,\n\1  emailVerifiedAt: new Date(),\n\1\2',
                full_match,
                flags=re.MULTILINE
            )
            
            if result != full_match:
                modified = True
            return result
        
        # Match .insert(tenants).values({ ... }); with proper multi-line support
        pattern = r'\.insert\(tenants\)\.values\(\{[^}]*\}\);'
        content = re.sub(pattern, add_email_verified_to_insert, content, flags=re.DOTALL)
        
        # Only write if changed
        if modified and content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

# Find all test files
test_files = glob.glob('/home/ubuntu/barbertime/server/**/*.test.ts', recursive=True)

print(f"Found {len(test_files)} test files\n")

fixed_count = 0
for filepath in sorted(test_files):
    basename = os.path.basename(filepath)
    if fix_test_file(filepath):
        print(f"✓ Fixed: {basename}")
        fixed_count += 1

print(f"\n{'='*60}")
print(f"Total files modified: {fixed_count}/{len(test_files)}")
print(f"{'='*60}")
