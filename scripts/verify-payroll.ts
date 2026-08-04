/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification suite for the Cambodia GDT payroll engine.
 * Run with: npx tsx scripts/verify-payroll.ts
 */

import { computePayroll, computeTax, computePrepayAmount, getFamilyReliefKHR, roundUSD, roundKHR } from '../src/payrollEngine';
import { Employee } from '../src/types';

let passed = 0;
let failed = 0;

function check(label: string, actual: number, expected: number, tolerance = 0.001) {
  if (Math.abs(actual - expected) <= tolerance) {
    passed++;
    console.log(`  PASS  ${label}: ${actual}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}: expected ${expected}, got ${actual}`);
  }
}

function checkStr(label: string, actual: string, expected: string) {
  if (actual === expected) {
    passed++;
    console.log(`  PASS  ${label}: ${actual}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}: expected "${expected}", got "${actual}"`);
  }
}

const EXCHANGE_RATE = 4100;

function ftEmployee(overrides: Partial<Employee>): Employee {
  return {
    id: 1,
    staffId: 'T001',
    name: 'Test Staff',
    nat: 'Khmer',
    pos: 'Staff',
    dept: 'Operations',
    campus: 'Main',
    employmentType: 'Full-Time',
    doj: '2022-01-01',
    empDate: '2022-01-01',
    basic: 1000,
    hourlyRate: 0,
    presentHours: 0,
    absenceHours: 0,
    substituteHours: 0,
    prePayPct: 100,
    absence: 0,
    maternity: 0,
    ot: 0,
    caAdd: 0,
    caDed: 0,
    nssf: 0,
    seniority: 0,
    spouse: '0',
    kids: 0,
    allowance: 0,
    sdReturn: 0,
    provFund: 0,
    bankAcc: '',
    email: '',
    remarks: '',
    status: 'W',
    other: 0,
    adjustError: 0,
    workBook: 0,
    afterSchool: 0,
    scheduleHours: 0,
    group: '',
    savingAmt: 0,
    ...overrides
  };
}

console.log('=== 1. Tax bracket boundaries (strict > semantics) ===');
check('Base 1,500,000 (boundary) -> 0%', computeTax(1500000).taxKHR, 0);
checkStr('Base 1,500,000 -> 0%', computeTax(1500000).taxRate, '0%');
check('Base 1,500,001 -> 5%: round(1,500,001*0.05-75,000)', computeTax(1500001).taxKHR, roundKHR(1500001 * 0.05 - 75000));
checkStr('Base 1,500,001 -> 5%', computeTax(1500001).taxRate, '5%');
check('Base 2,000,000 (boundary) -> 5%: 100,000-75,000', computeTax(2000000).taxKHR, 25000);
checkStr('Base 2,000,000 -> 5%', computeTax(2000000).taxRate, '5%');
check('Base 2,000,001 -> 10%: round(200,000.1-175,000)', computeTax(2000001).taxKHR, roundKHR(2000001 * 0.10 - 175000));
checkStr('Base 2,000,001 -> 10%', computeTax(2000001).taxRate, '10%');
check('Base 8,500,000 (boundary) -> 10%: 850,000-175,000', computeTax(8500000).taxKHR, 675000);
checkStr('Base 8,500,000 -> 10%', computeTax(8500000).taxRate, '10%');
check('Base 8,500,001 -> 15%: round(1,275,000.15-600,000)', computeTax(8500001).taxKHR, roundKHR(8500001 * 0.15 - 600000));
checkStr('Base 8,500,001 -> 15%', computeTax(8500001).taxRate, '15%');
check('Base 12,500,000 (boundary) -> 15%: 1,875,000-600,000', computeTax(12500000).taxKHR, 1275000);
checkStr('Base 12,500,000 -> 15%', computeTax(12500000).taxRate, '15%');
check('Base 12,500,001 -> 20%: round(2,500,000.2-1,225,000)', computeTax(12500001).taxKHR, roundKHR(12500001 * 0.20 - 1225000));
checkStr('Base 12,500,001 -> 20%', computeTax(12500001).taxRate, '20%');

