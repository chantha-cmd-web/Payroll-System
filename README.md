# Cambodia Salary and Tax Calculator

A comprehensive, production-ready React application for calculating monthly salaries and taxes in Cambodia, adhering to the latest National Bank of Cambodia (NBC) exchange rates and tax brackets.

## Features

- **Full-Time, Semi-Full-Time, and Part-Time Support**: Calculates based on various employee types with specific logic for each.
- **Dynamic Exchange Rates**: Integrates NBC exchange rates for accurate KHR/USD conversions.
- **Excel/CSV Integration**: Supports importing employee data directly from `.xlsx` or `.csv` files for Attendance, Salary, and Status data.
- **Tax Brackets**: Up-to-date calculation of Tax on Salary (TOS) according to Cambodian tax laws.
- **Client-Side Processing**: All processing is done securely within the browser.
- **Print & Export**: Export payroll data to printable views or directly back to spreadsheets.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation

1. Clone the repository
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
The compiled assets will be available in the `dist` folder.

## Project Structure

- `src/App.tsx`: Main application entry point and state management.
- `src/components/PayrollProcessor.tsx`: Core payroll calculation engine and table rendering.
- `src/components/SettingsPanel.tsx`: Configuration for exchange rates and processing variables.
- `src/utils/calculations.ts`: Logic for formatting and converting currencies and amounts.
- `src/types.ts`: TypeScript definitions for employee and payroll data structures.

## Deployment

The application is a purely client-side Single Page Application (SPA). The built `dist/` directory can be deployed to any static hosting provider (e.g., Vercel, Netlify, GitHub Pages, Firebase Hosting, Cloud Run with an nginx container).

## License

MIT
