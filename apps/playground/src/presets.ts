import { ImporterSchema, builtInValidators, builtInTransformers } from 'data-importer';

export interface PresetConfig {
  id: string;
  title: string;
  description: string;
  schema: ImporterSchema;
  sampleCsv: string;
  sampleTsv: string;
}

export const PRESETS: PresetConfig[] = [
  {
    id: 'customer',
    title: 'Customer Import',
    description: 'B2B/SaaS customer accounts with emails, phone validation, tiers, and credit balance.',
    schema: [
      {
        key: 'name',
        label: 'Company / Customer Name',
        type: 'string',
        required: true,
        aliases: ['client_name', 'organization', 'account_name'],
        transformers: [builtInTransformers.trim()]
      },
      {
        key: 'email',
        label: 'Work Email',
        type: 'email',
        required: true,
        unique: true,
        aliases: ['contact_email', 'email_address', 'mail'],
        validators: [builtInValidators.email()]
      },
      {
        key: 'phone',
        label: 'Phone Number',
        type: 'phone',
        aliases: ['telephone', 'contact_number', 'mobile'],
        validators: [builtInValidators.phone()]
      },
      {
        key: 'plan',
        label: 'Subscription Tier',
        type: 'enum',
        required: true,
        options: [
          { label: 'Free Tier', value: 'Free' },
          { label: 'Professional', value: 'Pro' },
          { label: 'Enterprise', value: 'Enterprise' }
        ]
      },
      {
        key: 'balance',
        label: 'Credit Balance ($)',
        type: 'number',
        aliases: ['account_balance', 'credits', 'balance_usd'],
        validators: [builtInValidators.min(0)]
      }
    ],
    sampleCsv: `Company / Customer Name,Work Email,Phone Number,Subscription Tier,Credit Balance ($)
Acme Logistics,billing@acmelogistics.io,+1 555-0199,Enterprise,$4500.00
Beacon Technologies,contact@beacontech.co,+1-800-555-0143,Pro,1250.50
Catalyst Corp,info@catalyst.org,invalid-phone-format,Free,0
Vertex Global,billing@acmelogistics.io,+44 20 7946 0991,Pro,300.00
Horizon Ventures,contact@horizon.ai,,Enterprise,8900.00
Echo Media,,+1 555-0182,Free,50.00
Omni Dynamic,sales@omnidynamic.com,+1 555-0164,Pro,$900.00`,
    sampleTsv: `Company / Customer Name\tWork Email\tPhone Number\tSubscription Tier\tCredit Balance ($)
Acme Logistics\tbilling@acmelogistics.io\t+1 555-0199\tEnterprise\t4500.00
Beacon Technologies\tcontact@beacontech.co\t+1-800-555-0143\tPro\t1250.50`
  },

  {
    id: 'employee',
    title: 'Employee Import',
    description: 'Human resources records with composite deduplication, salary constraints, and departments.',
    schema: [
      {
        key: 'employee_id',
        label: 'Employee ID',
        type: 'string',
        required: true,
        unique: true,
        aliases: ['staff_id', 'emp_no', 'badge_number']
      },
      {
        key: 'full_name',
        label: 'Full Name',
        type: 'string',
        required: true,
        aliases: ['employee_name', 'name', 'staff_name'],
        transformers: [builtInTransformers.trim(), builtInTransformers.capitalize()]
      },
      {
        key: 'email',
        label: 'Corporate Email',
        type: 'email',
        required: true,
        unique: true,
        validators: [builtInValidators.email()]
      },
      {
        key: 'department',
        label: 'Department',
        type: 'enum',
        required: true,
        options: [
          { label: 'Engineering', value: 'Engineering' },
          { label: 'Product', value: 'Product' },
          { label: 'Marketing', value: 'Marketing' },
          { label: 'Operations', value: 'Operations' },
          { label: 'Human Resources', value: 'HR' }
        ]
      },
      {
        key: 'salary',
        label: 'Annual Salary',
        type: 'number',
        validators: [builtInValidators.min(20000, 'Salary must be at least $20,000')]
      }
    ],
    sampleCsv: `Employee ID,Full Name,Corporate Email,Department,Annual Salary
EMP-101,eleanor vance,eleanor.vance@company.internal,Engineering,135000
EMP-102,marcus holloway,marcus.h@company.internal,Product,120000
EMP-103,clara oswin,clara.o@company.internal,Marketing,95000
EMP-104,arthur dent,arthur.dent@company.internal,Operations,15000
EMP-105,tara maclay,tara.m@not-an-email,Engineering,110000
EMP-101,duplicate emp,dup@company.internal,HR,80000`,
    sampleTsv: `Employee ID\tFull Name\tCorporate Email\tDepartment\tAnnual Salary
EMP-101\teleanor vance\teleanor.vance@company.internal\tEngineering\t135000`
  },

  {
    id: 'product',
    title: 'Product Import',
    description: 'E-commerce and inventory catalogs with SKU checks, price ranges, and stock quantities.',
    schema: [
      {
        key: 'sku',
        label: 'SKU Code',
        type: 'string',
        required: true,
        unique: true,
        aliases: ['item_code', 'product_sku', 'part_number']
      },
      {
        key: 'title',
        label: 'Product Title',
        type: 'string',
        required: true,
        aliases: ['item_name', 'product_name', 'description']
      },
      {
        key: 'category',
        label: 'Category',
        type: 'enum',
        options: [
          { label: 'Electronics', value: 'Electronics' },
          { label: 'Industrial', value: 'Industrial' },
          { label: 'Office Supplies', value: 'Office' }
        ]
      },
      {
        key: 'price',
        label: 'Unit Price',
        type: 'number',
        required: true,
        validators: [builtInValidators.min(0.01, 'Price must be positive')]
      },
      {
        key: 'stock',
        label: 'Stock Quantity',
        type: 'integer',
        validators: [builtInValidators.min(0)]
      }
    ],
    sampleCsv: `SKU Code,Product Title,Category,Unit Price,Stock Quantity
SKU-90210,Noise Cancelling Headphones,Electronics,299.99,142
SKU-88214,Ergonomic Mechanical Keyboard,Electronics,$149.50,55
SKU-11029,Anodized Aluminum Desk Lamp,Office Supplies,-10.00,80
SKU-55421,High-Torque Stepper Motor,Industrial,48.00,0
SKU-90210,Duplicate SKU Item,Office,25.00,10`,
    sampleTsv: `SKU Code\tProduct Title\tCategory\tUnit Price\tStock Quantity
SKU-90210\tNoise Cancelling Headphones\tElectronics\t299.99\t142`
  },

  {
    id: 'student',
    title: 'Student Import',
    description: 'Education platform enrollment with GPA scoring bounds and student registry validation.',
    schema: [
      {
        key: 'student_id',
        label: 'Student ID',
        type: 'string',
        required: true,
        unique: true,
        aliases: ['enrollment_id', 'matriculation_no']
      },
      {
        key: 'name',
        label: 'Student Name',
        type: 'string',
        required: true
      },
      {
        key: 'email',
        label: 'Student Email',
        type: 'email',
        required: true,
        validators: [builtInValidators.email()]
      },
      {
        key: 'grade_level',
        label: 'Grade Level',
        type: 'integer',
        validators: [builtInValidators.min(1), builtInValidators.max(12)]
      },
      {
        key: 'gpa',
        label: 'Cumulative GPA',
        type: 'number',
        validators: [builtInValidators.min(0.0), builtInValidators.max(4.0, 'GPA cannot exceed 4.0')]
      }
    ],
    sampleCsv: `Student ID,Student Name,Student Email,Grade Level,Cumulative GPA
STU-001,Lucas Sinclair,lucas@hawkins.edu,10,3.85
STU-002,Dustin Henderson,dustin@hawkins.edu,10,4.00
STU-003,Max Mayfield,max@hawkins.edu,10,3.60
STU-004,Will Byers,will@hawkins.edu,14,3.20
STU-005,Jane Hopper,eleven@invalid,9,4.50`,
    sampleTsv: `Student ID\tStudent Name\tStudent Email\tGrade Level\tCumulative GPA
STU-001\tLucas Sinclair\tlucas@hawkins.edu\t10\t3.85`
  }
];