console.log('\n=== 2. Progressive credits == cumulative method equivalence ===');
function cumulativeTax(base: number): number {
  if (base <= 1500000) return 0;
  const bands = [
    [1500000, 2000000, 0.05],
    [2000000, 8500000, 0.10],
    [8500000, 12500000, 0.15],
    [12500000, Infinity, 0.20]
  ] as const;
  let tax = 0;
  for (const [low, high, rate] of bands) {
    tax += Math.max(0, Math.min(base, high) - low) * rate;
  }
  return tax;
}
const sampleBases = [0, 100, 1500000, 1500001, 1999999, 2000000, 2000001, 8000000, 8500000, 8500001, 12000000, 12500000, 12500001, 20000000, 99999999];
for (const base of sampleBases) {
  check(`Base ${base.toLocaleString()}: credit vs cumulative`, computeTax(base).taxKHR, Math.round(cumulativeTax(base)));
}

console.log('\n=== 3. Family relief ===');
check('No spouse, no kids', getFamilyReliefKHR('0', 0), 0);
check('Spouse=yes, 2 kids', getFamilyReliefKHR('1', 2), 450000);
check('Spouse=yes (word), 1 kid', getFamilyReliefKHR('yes', 1), 300000);
check('Spouse=Y, 3 kids', getFamilyReliefKHR('Y', 3), 600000);

console.log('\n=== 4. Full-Time Staff Payroll Run scenarios ===');
console.log('  Approved FT Gross formula: Pre. Pay + Amount + HRM/After School Program - Provident with NSSF (-)');
console.log('  (Absence, Maternity, OT, Cash Advance and Seniority/GEP are EXCLUDED from Gross Salary.)');

// Scenario: gross = 2000 (basic 2000). OT 150 and CA(-) 50 are NOT part of Gross.
{
  const p = computePayroll(ftEmployee({ basic: 2000, ot: 150, caDed: 50, spouse: '1', kids: 2 }), EXCHANGE_RATE);
  console.log('  Scenario 4.1: basic 2000 + OT 150 - CA(-) 50, spouse + 2 kids');
  check('Gross Salary (USD)', p.grossSalaryUSD, 2000);
  check('Salary to be Paid (KHR)', p.salaryPaidKHR, 2000 * 4100);
  check('Family relief', getFamilyReliefKHR('1', 2), 450000);
  check('Tax Base (KHR)', p.taxBaseKHR, 2000 * 4100 - 450000);
  checkStr('Tax Rate', p.taxRate, '10%');
  check('TOS (KHR)', p.taxKHR, roundKHR(7750000 * 0.10 - 175000));
  check('TOS (USD)', p.taxUSD, roundUSD(600000 / 4100));
  check('Total Salary After Tax (USD)', p.salaryAfterTaxUSD, roundUSD(2000 - 600000 / 4100));
  check('Bank (USD)', p.netBankUSD, roundUSD(2000 - 600000 / 4100));
}

// Scenario: full component test — absence, maternity, OT, CA+-, NSSF, seniority, work permit
// Only Pre.Pay(2500) - NSSF(75) = 2425 is Gross; the rest is excluded from Gross.
{
  const p = computePayroll(
    ftEmployee({ basic: 2500, absence: 100, maternity: 200, ot: 300, caAdd: 150, caDed: 50, nssf: 75, seniority: 120, sdReturn: 90, other: 60, spouse: '0', kids: 0 }),
    EXCHANGE_RATE
  );
  console.log('  Scenario 4.2: all FT components');
  check('Gross Salary (USD)', p.grossSalaryUSD, 2425);
  check('Salary to be Paid (KHR)', p.salaryPaidKHR, roundKHR(2425 * 4100));
  check('Tax Base (KHR)', p.taxBaseKHR, roundKHR(2425 * 4100));
  // Base 9,942,500 falls in the 15% bracket (8.5M < base <= 12.5M)
  checkStr('Tax Rate', p.taxRate, '15%');
  const expectedTaxKHR = roundKHR(2425 * 4100 * 0.15 - 600000);
  check('TOS (KHR)', p.taxKHR, expectedTaxKHR);
  const expectedTaxUSD = roundUSD(expectedTaxKHR / 4100);
  check('TOS (USD)', p.taxUSD, expectedTaxUSD);
  const expectedAfterTax = roundUSD(2425 - expectedTaxUSD);
  check('Total Salary After Tax (USD)', p.salaryAfterTaxUSD, expectedAfterTax);
  // Bank = AfterTax + other + sdReturn - seniority - caAdd
  check('Bank (USD)', p.netBankUSD, roundUSD(expectedAfterTax + 60 + 90 - 120 - 150));
  check('Gross for Summary (USD)', p.grossForSummary, roundUSD(2425 + 60 + 90));
}

