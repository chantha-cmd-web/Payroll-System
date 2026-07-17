# Cambodia Salary and Tax Calculator

A comprehensive, production-ready React application for calculating monthly salaries and taxes in Cambodia, adhering to the latest National Bank of Cambodia (NBC) exchange rates and General Department of Taxation (GDT) progressive tax brackets.

## Features

- **Full-Time, Semi-Full-Time, and Part-Time Support**: Calculates based on various employee types with specific logic for each.
- **Dynamic Exchange Rates**: Integrates NBC exchange rates for accurate KHR/USD conversions.
- **Excel/CSV Integration**: Supports importing employee data directly from `.xlsx` or `.csv` files for Attendance, Salary, and Status data.
- **GDT Progressive Tax Brackets**: Up-to-date calculation of Tax on Salary (TOS) according to Cambodian tax laws (0%-20% progressive for Khmer nationals, flat 20% for expatriates).
- **Client-Side Processing**: All processing is done securely within the browser.
- **Print & Export**: Export payroll data to printable payslips, Excel, CSV, or ABA/ACLEDA bank transfer files.
- **Dark Mode**: Automatic system theme detection with manual override.
- **Audit Trail**: Tracks all manual salary overrides with timestamps.
- **Offline Mode**: Simulated offline queue with synchronization support.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chantha-cmd-web/Payroll-System.git
   cd Payroll-System
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development Server

Run the development server locally:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### Building for Production

To build the application for production deployment:
```bash
npm run build
```
The compiled assets will be available in the `dist/` folder.

### Type Checking

Run TypeScript type checking:
```bash
npm run lint
```

## Project Structure

```
src/
  App.tsx                          # Main application component and state management
  main.tsx                         # React entry point
  index.css                        # Global styles (Tailwind CSS)
  types.ts                         # TypeScript type definitions
  components/
    LoginScreen.tsx                 # Authentication and MFA screen
    DashboardOverview.tsx           # Executive dashboard with widgets
    EmployeeMaster.tsx              # Employee CRUD and Excel import
    PayrollProcessor.tsx            # Core payroll calculation engine and spreadsheet view
    PayslipsView.tsx                # Payslip preview, print, and email
    ReportsExporter.tsx             # Export center (CSV, JSON, bank files)
    AuditTrail.tsx                  # Audit log viewer
    SettingsPanel.tsx               # System settings and configuration
    SystemAlertToast.tsx            # Toast notifications and biometric prompt
```

## Deployment

The application is a purely client-side Single Page Application (SPA). The built `dist/` directory can be deployed to any static hosting provider (e.g., Vercel, Netlify, GitHub Pages, Firebase Hosting).

### GitHub Pages

The project includes a GitHub Actions workflow that automatically builds and deploys to GitHub Pages on push to `main`.

## License

MIT
