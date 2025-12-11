#!/usr/bin/env python3
import os
import re
import glob

def fix_test_file(filepath):
    """Add emailVerified to tenant inserts that don't have it"""
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        original_content = content
        
        # Pattern to match tenant insert statements
        # Look for .insert(tenants).values({ ... })
        pattern = r'(\.insert\(tenants\)\.values\(\{[^}]+?)(\}\);)'
        
        def add_email_verified(match):
            insert_block = match.group(1)
            closing = match.group(2)
            
            # Check if emailVerified already exists
            if 'emailVerified' in insert_block:
                return match.group(0)  # Already has it, skip
            
            # Add emailVerified and emailVerifiedAt before closing
            # Remove trailing comma and whitespace if present
            insert_block = insert_block.rstrip().rstrip(',')
            
            # Add the new fields
            new_fields = ',\n      emailVerified: true,\n      emailVerifiedAt: new Date(),'
            return insert_block + new_fields + '\n    ' + closing
        
        # Apply the fix
        content = re.sub(pattern, add_email_verified, content, flags=re.DOTALL)
        
        # Only write if changed
        if content != original_content:
            with open(filepath, 'w') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

# Find all test files
test_files = glob.glob('/home/ubuntu/barbertime/server/**/*.test.ts', recursive=True)

fixed_count = 0
for filepath in test_files:
    if fix_test_file(filepath):
        print(f"✓ Fixed: {os.path.basename(filepath)}")
        fixed_count += 1
    else:
        print(f"  Skipped: {os.path.basename(filepath)}")

print(f"\nTotal files fixed: {fixed_count}/{len(test_files)}")