// Scenario: user-reported Full-Time Gross example (previously produced 563.43)
{
  const p = computePayroll(ftEmployee({
    id: 10,
    basic: 309.60,
    hourlyRate: 1.29,
    scheduleHours: 12.5,
    afterSchool: 30,
    other: 210.92,
    nssf: 11.92
  }), EXCHANGE_RATE);
  console.log('  Scenario 4.2b: Full-Time user-reported Gross example');
  // Pre.Pay(309.60) + Amount(12.5*1.29=16.13) + HRM/After School(30*1.29=38.70)
  //   - Provident/NSSF(11.92) = 352.51
  // 'Other' (210.92) must NOT be included; before the fix this produced 563.43.
  check('Pre. Pay (USD)', p.prepayAmount, 309.60);
  check('Amount (USD) = Hrs x Rate', roundUSD(12.5 * 1.29), 16.13);
  check('HRM/After School (USD) = Hrs x Rate', roundUSD(30 * 1.29), 38.70);
  check('Full-Time Gross (spec example)', p.grossSalaryUSD, 352.51);
  check('Salary to be Paid (KHR)', p.salaryPaidKHR, roundKHR(352.51 * 4100));
  check('Gross for Summary (USD)', p.grossForSummary, roundUSD(352.51 + 210.92));
}

// Scenario: multiple Full-Time records — component values must never leak into Gross
{
  const cases: Array<{ name: string; o: Partial<Employee>; expectedGross: number; expectedBank?: number }> = [
    {
      name: 'Maternity + OT only (excluded from Gross)',
      o: { id: 21, basic: 1500, maternity: 400, ot: 100, caAdd: 200 },
      expectedGross: 1500,
      expectedBank: 1192.68
    },
    {
      name: 'Cash Advance both sides (net zero, excluded from Gross)',
      o: { id: 22, basic: 1200, caAdd: 300, caDed: 100 },
      expectedGross: 1200,
      expectedBank: 822.68
    },
    {
      name: 'Seniority + Other + Work Permit (excluded from Gross, in Bank/Summary)',
      o: { id: 23, basic: 800, seniority: 500, other: 100, sdReturn: 50 },
      expectedGross: 800,
      expectedBank: 412.68
    },
    {
      name: 'Amount + After School + NSSF (part of Gross)',
      o: { id: 24, basic: 500, hourlyRate: 4, scheduleHours: 20, afterSchool: 10, nssf: 12 },
      expectedGross: 608
    }
  ];
  for (const c of cases) {
    console.log(`  Scenario 4.2c: ${c.name}`);
    const p = computePayroll(ftEmployee(c.o), EXCHANGE_RATE);
    check('Gross Salary (USD)', p.grossSalaryUSD, c.expectedGross);
    check('Salary to be Paid (KHR)', p.salaryPaidKHR, roundKHR(c.expectedGross * 4100));
    check('Tax Base (KHR)', p.taxBaseKHR, Math.max(0, roundKHR(c.expectedGross * 4100)));
    if (c.expectedBank !== undefined) {
      check('Bank (USD)', p.netBankUSD, c.expectedBank);
    }
  }
  // Case 1 (Maternity/OT/CA): Gross = 1500; base 6,150,000 -> 10%; tax = 440,000; USD = 107.32
  //   afterTax = 1392.68; Bank = 1392.68 - caAdd(200) = 1192.68
  // Case 2 (CA +/-): Gross = 1200; base 4,920,000 -> 10%; tax = 317,000; USD = 77.32
  //   afterTax = 1122.68; Bank = 1122.68 - caAdd(300) = 822.68
  // Case 3 (Seniority/Other/SD): Gross = 800; base 3,280,000 -> 10%; tax = 153,000; USD = 37.32
  //   afterTax = 762.68; Bank = 762.68 + other(100) + sdReturn(50) - seniority(500) = 412.68
  // Case 4 (Amount/AfterSchool/NSSF): Gross = Pre.Pay(500) + Amount(80) + AfterSchool(40) - NSSF(12) = 608
}

// Scenario: zero salary
{
  const p = computePayroll(ftEmployee({ basic: 0, status: 'UN', spouse: '0', kids: 0 }), EXCHANGE_RATE);
  console.log('  Scenario 4.3: zero salary / unpaid leave');
  check('Gross Salary (USD)', p.grossSalaryUSD, 0);
  check('Salary to be Paid (KHR)', p.salaryPaidKHR, 0);
  check('Tax Base (KHR)', p.taxBaseKHR, 0);
  checkStr('Tax Rate', p.taxRate, '0%');
  check('TOS (KHR)', p.taxKHR, 0);
  check('TOS (USD)', p.taxUSD, 0);
  check('Total Salary After Tax (USD)', p.salaryAfterTaxUSD, 0);
  check('Bank (USD)', p.netBankUSD, 0);
}

