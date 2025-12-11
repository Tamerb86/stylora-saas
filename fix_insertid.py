#!/usr/bin/env python3
"""
Fix all insertId usages in timeclock tests by replacing with SELECT queries
"""
import re

def fix_timeclock_fixes():
    """Fix timeclock.fixes.test.ts"""
    filepath = '/home/ubuntu/barbertime/server/__tests__/timeclock.fixes.test.ts'
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix 1: Line 108-112 - Shift Length Validation test
    content = re.sub(
        r'(const insertResult = await dbInstance\.execute\(\s*sql`INSERT INTO timesheets \(tenantId, employeeId, clockIn, workDate\) \s*VALUES \(\$\{testTenantId\}, \$\{testEmployeeId\}, \$\{twoHoursAgo\.toISOString\(\)\.slice\(0, 19\)\.replace\(\'T\', \' \'\)\}, \$\{workDate\}\)`\s*\);\s*const timesheetId = \(insertResult as any\)\.insertId;)',
        r'\1\n      \n      // Retrieve the timesheet ID\n      const [tsRows] = await dbInstance.execute(\n        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`\n      );\n      const timesheetId = (tsRows as any[])[0].id;',
        content,
        flags=re.DOTALL
    )
    
    # Fix 2: Line 135-144 - Long shifts test
    content = re.sub(
        r'(const insertResult = await dbInstance\.execute\(\s*sql`INSERT INTO timesheets \(tenantId, employeeId, clockIn, workDate\) \s*VALUES \(\$\{testTenantId\}, \$\{testEmployeeId\}, \$\{eighteenHoursAgo\.toISOString\(\)\.slice\(0, 19\)\.replace\(\'T\', \' \'\)\}, \$\{workDate\}\)`\s*\);\s*const timesheetId = \(insertResult as any\)\.insertId;)',
        r'await dbInstance.execute(\n        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) \n            VALUES (${testTenantId}, ${testEmployeeId}, ${eighteenHoursAgo.toISOString().slice(0, 19).replace(\'T\', \' \')}, ${workDate})`\n      );\n      \n      // Retrieve the timesheet ID\n      const [tsRows2] = await dbInstance.execute(\n        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`\n      );\n      const timesheetId = (tsRows2 as any[])[0].id;',
        content,
        flags=re.DOTALL
    )
    
    # Fix 3: Line 183-191 - Time Calculation Accuracy test
    content = re.sub(
        r'(const insertResult = await dbInstance\.execute\(\s*sql`INSERT INTO timesheets \(tenantId, employeeId, clockIn, workDate\) \s*VALUES \(\$\{testTenantId\}, \$\{testEmployeeId\}, \$\{twoPointFiveHoursAgo\.toISOString\(\)\.slice\(0, 19\)\.replace\(\'T\', \' \'\)\}, \$\{workDate\}\)`\s*\);\s*const timesheetId = \(insertResult as any\)\.insertId;)',
        r'await dbInstance.execute(\n        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) \n            VALUES (${testTenantId}, ${testEmployeeId}, ${twoPointFiveHoursAgo.toISOString().slice(0, 19).replace(\'T\', \' \')}, ${workDate})`\n      );\n      \n      // Retrieve the timesheet ID\n      const [tsRows3] = await dbInstance.execute(\n        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`\n      );\n      const timesheetId = (tsRows3 as any[])[0].id;',
        content,
        flags=re.DOTALL
    )
    
    # Fix 4: Line 212-216 - Very short shifts test
    content = re.sub(
        r'(const insertResult = await dbInstance\.execute\(\s*sql`INSERT INTO timesheets \(tenantId, employeeId, clockIn, workDate\) \s*VALUES \(\$\{testTenantId\}, \$\{testEmployeeId\}, NOW\(\), \$\{workDate\}\)`\s*\);\s*const timesheetId = \(insertResult as any\)\.insertId;)',
        r'await dbInstance.execute(\n        sql`INSERT INTO timesheets (tenantId, employeeId, clockIn, workDate) \n            VALUES (${testTenantId}, ${testEmployeeId}, NOW(), ${workDate})`\n      );\n      \n      // Retrieve the timesheet ID\n      const [tsRows4] = await dbInstance.execute(\n        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId} AND workDate = ${workDate} ORDER BY clockIn DESC LIMIT 1`\n      );\n      const timesheetId = (tsRows4 as any[])[0].id;',
        content,
        flags=re.DOTALL
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("✓ Fixed timeclock.fixes.test.ts")

def fix_timeclock_comprehensive():
    """Fix timeclock.comprehensive.test.ts"""
    filepath = '/home/ubuntu/barbertime/server/__tests__/timeclock.comprehensive.test.ts'
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Replace all insertId patterns with SELECT queries
    # This is a simplified approach - manually fix complex cases
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("✓ Checked timeclock.comprehensive.test.ts (manual fixes needed)")

def fix_timeclock_admin():
    """Fix timeclock.admin.test.ts"""
    filepath = '/home/ubuntu/barbertime/server/__tests__/timeclock.admin.test.ts'
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Fix the long shift test around line 245
    content = re.sub(
        r'(const longShiftId = \(result as any\)\.insertId;)',
        r'// Retrieve the timesheet ID\n      const [longShiftRows] = await dbInstance.execute(\n        sql`SELECT id FROM timesheets WHERE tenantId = ${testTenantId} AND employeeId = ${testEmployeeId1} ORDER BY clockIn DESC LIMIT 1`\n      );\n      const longShiftId = (longShiftRows as any[])[0].id;',
        content
    )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print("✓ Fixed timeclock.admin.test.ts")

if __name__ == '__main__':
    fix_timeclock_fixes()
    fix_timeclock_comprehensive()
    fix_timeclock_admin()
    print("\nDone!")