// Scenario: low salary, no tax (but relief does not fully cover base)
{
  const p = computePayroll(ftEmployee({ basic: 300, spouse: '1', kids: 2 }), EXCHANGE_RATE);
  console.log('  Scenario 4.4: low salary, no tax (relief partially offsets base)');
  check('Tax Base (KHR)', p.taxBaseKHR, 300 * 4100 - 450000);
  checkStr('Tax Rate', p.taxRate, '0%');
  check('TOS (KHR)', p.taxKHR, 0);
  check('Bank (USD)', p.netBankUSD, 300);
}

// Scenario: relief fully covers base
{
  const p = computePayroll(ftEmployee({ basic: 100, spouse: '1', kids: 2 }), EXCHANGE_RATE);
  console.log('  Scenario 4.4b: relief fully covers salary');
  check('Tax Base (KHR)', p.taxBaseKHR, 0);
  checkStr('Tax Rate', p.taxRate, '0%');
  check('TOS (KHR)', p.taxKHR, 0);
  check('Bank (USD)', p.netBankUSD, 100);
}

// Scenario: maternity + OT with cash advance payout recovered at bank
{
  const p = computePayroll(ftEmployee({ basic: 1500, maternity: 400, ot: 100, caAdd: 200, spouse: '0', kids: 0 }), EXCHANGE_RATE);
  console.log('  Scenario 4.5: maternity + OT + cash advance');
  // Gross = Pre.Pay(1500) only; Maternity/OT/CA are excluded from Gross
  check('Gross Salary (USD)', p.grossSalaryUSD, 1500);
  // Base = 1500*4100 = 6,150,000 -> 10%
  checkStr('Tax Rate', p.taxRate, '10%');
  const expectedTax = roundKHR(6150000 * 0.10 - 175000);
  check('TOS (KHR)', p.taxKHR, expectedTax);
  // Bank = afterTax - caAdd(200)
  const afterTax = roundUSD(1500 - roundUSD(expectedTax / 4100));
  check('Bank (USD)', p.netBankUSD, roundUSD(afterTax - 200));
}

// Scenario: exchange rate consistency — KHR -> USD -> KHR round trip
{
  const rate = 4205;
  const p = computePayroll(ftEmployee({ basic: 2000 }), rate);
  console.log(`  Scenario 4.6: custom exchange rate ${rate}`);
  check('Salary to be Paid (KHR)', p.salaryPaidKHR, 2000 * rate);
  check('TOS (USD) = TOS (KHR) / rate', p.taxUSD, roundUSD(p.taxKHR / rate));
  check('Bank (USD)', p.netBankUSD, p.salaryAfterTaxUSD);
}

console.log('\n=== 5. Rounding consistency ===');
{
  const p = computePayroll(ftEmployee({ basic: 2500, absence: 100, maternity: 200, ot: 300, caAdd: 150, caDed: 50, nssf: 75, seniority: 120, sdReturn: 90, other: 60 }), EXCHANGE_RATE);
  check('grossSalaryUSD has max 2 decimals', p.grossSalaryUSD, Math.round(p.grossSalaryUSD * 100) / 100);
  check('salaryPaidKHR is whole riel', p.salaryPaidKHR, Math.round(p.salaryPaidKHR));
  check('taxKHR is whole riel', p.taxKHR, Math.round(p.taxKHR));
  check('taxUSD has max 2 decimals', p.taxUSD, Math.round(p.taxUSD * 100) / 100);
  check('salaryAfterTaxUSD has max 2 decimals', p.salaryAfterTaxUSD, Math.round(p.salaryAfterTaxUSD * 100) / 100);
  check('netBankUSD has max 2 decimals', p.netBankUSD, Math.round(p.netBankUSD * 100) / 100);
}

console.log('\n=== 6. Semi-Full-Time and Part-Time regression ===');
{
  const sft = computePayroll(ftEmployee({
    id: 2,
    employmentType: 'Semi-Full-Time',
    basic: 3500,
    hourlyRate: 10,
    scheduleHours: 20,
    afterSchool: 5,
    other: 50,
    adjustError: 30,
    workBook: 15,
    caAdd: 100,
    seniority: 80
  }), EXCHANGE_RATE);
  console.log('  Scenario 6.1: Semi-Full-Time');
  // Gross = Pre.Pay(3500) + Amount(20*10) − NSSF(0) + AfterSchool(5*10) = 3750
  check('Gross Salary (USD)', sft.grossSalaryUSD, 3750);
  check('Bank (USD)', sft.netBankUSD, roundUSD(sft.salaryAfterTaxUSD - 80 - 100 + 30 - 15));
  check('Gross for Summary (USD)', sft.grossForSummary, 3750);
  // Spec formula, term-by-term: Pre.Pay + Amount + HRM/After School − Provident/NSSF
  check('SFT Gross (spec formula)', sft.grossSalaryUSD, roundUSD(3500 + (20 * 10) - 0 + (5 * 10)));
  // Spec formula: AfterTax − Seniority − CA(+) + AdjustError − WorkBook
  check('SFT Bank (spec formula)', sft.netBankUSD, roundUSD(sft.salaryAfterTaxUSD - 80 - 100 + 30 - 15));
}
{
  const sft2 = computePayroll(ftEmployee({
    id: 4,
    employmentType: 'Semi-Full-Time',
    basic: 2500,
    hourlyRate: 8,
    scheduleHours: 15,
    afterSchool: 4,
    other: 30,
    maternity: 60,
    caAdd: 40,
    nssf: 25,
    seniority: 70,
    adjustError: 10,
    workBook: 12
  }), EXCHANGE_RATE);
  console.log('  Scenario 6.2: Semi-Full-Time, all components');
  // Spec formula: Pre.Pay(2500) + Amount(15*8) − NSSF(25) + AfterSchool(4*8)
  // = 2500 + 120 - 25 + 32 = 2627 (Other/Maternity/CA+/Seniority excluded from gross)
  check('SFT Gross (all components)', sft2.grossSalaryUSD, 2627);
  check('SFT Bank (spec formula)', sft2.netBankUSD, roundUSD(sft2.salaryAfterTaxUSD - 70 - 40 + 10 - 12));
  check('SFT Gross for Summary (USD)', sft2.grossForSummary, 2627);
}
{
  const sft3 = computePayroll(ftEmployee({
    id: 5,
    employmentType: 'Semi-Full-Time',
    basic: 309.60,
    hourlyRate: 1.29,
    scheduleHours: 12.5,
    afterSchool: 30,
    other: 210.92,
    nssf: 11.92
  }), EXCHANGE_RATE);
  console.log('  Scenario 6.4: Semi-Full-Time, user-reported Gross example');
  // Pre.Pay(309.60) + Amount(12.5*1.29=16.13) − NSSF(11.92) + AfterSchool(30*1.29=38.70)
  // = 309.60 + 16.13 - 11.92 + 38.70 = 352.51
  // 'Other' (210.92) must NOT be included; before the fix this produced 563.43.
  check('Pre. Pay (USD)', sft3.prepayAmount, 309.60);
  check('SFT Gross (spec example)', sft3.grossSalaryUSD, 352.51);
  check('SFT Gross for Summary (USD)', sft3.grossForSummary, 352.51);
}
{
  const pt = computePayroll(ftEmployee({
    id: 3,
    employmentType: 'Part-Time',
    basic: 0,
    hourlyRate: 15,
    presentHours: 40,
    absenceHours: 0,
    ot: 45,
    caAdd: 0,
    sdReturn: 20
  }), EXCHANGE_RATE);
  console.log('  Scenario 6.3: Part-Time');
  // Base pay = 40*15 = 600, gross = 600 + 45 = 645
  check('Gross Salary (USD)', pt.grossSalaryUSD, 645);
  check('Bank (USD)', pt.netBankUSD, roundUSD(pt.salaryAfterTaxUSD + 20));
}

console.log('\n=== 7. Seniority & Cash Advance net-zero treatment ===');
{
  const p = computePayroll(ftEmployee({ basic: 1000, seniority: 500, caAdd: 300, spouse: '0', kids: 0 }), EXCHANGE_RATE);
  console.log('  Scenario 7.1: seniority/CA excluded from gross, recovered at bank');
  check('Gross excludes seniority + CA(+)', p.grossSalaryUSD, 1000);
  check('Bank recovers seniority + CA(+)', p.netBankUSD, roundUSD(p.salaryAfterTaxUSD - 500 - 300));
}

console.log('\n=== 8. Approved Pre.Pay formula (user workbook) ===');
// Excel Pre.Pay: =ROUND(IF(AV="TT", Basic/2, IF(AV="UN", 0, IF(AV="ML", 0, IF(AV="T", Basic*1, ...)))), 2)
// SP/N return "check" in Excel -> app uses the Pre.Pay % / direct-USD override.
// W (app default) uses the same override so the Pre.Pay cell stays editable.
{
  check('TT -> Basic/2', computePrepayAmount(ftEmployee({ status: 'TT', basic: 1000 }), 1000), 500);
  check('UN -> 0', computePrepayAmount(ftEmployee({ status: 'UN', basic: 1000 }), 1000), 0);
  check('ML -> 0', computePrepayAmount(ftEmployee({ status: 'ML', basic: 1000 }), 1000), 0);
  check('SH -> 0', computePrepayAmount(ftEmployee({ status: 'SH', basic: 1000 }), 1000), 0);
  check('T -> Basic', computePrepayAmount(ftEmployee({ status: 'T', basic: 1000 }), 1000), 1000);
  check('W @ 100% -> Basic', computePrepayAmount(ftEmployee({ status: 'W', basic: 1000, prePayPct: 100 }), 1000), 1000);
  check('W @ 50% -> 500', computePrepayAmount(ftEmployee({ status: 'W', basic: 1000, prePayPct: 50 }), 1000), 500);
  check('SP @ 60% -> 600', computePrepayAmount(ftEmployee({ status: 'SP', basic: 1000, prePayPct: 60 }), 1000), 600);
  check('N direct USD override 700 -> 700', computePrepayAmount(ftEmployee({ status: 'N', basic: 1000, prePayPct: 700 }), 1000), 700);
}

console.log('\n=== 9. Semi-Full-Time Gross with editable Pre.Pay % ===');
{
  const p = computePayroll(ftEmployee({
    id: 6,
    employmentType: 'Semi-Full-Time',
    basic: 1000,
    hourlyRate: 5,
    scheduleHours: 20,
    afterSchool: 4,
    prePayPct: 50,
    status: 'W'
  }), EXCHANGE_RATE);
  console.log('  Scenario 9.1: SFT status W, Pre.Pay% = 50, 20h @ $5 + 4h after school @ $5');
  // Pre.Pay(500) + Amount(100) + After School(20) - NSSF(0) = 620
  check('Pre. Pay honoured (50% of 1000)', p.prepayAmount, 500);
  check('SFT Gross (USD)', p.grossSalaryUSD, 620);
  check('SFT Gross for Summary (USD)', p.grossForSummary, 620);
}
{
  const p = computePayroll(ftEmployee({
    id: 7,
    employmentType: 'Semi-Full-Time',
    basic: 2500,
    hourlyRate: 4,
    scheduleHours: 25,
    afterSchool: 6,
    nssf: 40,
    status: 'T'
  }), EXCHANGE_RATE);
  console.log('  Scenario 9.2: SFT status T (full Pre.Pay)');
  // Pre.Pay(2500) + Amount(100) + After School(24) - NSSF(40) = 2584
  check('Pre. Pay (T -> Basic)', p.prepayAmount, 2500);
  check('SFT Gross (USD)', p.grossSalaryUSD, 2584);
}

console.log('\n=== 10. NaN safety for legacy / imported records ===');
{
  const missing: any = ftEmployee({ id: 8, employmentType: 'Semi-Full-Time', basic: 1000, status: 'W' });
  delete missing.afterSchool;
  delete missing.hourlyRate;
  delete missing.scheduleHours;
  const p = computePayroll(missing, EXCHANGE_RATE);
  console.log('  Scenario 10.1: SFT record missing afterSchool/hourlyRate/scheduleHours');
  check('Gross Salary (USD) is not NaN', p.grossSalaryUSD, 1000);
  check('Salary to be Paid (KHR) is not NaN', p.salaryPaidKHR, 1000 * EXCHANGE_RATE);
}
{
  const missingPT: any = ftEmployee({ id: 9, employmentType: 'Part-Time', basic: 0, status: 'W' });
  delete missingPT.hourlyRate;
  delete missingPT.presentHours;
  const p = computePayroll(missingPT, EXCHANGE_RATE);
  console.log('  Scenario 10.2: Part-Time record missing hourlyRate/presentHours');
  check('Gross Salary (USD) is not NaN', p.grossSalaryUSD, 0);
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
